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
	vite

dev: ## Run development server in background
	nohup vite --no-open > vite.log 2>&1 & echo $! > vite.pid

dev-stop: ## Stop development server
	kill $(cat vite.pid) && rm vite.pid

dev-status: ## Get development server status
	ps -p $(cat vite.pid) && cat vite.log

build-package: ## Build packages
	cd packages/types && rm -rf dist && npm run build && cd - && npm install --legacy-peer-deps

build: ## Build the project
	npm run build:package && vite build

clean: ## Clean project artifacts
	rm -rf dist && rm -rf node_modules && npm cache verify

inspect: ## Inspect project
	npx tsx scripts/inspect.ts

list-types: ## List project types
	tsx list-types.ts > project-types.lst

lint: ## Run ESLint
	eslint . --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0

lint-file: ## Run ESLint on a specific file
	eslint $1 --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0

lint-save: ## Run ESLint and save results to JSON
	eslint . --ext .js,.jsx,.ts,.tsx --report-unused-disable-directives --max-warnings 0 -f json > eslint-results.json

lint-get-files: ## Get linting files with errors or warnings
	jq -c '[.[] | select(.errorCount > 0 or .warningCount > 0) | { filePath: .filePath, errorCount: .errorCount, warningCount: .warningCount }]' eslint-files.json > eslint-files.json

lint-get-files-csv: ## Get linting files with errors as CSV
	jq -r 'sort_by(.errorCount) | reverse | .[] | select(.errorCount > 0) | [.errorCount, .filePath] | @csv' eslint-files.json > eslint-files.csv

lint-save-files: ## Run ESLint, save results, and get files with errors
	npm run lint:save; sleep 2 && npm run lint:get-files && npm run lint:get:files-csv

lint-fix-file: ## Fix linting errors in a specific file
	eslint --fix

lint-types: ## Run TypeScript type checking for linting
	tsc --noEmit

lint-style: ## Check code style with Prettier
	prettier --check "src/**/*.{ts,tsx,js,jsx}"

pretest: ## Run pre-test script
	bash scripts/check_jsdoc_removals.sh

test: ## Run unit tests
	npm run test:unit

test-all: ## Run all tests (unit and e2e)
	npm run test:unit; npm run test:e2e

test-unit: ## Run unit tests
	mkdir -p vitest-output; rm -rf vitest-output/*; vitest --run

test-unit-save: ## Run unit tests and save results to JSON
	mkdir -p vitest-output; rm -rf vitest-output/*; vitest --run --reporter=json --outputFile=./vitest-output/vitest.json

test-save: ## Run tests and save results to a temporary file
	npm run test > temp/workig-tree-test-results.txt

test-ui: ## Run Vitest UI
	vitest --ui

test-e2e: ## Run end-to-end tests
	mkdir -p test-results; PLAYWRIGHT_OUTPUT_DIR=test-results PLAYWRIGHT_REPORTERS='junit' PLAYWRIGHT_JUNIT_OUTPUT_NAME='test-results/playwright.xml' PLAYWRIGHT_TEST=1 npx playwright test

test-e2e-save: ## Run end-to-end tests and save results to a temporary file
	echo $(date +'%Y%m%d%H%M%S') > temp/e2e_tests_workig-tree.txt && PLAYWRIGHT_TEST=1 npx playwright test >> temp/e2e_tests_workig-tree.txt

test-coverage: ## Run Vitest with coverage
	vitest run --coverage

validate: ## Validate code with linting and tests
	npm run lint && npm run lint:types && npm run lint:style && npm run test

deploy: ## Deploy to GitHub Pages
	gh-pages -d dist

format: ## Format code with Prettier
	prettier --write "src/**/*.{ts,tsx,js,jsx}"

preview: ## Preview the build locally
	vite preview

restart-status: ## Restart status checks
	concurrently -n 'TYPES,LINT,CHECKLIST' -c 'bgBlue.bold,bgMagenta.bold,bgGreen.bold' "npm run type-check 2>&1 | tee .type-errors.log" "npm run lint" "node scripts/checklist-status.js"

update-type-imports: ## Update type imports
	node scripts/dist/update-type-imports.js