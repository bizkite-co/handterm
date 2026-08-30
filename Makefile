.PHONY: help
help: ## Display this help screen
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  \033[32m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# Application Tasks
# ==============================================================================

type-check: ## Run TypeScript type checking
	npm run type-check

dev-prepare: ## Prepare development environment
	npm run clean && npm install

dev-watch: ## Watch for changes and recompile
	npx vite

start: stop ## Run development server in background
	@echo "Starting Vite server..."; \
	nohup npx vite --no-open > vite.log 2>&1 & \
	echo $$! > vite.pid; \
	echo "Vite server started with PID $$(cat vite.pid)"; \
	url=""; \
	for i in $$(seq 1 40); do \
		url=$$(grep -m1 -oE 'http://localhost:[0-9]+/' vite.log 2>/dev/null || true); \
		if [ -n "$$url" ]; then break; fi; \
		sleep 0.25; \
	done; \
	if [ -n "$$url" ]; then \
		printf '\033[36mOpen in browser: %s\033[0m\n' "$$url"; \
	else \
		echo "Vite did not report a URL quickly; see vite.log"; \
	fi

stop: ## Stop development server
	@echo "Attempting to stop all Vite processes using pkill..."
	-pkill -f vite
	@echo "Vite processes stopped. Checking status..."
	echo "Vite server stopped" > vite.log 2>&1
	@make status

status: ## Get development server status
	@ps aug | rg vite
	@cat vite.log

build-package: ## Build packages
	cd packages/types && rm -rf dist && npm run build && cd - && npm install --legacy-peer-deps

build: ## Build the project
	npm run build:package && npx vite build

clean: ## Clean project artifacts
	rm -rf dist && rm -rf node_modules && npm cache verify

inspect: ## Inspect project
	npx tsx scripts/inspect.ts

list-types: ## List project types
	tsx list-types.ts > project-types.lst

lint: ## Run ESLint
	npx eslint . --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0

lint-file: ## Run ESLint on a specific file
	npx eslint $1 --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0

lint-save: ## Run ESLint and save results to JSON
	npx eslint . --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0 -f json > eslint-results.json

lint-get-files: ## Get linting files with errors or warnings
	jq -c '[.[] | select(.errorCount > 0 or .warningCount > 0) | { filePath: .filePath, errorCount: .errorCount, warningCount: .warningCount }]' eslint-files.json > eslint-files.json

lint-get-files-csv: ## Get linting files with errors as CSV
	jq -r 'sort_by(.errorCount) | reverse | .[] | select(.errorCount > 0) | [.errorCount, .filePath] | @csv' eslint-files.json > eslint-files.csv

lint-save-files: ## Run ESLint, save results, and get files with errors
	npm run lint:save; sleep 2 && npm run lint:get-files && npm run lint:get:files-csv

lint-fix-file: ## Fix linting errors in a specific file
	npx eslint --fix

lint-types: ## Run TypeScript type checking for linting
	npx tsc --noEmit

lint-style: ## Check code style with Prettier
	prettier --check "src/**/*.{ts,tsx,js,jsx}"

pretest: ## Run pre-test script
	bash scripts/check_jsdoc_removals.sh

test: test-unit ## Run unit tests
	@echo "Running the unit tests"

test-all: ## Run all tests (unit and e2e)
	npm run test:unit; npm run test:e2e

test-unit: ## Run unit tests
	mkdir -p vitest-output; rm -rf vitest-output/*; npx vitest --run

test-unit-save: ## Run unit tests and save results to JSON
	mkdir -p vitest-output; rm -rf vitest-output/*; vitest --run --reporter=json --outputFile=./vitest-output/vitest.json

test-save: ## Run tests and save results to a temporary file
	npm run test > temp/workig-tree-test-results.txt

test-ui: ## Run Vitest UI
	vitest --ui

test-playwright: ## Run Playwright tests
	npx playwright test

test-e2e: ## Run end-to-end tests
	mkdir -p test-results; PLAYWRIGHT_OUTPUT_DIR=test-results PLAYWRIGHT_REPORTERS='junit' PLAYWRIGHT_JUNIT_OUTPUT_NAME='test-results/playwright.xml' PLAYWRIGHT_TEST=1 npx playwright test

test-e2e-save: ## Run end-to-end tests and save results to a temporary file
	echo $(date +'%Y%m%d%H%M%S') > temp/e2e_tests_workig-tree.txt && PLAYWRIGHT_TEST=1 npx playwright test >> temp/e2e_tests_workig-tree.txt

test-coverage: ## Run Vitest with coverage
	vitest run --coverage

validate: ## Validate code with linting and tests
	npm run lint && npm run lint:types && npm run lint:style && npm run test

deploy: ## Deploy to GitHub Pages
	npx gh-pages -d dist --cname handterm.com

# ==============================================================================
# Cognito User Management (delegates to handterm-cdk)
# ==============================================================================

.PHONY: cognito-list cognito-reset cognito-create

cognito-list: ## List all Cognito users
	$(MAKE) -C ../handterm-cdk list-users

cognito-reset: ## Reset Cognito password (usage: make cognito-reset USER=myuser PASSWORD=P@ssw0rd!)
ifndef USER
	$(error USER is required. Usage: make cognito-reset USER=myuser PASSWORD=P@ssw0rd!)
endif
ifndef PASSWORD
	$(error PASSWORD is required. Usage: make cognito-reset USER=myuser PASSWORD=P@ssw0rd!)
endif
	$(MAKE) -C ../handterm-cdk reset-password USER=$(USER) PASSWORD=$(PASSWORD)

cognito-create: ## Create Cognito user (usage: make cognito-create USER=myuser EMAIL=my@email.com PASSWORD=P@ssw0rd!)
ifndef USER
	$(error USER is required. Usage: make cognito-create USER=myuser EMAIL=my@email.com PASSWORD=P@ssw0rd!)
endif
ifndef EMAIL
	$(error EMAIL is required. Usage: make cognito-create USER=myuser EMAIL=my@email.com PASSWORD=P@ssw0rd!)
endif
ifndef PASSWORD
	$(error PASSWORD is required. Usage: make cognito-create USER=myuser EMAIL=my@email.com PASSWORD=P@ssw0rd!)
endif
	$(MAKE) -C ../handterm-cdk create-user USER=$(USER) EMAIL=$(EMAIL) PASSWORD=$(PASSWORD)

format: ## Format code with Prettier
	prettier --write "src/**/*.{ts,tsx,js,jsx}"

preview: ## Preview the build locally
	npx vite preview

restart-status: ## Restart status checks
	concurrently -n 'TYPES,LINT,CHECKLIST' -c 'bgBlue.bold,bgMagenta.bold,bgGreen.bold' "npm run type-check 2>&1 | tee .type-errors.log" "npm run lint" "node scripts/checklist-status.js"

update-type-imports: ## Update type imports
	node scripts/dist/update-type-imports.js
