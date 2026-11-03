import ReactDOMServer from 'react-dom/server';

import { allChords } from '../allChords';
import { Chord } from '../components/Chord';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { TerminalCssClasses, type IChord } from '@handterm/types';
import { type ParsedCommand } from '../types/Types';

export const CHARACTER_DESCRIPTIONS: Record<string, string[]> = {
  '/': ['slash', 'forward slash', 'forwardslash', 'solidus', 'divide', 'division'],
  '\\': ['backslash', 'back slash', 'reverse slash'],
  '?': ['question', 'question mark', 'questionmark', 'query', 'interrogation'],
  '!': ['exclamation', 'exclamation mark', 'exclamationmark', 'exclamation point', 'bang'],
  '@': ['at', 'at sign', 'atsign', 'commercial at'],
  '#': ['hash', 'hashtag', 'number sign', 'numbersign', 'pound', 'pound sign', 'sharp'],
  '$': ['dollar', 'dollar sign', 'dollarsign'],
  '%': ['percent', 'percentage', 'percent sign', 'percentsign', 'modulo', 'mod'],
  '^': ['caret', 'hat', 'circumflex'],
  '&': ['ampersand', 'and', 'and sign', 'andsign'],
  '*': ['asterisk', 'star', 'times', 'multiply', 'multiplication'],
  '(': ['open paren', 'openparen', 'left paren', 'leftparen', 'opening parenthesis', 'left parenthesis', 'paren', 'parenthesis', 'parentheses'],
  ')': ['close paren', 'closeparen', 'right paren', 'rightparen', 'closing parenthesis', 'right parenthesis', 'paren', 'parenthesis', 'parentheses'],
  '-': ['dash', 'hyphen', 'minus', 'negative', 'subtract', 'subtraction'],
  '_': ['underscore', 'under score', 'low line', 'understrike'],
  '(underscore)': ['underscore', 'under score', 'low line', 'understrike'],
  '=': ['equal', 'equals', 'equal sign', 'equalsign'],
  '+': ['plus', 'plus sign', 'plussign', 'add', 'addition', 'positive'],
  '[': ['open bracket', 'openbracket', 'left bracket', 'leftbracket', 'open square bracket', 'left square bracket', 'bracket', 'brackets', 'square bracket', 'squarebracket'],
  ']': ['close bracket', 'closebracket', 'right bracket', 'rightbracket', 'close square bracket', 'right square bracket', 'bracket', 'brackets', 'square bracket', 'squarebracket'],
  '{': ['open brace', 'openbrace', 'left brace', 'leftbrace', 'open curly brace', 'left curly brace', 'curly bracket', 'curlybracket', 'curly brackets', 'brace', 'braces'],
  '}': ['close brace', 'closebrace', 'right brace', 'rightbrace', 'close curly brace', 'right curly brace', 'curly bracket', 'curlybracket', 'curly brackets', 'brace', 'braces'],
  '|': ['pipe', 'vertical bar', 'verticalbar', 'vertical line', 'bar'],
  ';': ['semicolon', 'semi-colon', 'semi colon'],
  ':': ['colon'],
  "'": ['single quote', 'singlequote', 'quote', 'quotes', 'apostrophe'],
  '"': ['double quote', 'doublequote', 'quote', 'quotes', 'quotation mark', 'quotation marks'],
  '`': ['backtick', 'grave', 'grave accent', 'backquote'],
  '~': ['tilde', 'squiggle'],
  ',': ['comma'],
  '<': ['less than', 'lessthan', 'less than sign', 'left angle bracket', 'open angle bracket', 'angle bracket', 'anglebracket'],
  '.': ['period', 'dot', 'full stop', 'point', 'decimal'],
  '>': ['greater than', 'greaterthan', 'greater than sign', 'right angle bracket', 'close angle bracket', 'angle bracket', 'anglebracket'],
  '&#x2581;': ['space', 'spacebar', 'blank'],
  ' ': ['space', 'spacebar', 'blank'],
  '\r': ['enter', 'return', 'carriage return'],
  '\t': ['tab', 'tabulator'],
  '\\t': ['tab', 'tabulator'],
  'ESCAPE': ['escape', 'esc'],
  'DELETE (Backspace)': ['backspace', 'delete', 'rubout'],
  'Keypad /': ['keypad slash', 'keypad divide', 'slash', 'divide'],
  'Keypad *': ['keypad star', 'keypad asterisk', 'keypad multiply', 'star', 'asterisk'],
  'Keypad -': ['keypad minus', 'keypad dash', 'keypad hyphen', 'minus', 'dash'],
  'Keypad +': ['keypad plus', 'plus'],
  'Keypad .': ['keypad period', 'keypad dot', 'period', 'dot'],
  'Keypad =': ['keypad equal', 'keypad equals', 'equal'],
  'Keypad Comma': ['keypad comma', 'comma'],
  'Non-US \\': ['backslash', 'non-us backslash'],
  '0': ['zero'],
  '1': ['one'],
  '2': ['two'],
  '3': ['three'],
  '4': ['four'],
  '5': ['five'],
  '6': ['six'],
  '7': ['seven'],
  '8': ['eight'],
  '9': ['nine'],
};

function field(value: string): string {
  return value.replace('&#x2581;', ' ').toLowerCase();
}

function clean(value: string): string {
  return value.toLowerCase().replace(/[\s\-_]+/g, '');
}

function getDescriptors(chord: IChord): string[] {
  const key = chord.key;
  const alias = chord.alias;
  const list: string[] = [];
  if (CHARACTER_DESCRIPTIONS[key]) {
    list.push(...CHARACTER_DESCRIPTIONS[key]);
  }
  if (alias && CHARACTER_DESCRIPTIONS[alias]) {
    list.push(...CHARACTER_DESCRIPTIONS[alias]);
  }
  return list;
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
    if (key.includes(needle) || alias.includes(needle) || field(chord.chordCode) === needle) {
      return true;
    }
    const needleClean = clean(needle);
    const keyClean = clean(key);
    const aliasClean = clean(alias);
    if (keyClean.includes(needleClean) || (aliasClean && aliasClean.includes(needleClean))) {
      return true;
    }
    const descriptors = getDescriptors(chord);
    return descriptors.some(desc => {
      const d = desc.toLowerCase();
      if (d.includes(needle)) {
        return true;
      }
      const dClean = clean(d);
      return dClean.includes(needleClean);
    });
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
