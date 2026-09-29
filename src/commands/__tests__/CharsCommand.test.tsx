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
  it('is named chars', () => {
    expect(CharsCommand.name).toBe('chars');
  });

  it('renders every allChords entry', async () => {
    const response = await CharsCommand.execute(mockContext, parsedCommand);

    expect(response.status).toBe(200);
    expect(response.message).toContain(`id='${TerminalCssClasses.allChordsList}'`);
    expect(response.message.match(/class="chord-image-holder"/g)?.length).toBe(allChords.length);
    expect(response.message).toContain('>a<');
    expect(response.message).toContain('Enter');
  });

  it('appears in live registry help when registered', () => {
    const registry = new CommandRegistry();
    registry.register(CharsCommand);
    const help = registry.getHelp();
    expect(help).toContain('chars');
    expect(help).toContain('Display all Handterm characters');
  });
});
