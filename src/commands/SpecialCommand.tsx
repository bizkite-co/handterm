import ReactDOMServer from 'react-dom/server';

import { Chord } from '../components/Chord';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

export const SpecialCommand: ICommand = {
  name: 'special',
  description: 'Display special characters',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    await Promise.resolve();
    const specialChars = ['~', '`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '-', '_', '+', '=', '{', '[', '}', ']', '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.', '?', '/'];
    const chordElements = specialChars.map(char => (
      <Chord key={char} displayChar={char} />
    ));
    const chordsHtml = chordElements.map(element =>
      ReactDOMServer.renderToStaticMarkup(element)
    ).join('');

    return {
      status: 200,
      message: `<div class='chord-display-container'>${chordsHtml}</div>`
    };
  }
};
