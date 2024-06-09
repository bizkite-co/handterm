
interface ICommand {
  name: string;
  description: string;
  execute: (args: string[], switches?: Record<string, boolean | string>) => string;
  switches?: Record<string, string>; // Switches with their descriptions
}

class CommandRegistry {
  private commands: Record<string, ICommand> = {};

  register(command: ICommand) {
    this.commands[command.name] = command;
  }

  getCommand(name: string): ICommand | undefined {
    return this.commands[name];
  }

  getHelp(filter?: string): string {
    return Object.values(this.commands)
      .filter(cmd => !filter || cmd.name.includes(filter))
      .map(cmd => `${cmd.name}: ${cmd.description}`)
      .join('\n');
  }
}