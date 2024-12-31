import ReactDOMServer from 'react-dom/server';

import { Chord } from '../components/Chord';
import { type ICommand, type ICommandResponse , type ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

export const HelpCommand: ICommand = {
  name: 'help',
  description: 'Display help information',
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    if (
      parsedCommand.command === 'help'
      || parsedCommand.command === '411'
    ) {
      const commandChords = [
        'DELETE (Backspace)',
        'Return (ENTER)',
        'UpArrow',
        'LeftArrow',
        'DownArrow',
        'RightArrow',
        'ESCAPE',
      ].map(c => {
        return <Chord key={c} displayChar={c} />;
      });
      const commandChordsHtml = commandChords.map(element => {
        return ReactDOMServer.renderToStaticMarkup(element);
      }).join('');
      const response = "<div class='chord-display-container'>" + commandChordsHtml + "</div>";
      return { status: 200, message: response };
    }
    return { status: 404, message: "Help command not recognized" };
  }
};
