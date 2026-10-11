import ReactDOMServer from 'react-dom/server';

import { allChords } from '../allChords';
import { Chord } from '../components/Chord';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { TerminalCssClasses, type IChord } from '@handterm/types';
import { type ParsedCommand } from '../types/Types';

function field(value: string): string {
  return value.replace('&#x2581;', ' ').toLowerCase();
}

export function filterChords(chords: IChord[], query: string): IChord[] {
  const needle = query.trim().toLowerCase();
  if (needle === '') {
    return chords;
  }
  return chords.filter(chord => {
    const key = field(chord.key);
    const alias = field(chord.alias ?? '');
    // Single-character queries match the printed character only. Matching
    // chordCode here listed every shift chord (codes starting with "5").
    if (needle.length === 1) {
      return key === needle || alias === needle;
    }
    return key.includes(needle) || alias.includes(needle) || field(chord.chordCode) === needle;
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
        chordCode={chord.chordCode}
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
