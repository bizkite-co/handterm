---
title: Implement ESLint Rules
description: Implement and fix ESLint rules according to the documented standards
date: 2024-12-20
---

## Task List

The following files have linting issues that need to be fixed according to the documented ESLint rules:

### Configuration Files
- [x] playwright.config.ts (4 errors)
- [x] vite.config.ts (7 errors)
- [x] vitest.config.ts (20 errors)
- [x] webpack.lambda.config.js (1 error)
- [x] scripts/clearLocalStorage.js (1 error)

### Source Files
- [x] src/App.tsx (8 errors, 2 warnings)
- [ ] src/main.tsx (15 errors)

### Components
- [ ] src/components/HandTermWrapper.tsx (46 errors, 2 warnings)
- [ ] src/components/MonacoEditor.tsx (15 errors)
- [ ] src/components/NextCharsDisplay.tsx (35 errors, 1 warning)
- [ ] src/components/CommandOutput.tsx (8 errors, 1 warning)
- [ ] src/components/Timer.tsx (9 errors)
- [ ] src/components/TutorialManager.tsx (7 errors)
- [ ] src/components/WpmTable.tsx (6 errors)

### Commands
- [ ] src/commands/GitHubCommand.ts (18 errors)
- [ ] src/commands/wrtCommand.tsx (18 errors)
- [ ] src/commands/cleanCommand.ts (16 errors)
- [ ] src/commands/archiveCommand.ts (10 errors)
- [ ] src/commands/clearCommand.tsx (9 errors)
- [ ] src/commands/SpecialCommand.tsx (9 errors, 1 warning)

### Game
- [ ] src/game/Game.tsx (32 errors, 1 warning)
- [ ] src/game/types/ActionTypes.ts (25 errors)
- [ ] src/game/useBaseCharacter.tsx (14 errors)
- [ ] src/game/sprites/Sprite.tsx (12 errors)

### Hooks
- [ ] src/hooks/useActivityMediator.ts (27 errors)
- [ ] src/hooks/useAuth.ts (25 errors)
- [ ] src/hooks/useTerminal.ts (25 errors, 1 warning)
- [ ] src/hooks/useAPI.ts (20 errors)
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
