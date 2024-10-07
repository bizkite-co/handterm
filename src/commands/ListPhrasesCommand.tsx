import GamePhrases from '../utils/GamePhrases';
import { ICommand, ICommandContext } from '../contexts/CommandContext';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';

export const ListPhrasesCommand: ICommand = {
  name: 'ls',
  description: 'List files',
  switches: {
    'all': 'List all phrases',
    'random': 'List a random phrase',
    'easy': 'List only easy phrases',
  },
  execute: (
    _commandName: string, 
    context: ICommandContext,
    _args?: string[], 
    _switches?: Record<string, boolean | string>,
  ) => {
    if (!context) {
      return { status: 404, message: 'No command context available.'};
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    const phrases = GamePhrases
      .phrases
      .map(x => x.key)
      .join('\n');

      context.saveCommandResponseHistory(_commandName, phrases, 200);
    return { status: 200, message: phrases};
  }
};
