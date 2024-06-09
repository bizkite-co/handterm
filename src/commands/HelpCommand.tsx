import { ICommand } from './ICommand';


export const HelpCommand: ICommand = {
  name: 'help',
  description: 'Display help information',
  hook: 'useHelpCommand',
};
