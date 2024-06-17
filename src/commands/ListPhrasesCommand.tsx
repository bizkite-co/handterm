import HandTerm from '../components/HandTerm';
import Phrases from '../utils/Phrases';
import { ICommand } from './ICommand';

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
    _args?: string[], 
    _switches?: Record<string, boolean | string>,
    _handTerm?: HandTerm 
  ) => {
    if (!_handTerm) {
      return { status: 404, message: 'No command context available.'};
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    const phrases = Phrases.phrases.join('\n');
    _handTerm?.saveCommandResponseHistory(_commandName, phrases, 200);
    return { status: 200, message: phrases};
  }
};
