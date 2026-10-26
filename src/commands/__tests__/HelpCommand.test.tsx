import { describe, it, expect, vi } from 'vitest';
import { HelpCommand } from '../HelpCommand';
import { commandRegistry } from '../commandRegistry';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type ParsedCommand } from '../../types/Types';

describe('HelpCommand', () => {
  const createMockContext = (): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: { current: null },
    auth: {} as any,
    updateLocation: vi.fn(),
  });

  it('returns full help with chords when called without arguments', async () => {
    commandRegistry.register({
      name: 'vimtut',
      description: 'Interactive Vim tutorial in Monaco editor',
      execute: vi.fn(),
    });

    const parsedCommand: ParsedCommand = {
      command: 'help',
      args: [],
      switches: {},
    };

    const res = await HelpCommand.execute(createMockContext(), parsedCommand);
    expect(res.status).toBe(200);
    expect(res.message).toContain('chord-display-container');
    expect(res.message).toContain('vimtut');
  });

  it('filters commands when an argument is provided (e.g. help vim)', async () => {
    commandRegistry.register({
      name: 'vimtut',
      description: 'Interactive Vim tutorial in Monaco editor',
      execute: vi.fn(),
    });

    const parsedCommand: ParsedCommand = {
      command: 'help',
      args: ['vim'],
      switches: {},
    };

    const res = await HelpCommand.execute(createMockContext(), parsedCommand);
    expect(res.status).toBe(200);
    expect(res.message).toContain('vimtut');
    expect(res.message).not.toContain('chord-display-container');
  });

  it('shows subcommands when querying a specific command (e.g. help testcmd)', async () => {
    commandRegistry.register({
      name: 'testcmd',
      description: 'Test command description',
      subcommands: { sub1: 'Subcommand 1 description' },
      switches: { flag: 'A switch flag' },
      execute: vi.fn(),
    });

    const parsedCommand: ParsedCommand = {
      command: 'help',
      args: ['testcmd'],
      switches: {},
    };

    const res = await HelpCommand.execute(createMockContext(), parsedCommand);
    expect(res.status).toBe(200);
    expect(res.message).toContain('testcmd');
    expect(res.message).toContain('testcmd sub1');
    expect(res.message).toContain('testcmd -flag');
  });

  it('returns 404 message when no commands match the filter', async () => {
    const parsedCommand: ParsedCommand = {
      command: 'help',
      args: ['nonexistentxyz'],
      switches: {},
    };

    const res = await HelpCommand.execute(createMockContext(), parsedCommand);
    expect(res.status).toBe(404);
    expect(res.message).toContain('No commands matching "nonexistentxyz"');
  });
});
