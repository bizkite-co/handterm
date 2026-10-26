import ReactDOMServer from 'react-dom/server';

import { Chord } from '../components/Chord';
import { commandRegistry } from './commandRegistry';
import { type ICommand, type ICommandResponse, type ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

export const HelpCommand: ICommand = {
  name: 'help',
  aliases: ['411'],
  description: 'Display help information (usage: help [command])',
  execute: (
    _context: ICommandContext,
    parsedCommand: ParsedCommand,
  ): Promise<ICommandResponse> => {
    if (
      parsedCommand.command === 'help'
      || parsedCommand.command === '411'
    ) {
      const filter = parsedCommand.args[0]?.trim();
      const commandList = commandRegistry.getHelp(filter);

      if (filter) {
        if (!commandList) {
          return Promise.resolve<ICommandResponse>({
            status: 404,
            message: `<div class="command-list">No commands matching "${filter}". Run 'help' to see all commands.</div>`,
          });
        }
        return Promise.resolve<ICommandResponse>({
          status: 200,
          message: `<div class="command-list-container"><div class="command-list">${commandList}</div></div>`,
        });
      }

      const commandChords = [
        'DELETE (Backspace)',
        '\r',
        'UpArrow',
        'LeftArrow',
        'DownArrow',
        'RightArrow',
        'ESCAPE',
      ].map(c => (
        <Chord key={c} displayChar={c} />
      ));
      const commandChordsHtml = commandChords.map(element => (
        // eslint-disable-next-line import/no-named-as-default-member
        ReactDOMServer.renderToStaticMarkup(element)
      )).join('');

      const response = `
        <div class='chord-display-container'>${commandChordsHtml}</div>
        <div class='command-list-container'>
          <div class="command-list">${commandList}</div>
        </div>
      `;
      return Promise.resolve<ICommandResponse>({ status: 200, message: response });
    }
    return Promise.resolve<ICommandResponse>({ status: 404, message: "Help command not recognized" });
  }
};