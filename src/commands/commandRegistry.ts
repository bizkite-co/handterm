import { ICommand } from './ICommand';

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
            .map(cmd => {
                const commandHelp = `${cmd.name}: ${cmd.description}`;
                const switchesHelp = cmd.switches
                    ? '\n' + Object.entries(cmd.switches)
                        .map(([name, desc]) => `  --${name}: ${desc}`)
                        .join('\n')
                    : '';
                return commandHelp + switchesHelp;
            })
            .join('\n\n');
    }
}

export const commandRegistry = new CommandRegistry();