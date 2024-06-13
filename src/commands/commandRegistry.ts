import { ICommand } from './ICommand';
import { CommandHooks } from './commandHooks';

class CommandRegistry {
    private commands: Record<string, ICommand> = {};
    private hooks: CommandHooks = {};

    register(command: ICommand) {
        this.commands[command.name] = command;
        if (command.hook) {
            this.hooks[command.name] = command.hook;
        }
    }

    getCommandHook(name: string) {
        return this.hooks[name];
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