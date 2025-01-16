- [x] Create git diff of older working MonacoEditor.tsx
- [x] Analyze differences between old and new MonacoEditor implementations
- [x] Update MonacoEditor imports to use Qovery library pattern
- [x] Restore @monaco-editor/react package
- [x] Consolidate all Monaco imports to use @monaco-editor/react
- [ ] Fix lint errors in MonacoEditor.tsx
- [ ] Restore file editing functionality
- [ ] Restore file navigation features
  - [ ] Implement basic tree navigation
  - [ ] Add keyboard controls for tree navigation
  - [ ] Creat a Playwright test that loads a mock file tree and verifies navigation. 
- [ ] Restore file saving implementation
  - [ ] Restore GitHub save functionality
  - [ ] Verify save integration with GitHubCommand
- [ ] Verify MonacoEditor functionality matches github-save version
  - [ ] Verify Vim mode integration
  - [ ] Test all editor modes
- [ ] Update related files to match new implementation
- [ ] Test MonacoEditor integration with other components
  - [ ] Test with GitHubCommand
  - [ ] Test with CommandContext
- [ ] Document changes and update component documentation
  - [ ] Update MonacoEditor.md
  - [ ] Add Vim mode documentation

## Understanding
The Monaco Editor component was previously working using @monaco-editor/react package but was changed during linting/cleanup. We need to:
1. Revert to using @monaco-editor/react
2. Update the component implementation to use React-specific hooks
3. Ensure proper editor functionality

## Plan
1. Add @monaco-editor/react dependency
2. Update MonacoEditor.tsx to use React-specific implementation
3. Fix any linting errors
4. Verify editor functionality

## Next Steps
1. Add @monaco-editor/react to package.json
2. Read current MonacoEditor.tsx implementation
3. Compare with previous working version
4. Update implementation
