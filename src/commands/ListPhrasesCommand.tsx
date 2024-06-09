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
  execute: (args: string[]) => {
    console.log('ListPhrasesCommand called with args:', args);
    // Command logic here
    const phrases = Phrases.getPhrases();
    const response = phrases.join('<br/>');
    return response;
  },
};
