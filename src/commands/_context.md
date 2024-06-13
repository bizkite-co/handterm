# React Command Context Implementation

That's the power of combining a `CommandRegistry` with React context. You can register any number of commands in the `CommandRegistry`, and then, by using the `CommandContext`, you can execute these commands from anywhere within your application.

Here's a simplified example of how this could work:

1. Register commands in the `CommandRegistry`:

```tsx
// src/commands/commandRegistry.ts
import { ICommand } from './ICommand';

class CommandRegistry {
  private commands: Record<string, ICommand> = {};

  register(command: ICommand) {
    this.commands[command.name] = command;
  }

  getCommand(name: string): ICommand | undefined {
    return this.commands[name];
  }
}

export const commandRegistry = new CommandRegistry();

// src/commands/registerCommands.ts
import { commandRegistry } from './commandRegistry';
import { clearCommand } from './clearCommand';
// ... import other commands

// Register all your commands
commandRegistry.register(clearCommand);
// ... register other commands
```

2. Provide the command execution logic through the `CommandContext`:

```tsx
// src/commands/CommandProvider.tsx
import React, { useCallback, useMemo } from 'react';
import { CommandContext } from './CommandContext';
import { commandRegistry } from './commandRegistry';

export const CommandProvider: React.FC = ({ children }) => {
  const executeCommand = useCallback((commandName: string, args: string[]) => {
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      // Execute the command and return the result
      return command.execute(args);
    }
    return `Command not found: ${commandName}`;
  }, []);

  // Provide the context with the executeCommand function
  const contextValue = useMemo(() => ({
    executeCommand
  }), [executeCommand]);

  return (
    <CommandContext.Provider value={contextValue}>
      {children}
    </CommandContext.Provider>
  );
};
```

3. Use the context in your components:

```tsx
// src/components/SomeComponent.tsx
import React, { useContext } from 'react';
import { CommandContext } from '../commands/CommandContext';

export const SomeComponent: React.FC = () => {
  const { executeCommand } = useContext(CommandContext);

  // Example of executing a command
  const handleUserAction = () => {
    const output = executeCommand('clear', []);
    console.log(output);
  };

  // ... your component logic and JSX

  return <button onClick={handleUserAction}>Clear Command History</button>;
};
```

4. Wrap your app with the `CommandProvider`:

```tsx
// src/App.tsx
import React from 'react';
import { CommandProvider } from './commands/CommandProvider';
import { SomeComponent } from './components/SomeComponent';
// ... other imports

const App: React.FC = () => {
  // ... other state and logic

  return (
    <CommandProvider>
      <SomeComponent />
      {/* ... other components */}
    </CommandProvider>
  );
};
```

This setup allows you to execute any of the 30 or 50 commands you've registered from anywhere in your app. You just need to use the `executeCommand` function provided by the `CommandContext`. This keeps your command-handling logic centralized and

2. With the `Context` approach, you can indeed pass user input directly to `executeCommand()`, and this method can parse the input, identify the command, and execute it with arguments. 

Here's how you might handle dynamic command execution with arguments using context:

```tsx
// src/commands/CommandContext.tsx
import React, { createContext, useContext } from 'react';
import { commandRegistry } from './commandRegistry';

export interface ICommandContext {
  executeCommand: (input: string) => string;
}

export const CommandContext = createContext<ICommandContext | null>(null);

export const useCommands = () => {
  const context = useContext(CommandContext);
  if (!context) {
    throw new Error('useCommands must be used within a CommandProvider');
  }
  return context;
};

export const CommandProvider: React.FC = ({ children }) => {
  const executeCommand = (input: string): string => {
    const [commandName, ...args] = input.split(' ');
    const command = commandRegistry.getCommand(commandName);
    if (command) {
      return command.execute(args);
    }
    return `Command not found: ${commandName}`;
  };

  return (
    <CommandContext.Provider value={{ executeCommand }}>
      {children}
    </CommandContext.Provider>
  );
};
```

In this example, `executeCommand` is a function that takes the entire user input as a string. It splits the input to separate the command name from its arguments and then looks up the command in the `CommandRegistry` to execute it with the provided arguments.

Components that need to execute commands can use the `useCommands` hook to access `executeCommand` and call it directly with user input:

```tsx
// src/components/SomeComponent.tsx
import React from 'react';
import { useCommands } from '../commands/CommandContext';

const SomeComponent: React.FC = () => {
  const { executeCommand } = useCommands();

  const handleUserInput = (input: string) => {
    const output = executeCommand(input);
    // Do something with the output
  };

  // Render your component and handle user input
};
```

This setup provides the flexibility to execute commands dynamically based on user input, including any arguments the user may provide. It's particularly useful in scenarios like a TUI or CLI where you want to parse user input at runtime and invoke different commands without hardcoding function calls.