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
