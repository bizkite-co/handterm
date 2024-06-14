import HandTerm from '../components/HandTerm';
import Phrases from '../utils/Phrases';
import { ICommandContext } from './CommandContext';
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
    if (!_commandName) {
      return 'No command context available.';
    }
    // Logic to clear the command history from localStorage
    // Logic to clear the command history from context (state)
    const phrases = Phrases.getPhrases().join('\n');
    console.log("ListPhrasesCommand context", _handTerm);
    return phrases;
  }
};
