## Goal

Connect the Handterm terminal to a WebContainer instance and enable basic command execution (e.g., `ls`) within the WebContainer.

## Progress

The following steps have been completed:

* [X] ~~*1.  Installed `@webcontainer/api`: The package is installed as a project dependency.*~~ [2025-03-14]
* [X] ~~*2.  **Installed and configured `vite-plugin-cross-origin-isolation`:** This plugin sets the necessary headers (`Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy`) for WebContainer to function correctly in the development environment.*~~ [2025-03-14]
* [X] ~~*3.  **Created `wcls` command:** A new command (`wcls`) has been created to execute `ls` within the WebContainer.*~~ [2025-03-14]
* [X] ~~*4.  **Moved WebContainer initialization to `src/main.tsx`:** This ensures that only a single WebContainer instance is created, addressing the "Only a single WebContainer instance can be booted" error.*~~ [2025-03-14]
* [X] ~~*5.  **Updated types and interfaces:** Modified `ICommandContext` and `ICommandResponse` to support WebContainer command output.*~~ [2025-03-14]
* [X] ~~*6. **Modified HandtermWrapper and CommandProvider:** Removed state for webcontainer and added ref.*~~ [2025-03-14]

## Encountered Issues

1.  **Multiple WebContainer Instances:** Initially, the WebContainer was being initialized multiple times due to component re-renders. This was addressed by moving the initialization to `src/main.tsx` and storing the instance in a global variable.
2.  **Incorrect Output Handling:** The output from the `wcls` command was initially being treated as an error and displayed in the HTML Output element instead of the terminal. This was addressed by adding a `type` field to the `ICommandResponse` interface and modifying the `useCommand` hook to handle WebContainer output differently, writing it directly to the terminal.
3. **Vite Configuration Conflicts:** Changes to `vite.config.ts` might have introduced incompatibilities with other projects in the same workspace, causing errors during `npm run dev`. This needs further investigation.
4. **Lingering Type Errors:** There are still some type errors in `src/commands/wclsCommand.ts` related to the `Uint8Array` type, which need to be resolved.

## Next Steps

* [ ] 1.  **Investigate and fix remaining type errors:** Address the type errors in `src/commands/wclsCommand.ts`.
* [ ] 2.  **Implement interim tests:** Create tests to verify:
    * [ ]   Successful WebContainer initialization.
    * [ ]   Execution of the `wcls` command and correct output in the terminal.
* [ ] 3.  **Refactor command handling (potential):** Consider refactoring the command handling logic in `useCommand` to be more robust and better handle different output types.
* [ ] 4. **Investigate Vite configuration conflicts:** If the errors in other projects persist, investigate the changes made to `vite.config.ts` and find a solution that works for all projects.
* [ ] 5.  **Further Integration:** Once the basic functionality is stable and tested, proceed with further integration steps, such as connecting the existing terminal input to the WebContainer.
* [ ] 6. **Implement WebContainer Context Manager:** Create React context for WebContainer lifecycle management (Issue #70)
* [ ] 7. **Add Mode Switching:** Update CommandProvider with WebContainer/normal mode state transitions (Issue #71)
* [ ] 8. **Modify Terminal Output Handling:** Update Xterm.js integration for raw WebContainer output streaming
* [ ] 9. **Update Command Routing:** Implement dual pipeline support for WebContainer vs normal commands
