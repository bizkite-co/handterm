import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { Phrases, GamePhrase, ParsedCommand } from '../types/Types';

export const ListPhrasesCommand: ICommand = {
  name: 'ls',
  description: 'List files',
  switches: {
    'all': 'List all phrases',
    'random': 'List a random phrase',
    'easy': 'List only easy phrases',
  },
  execute: async (
    context: ICommandContext,
    _parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    if (!context) {
      return { status: 404, message: 'No command context available.' };
    }

    const phrases: string = Phrases
      .map((phrase: GamePhrase) => phrase.key)
      .join('\n');

    return {
      status: 200,
      message: phrases
    };
  }
};
