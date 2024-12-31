import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { Phrases, type GamePhrase, type ParsedCommand } from '../types/Types';

export const ListPhrasesCommand: ICommand = {
  name: 'ls',
  description: 'List files',
  switches: {
    'all': 'List all phrases',
    'random': 'List a random phrase',
    'easy': 'List only easy phrases',
  },
  execute: (
    context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    if (context === null || context === undefined) {
      return Promise.resolve({ status: 404, message: 'No command context available.' });
    }

    const phrases: string = Phrases
      .map((phrase: GamePhrase) => phrase.key)
      .join('\n');

    return Promise.resolve({
      status: 200,
      message: phrases
    });
  }
};
