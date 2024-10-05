import React from 'react';
import { Chord } from '../components/Chord';
import ReactDOMServer from 'react-dom/server';
import { ICommand, ICommandResponse } from './ICommand';
import { IHandTermWrapperMethods } from '../components/HandTermWrapper';

const HelpCommand: ICommand = {
  name: 'help',
  description: 'Display help information',
  execute: (
    commandName: string,
    args?: string[],
    switches?: Record<string, boolean | string>,
    handTermRef?: React.MutableRefObject<IHandTermWrapperMethods | null>
  ): ICommandResponse => {
    if (commandName === 'help' || commandName === '411') {
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

      handTermRef?.current?.writeOutput(<div dangerouslySetInnerHTML={{ __html: response }} />);
      return { status: 200, message: "Help information displayed" };
    }
    return { status: 404, message: "Help command not recognized" };
  }
};

export default HelpCommand;