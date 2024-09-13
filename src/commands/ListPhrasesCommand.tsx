import Phrases from '../utils/Phrases';
import { ICommand } from './ICommand';
import { IHandTermMethods } from '../components/HandTerm';

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
    _handTerm?: React.RefObject<IHandTermMethods>
  ) => {
    if (!_handTerm) {
      return { status: 404, message: 'No command context available.'};
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    const phrases = Phrases
      .phrases
      .map(x => x.key)
      .join('\n');

    if (_handTerm && _handTerm.current) {
      _handTerm.current.saveCommandResponseHistory(_commandName, phrases, 200);
      _handTerm.current.prompt();
    }
    return { status: 200, message: phrases};
  }
};
