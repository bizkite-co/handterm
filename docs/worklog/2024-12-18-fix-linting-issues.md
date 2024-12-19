---
title: Fix Linting Issues
description: Address ESLint errors across the codebase
date: 2024-12-18
---

## Work Items

- [x] Fix src/types/TerminalTypes.ts (53 errors)
- [ ] Fix src/hooks/useAuth.ts (42 errors)
- [ ] Fix src/utils/apiClient.ts (37 errors)
- [ ] Fix src/signals/appSignals.ts (31 errors)
- [ ] Fix src/components/NextCharsDisplay.tsx (9 errors)
- [ ] Fix src/signals/gameSignals.ts (27 errors)
- [ ] Fix src/components/HandTermWrapper.tsx (24 errors)
- [ ] Fix src/game/Game.tsx (24 errors)
- [ ] Fix src/hooks/useActivityMediator.ts (23 errors)
- [ ] Fix remaining files with fewer errors

## Approach

1. Start with files having the most errors
2. Use `npm run lint -- <filepath>` to check individual files
3. Follow the linting rules specified in LINTING.md:
   - Ensure type safety
   - Handle promises properly
   - Follow naming conventions
   - Organize imports correctly
   - Apply React best practices
   - Maintain testing standards

Progress will be tracked by updating checkboxes as files are fixed.
