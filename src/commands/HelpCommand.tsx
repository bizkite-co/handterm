
const HelpCommand: ICommand = {
  name: 'help',
  description: 'Display help information',
  execute: (args: string[]) => {
    return commandTextToHTML(commandRegistry.getHelp(args[0]));
  },
};

// Register the help command
commandRegistry.register(HelpCommand);