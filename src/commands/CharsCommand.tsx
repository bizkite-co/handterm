import ReactDOMServer from 'react-dom/server';

import { allChords } from '../allChords';
import { Chord } from '../components/Chord';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { TerminalCssClasses } from '@handterm/types';
import { type ParsedCommand } from '../types/Types';

export const CharsCommand: ICommand = {
  name: 'chars',
  description: 'Display all Handterm characters',
  execute: async (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    await Promise.resolve();
    const chordElements = allChords.map((chord, i) => (
      <Chord
        key={`${chord.chordCode}-${chord.key}-${i}`}
        displayChar={chord.key}
      />
    ));
    const chordsHtml = chordElements.map(element =>
      // eslint-disable-next-line import/no-named-as-default-member
      ReactDOMServer.renderToStaticMarkup(element)
    ).join('');

    return {
      status: 200,
      message: `<div class='chord-display-container' id='${TerminalCssClasses.allChordsList}'>${chordsHtml}</div>`
    };
  }
};
