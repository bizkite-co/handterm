import { describe, expect, it } from 'vitest';

import { allChords } from '../../allChords';
import { CommandRegistry } from '../commandRegistry';
import { CharsCommand } from '../CharsCommand';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type IAuthProps } from '../../hooks/useAuth';
import { TerminalCssClasses, type ParsedCommand } from '@handterm/types';

const parsedCommand: ParsedCommand = {
  command: 'chars',
  args: [],
  switches: {},
};

const mockContext: ICommandContext = {
  executeCommand: async () => undefined,
  commandHistory: [],
  addToCommandHistory: () => undefined,
  output: [],
  appendToOutput: () => undefined,
  handTermRef: { current: null },
  auth: {} as IAuthProps,
  updateLocation: () => undefined,
};

describe('CharsCommand', () => {
  it('is named chars with a char alias', () => {
    expect(CharsCommand.name).toBe('chars');
    expect(CharsCommand.aliases).toContain('char');
  });

  it('renders every allChords entry', async () => {
    const response = await CharsCommand.execute(mockContext, parsedCommand);

    expect(response.status).toBe(200);
    expect(response.message).toContain(`id='${TerminalCssClasses.allChordsList}'`);
    expect(response.message.match(/class="chord-image-holder"/g)?.length).toBe(allChords.length);
    expect(response.message).toContain('>a<');
    expect(response.message).toContain('Enter');
  });

  it('filters case-insensitively by a search phrase', async () => {
    const response = await CharsCommand.execute(mockContext, {
      ...parsedCommand,
      args: ['arrow'],
    });

    expect(response.status).toBe(200);
    const count = response.message.match(/class="chord-image-holder"/g)?.length ?? 0;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(allChords.length);
    expect(response.message.toLowerCase()).toContain('arrow');
  });

  it('matches a short phrase such as arr', async () => {
    const response = await CharsCommand.execute(mockContext, {
      command: 'char',
      args: ['arr'],
      switches: {},
    });

    expect(response.message.toLowerCase()).toContain('arrow');
    expect(response.message.match(/class="chord-image-holder"/g)?.length).toBeGreaterThan(0);
  });

  it('reports when nothing matches', async () => {
    const response = await CharsCommand.execute(mockContext, {
      ...parsedCommand,
      args: ['zzzznotachar'],
    });

    expect(response.status).toBe(200);
    expect(response.message).toBe("No characters match 'zzzznotachar'.");
  });

  it('appears in live registry help when registered, including the char alias', () => {
    const registry = new CommandRegistry();
    registry.register(CharsCommand);
    expect(registry.getCommand('char')?.name).toBe('chars');
    const help = registry.getHelp();
    expect(help).toContain('chars');
    expect(help).toContain('char');
    expect(help).toContain('Display Handterm characters, optionally filtered by a search phrase');
  });
});
