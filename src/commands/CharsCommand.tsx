import ReactDOMServer from 'react-dom/server';

import { allChords } from '../allChords';
import { Chord } from '../components/Chord';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { TerminalCssClasses, type IChord } from '@handterm/types';
import { type ParsedCommand } from '../types/Types';

export function filterChords(chords: IChord[], query: string): IChord[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return chords;
  }
  return chords.filter(chord => {
    const haystacks = [chord.key, chord.alias ?? '', chord.chordCode];
    return haystacks.some(field => field.toLowerCase().includes(needle));
  });
}

export const CharsCommand: ICommand = {
  name: 'chars',
  aliases: ['char'],
  description: 'Display Handterm characters, optionally filtered by a search phrase',
  execute: async (
    _context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    await Promise.resolve();
    const query = parsedCommand.args.join(' ');
    const matches = filterChords(allChords, query);

    if (matches.length === 0) {
      return {
        status: 200,
        message: `No characters match '${query}'.`
      };
    }

    const chordElements = matches.map((chord, i) => (
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
