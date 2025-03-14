## Goal

Connect the Handterm terminal to a WebContainer instance and enable basic command execution (e.g., `ls`) within the WebContainer.

## Steps

1.  **Install `@webcontainer/api`:** (Done) Install the `@webcontainer/api` package as a project dependency. This is a subtask of #68.
2.  **Basic Integration:**
    *   Import the necessary modules from `@webcontainer/api` in `src/components/HandTermWrapper.tsx`.
    *   Create a basic WebContainer instance within the `HandTermWrapper` component.
    *   Implement a basic command execution mechanism (e.g., a specific terminal command like `wcls` to execute `ls` in the WebContainer) that sends the command `ls` to the WebContainer.
    *   Display the output from the WebContainer in the Handterm terminal.
3. **Interim Tests:** Create tests after each integration step to ensure functionality:
    *   Test the successful initialization of the WebContainer.
    *   Test the execution of the `ls` command and verify the output.
4. **Further Integration:** (Future steps, to be detailed later)
    * Connect the existing terminal input to the WebContainer, allowing arbitrary command execution.
