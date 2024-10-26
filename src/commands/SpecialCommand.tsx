import React from 'react';
import { Chord } from '../components/Chord';
import ReactDOMServer from 'react-dom/server';
import { ICommand, ICommandResponse } from '../contexts/CommandContext';
import { ICommandContext } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';

export const SpecialCommand: ICommand = {
  name: 'special',
  description: 'Display special characters',
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
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
