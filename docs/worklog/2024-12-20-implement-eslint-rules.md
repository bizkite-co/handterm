---
title: Implement ESLint Rules
description: Implement and fix ESLint rules according to the documented standards
date: 2024-12-20
---

## Task List

The following files have linting issues that need to be fixed according to the documented ESLint rules. You can find the rules in the `docs/linting` directory.

Read the `./eslint-files.json` list of errors.

Use `src/utils/typeSafetyUtils.ts` for type safety errors. Add new general use functions to apply type safety, when appropriate.

**NOTE:** Checkbox completions are per-line, not per-group.

After fixin the errors in a file:

1. Mark it complete in this list.
2. Add the file to staged changes in Git.

### Configuration Files

- [x] `playwright.config.ts` (4 errors)
- [x] `vite.config.ts` (7 errors)
- [x] `vitest.config.ts` (20 errors)
- [x] `webpack.lambda.config.js` (1 error)
- [x] `scripts/clearLocalStorage.js` (1 error)

### Source Files

- [x] `src/App.tsx` (8 errors, 2 warnings)
- [x] `src/main.tsx` (15 errors)

### Components

- [x] `src/components/HandTermWrapper.tsx` (46 errors, 2 warnings)
- [x] `src/components/MonacoEditor.tsx` (15 errors)
- [x] `src/components/NextCharsDisplay.tsx` (35 errors, 1 warning)
- [x] `src/components/CommandOutput.tsx` (0 errors, 3 warnings)
- [x] `src/components/Timer.tsx` (0 errors, 2 warnings)
- [x] `src/components/TutorialManager.tsx` (0 errors, 3 warnings)
- [x] `src/components/WpmTable.tsx` (0 errors, 1 warning)

### Commands

- [x] `src/commands/GitHubCommand.ts` (0 errors, 14 warnings)
- [x] `src/commands/wrtCommand.tsx` (0 errors, 13 warnings)
- [x] `src/commands/cleanCommand.ts` (16 errors)
### Game
- [x] src/game/Game.tsx (32 errors, 1 warning)
- [x] src/game/types/ActionTypes.ts (25 errors)
- [x] src/game/useBaseCharacter.tsx (14 errors)
- [x] src/game/sprites/Sprite.tsx (12 errors)

### Hooks
- [x] src/hooks/useActivityMediator.ts (27 errors)
- [x] src/hooks/useAuth.ts (25 errors)
- [x] src/hooks/useTerminal.ts (25 errors, 1 warning)
- [x] src/hooks/useAPI.ts (20 errors)
- [ ] src/hooks/useCommand.ts (14 errors)

### Utils
- [ ] src/utils/apiClient.ts (39 errors)
- [ ] src/utils/commandUtils.ts (21 errors)
- [ ] src/utils/fileIcons.ts (21 errors)
- [ ] src/utils/navigationUtils.ts (15 errors)
- [ ] src/utils/WebCam.tsx (13 errors)
- [ ] src/utils/treeFormatter.ts (12 errors)

### Signals
- [ ] src/signals/appSignals.ts (32 errors)
- [ ] src/signals/gameSignals.ts (29 errors)
- [ ] src/signals/tutorialSignals.ts (11 errors)
- [ ] src/signals/commandLineSignals.ts (7 errors)

### Tests
- [ ] src/commands/__tests__/LoginCommand.test.tsx (7 errors)
- [ ] src/game/__tests__/Game.test.tsx (9 errors)
- [ ] src/test-utils/test-utils.tsx (9 errors, 5 warnings)

### Types
- [ ] src/types/Types.ts (11 errors)
- [ ] src/types/HandTerm.d.ts (6 errors)

### E2E Tests
- [ ] src/e2e/page-objects/TerminalPage.ts (13 errors)

## Strategy

1. Start with configuration files since they affect the build process
2. Move on to core files (App.tsx, main.tsx)
3. Fix components, starting with those that have the most errors
4. Address hooks and utils which contain business logic
5. Fix game-related files
6. Update tests last, as they may need to be adjusted based on changes to the code they test

For each file:
2. Fix each error according to the documented rules
3. Re-run linting to verify fixes
4. Update checkboxes in this document as files are fixed
