import { describe, expect, test } from 'vitest';

import { CommandRegistry } from '../commandRegistry';
import { type ICommand } from '../../contexts/CommandContext';

function stubCommand(partial: Pick<ICommand, 'name' | 'description'> & Partial<ICommand>): ICommand {
  return {
    switches: {},
    execute: async () => ({ status: 200, message: 'ok' }),
    ...partial,
  };
}

describe('CommandRegistry help', () => {
  test('getHelp lists every registered command from the live registry', () => {
    const registry = new CommandRegistry();
    registry.register(stubCommand({ name: 'zeta', description: 'Last command' }));
    registry.register(stubCommand({ name: 'alpha', description: 'First command' }));

    const help = registry.getHelp();

    expect(help).toContain('alpha');
    expect(help).toContain('First command');
    expect(help).toContain('zeta');
    expect(help).toContain('Last command');
    expect(help.indexOf('alpha')).toBeLessThan(help.indexOf('zeta'));
  });

  test('a newly registered command appears in help with no extra wiring', () => {
    const registry = new CommandRegistry();
    registry.register(stubCommand({ name: 'old', description: 'Already there' }));
    expect(registry.getHelp()).not.toContain('brand-new');

    registry.register(stubCommand({
      name: 'brand-new',
      description: 'Added later',
      switches: { r: 'Reset the new thing' },
    }));

    const help = registry.getHelp();
    expect(help).toContain('brand-new');
    expect(help).toContain('Added later');
    // Top-level help only shows primary commands
    expect(help).not.toContain('brand-new -r');

    // Specific command help includes switches
    const specificHelp = registry.getHelp('brand-new');
    expect(specificHelp).toContain('brand-new -r');
    expect(specificHelp).toContain('Reset the new thing');
  });

  test('getHelp with a specific command includes switches and subcommands', () => {
    const registry = new CommandRegistry();
    registry.register(stubCommand({
      name: 'tut',
      description: 'Return to the tutorials',
      switches: { r: 'Reset completed tutorials' },
    }));
    registry.register(stubCommand({
      name: 'gh',
      description: 'GitHub account and repository management',
      subcommands: { link: 'Link GitHub account' },
    }));

    // Top-level help has primary entries only
    const globalHelp = registry.getHelp();
    expect(globalHelp).toContain('tut');
    expect(globalHelp).toContain('gh');
    expect(globalHelp).not.toContain('tut -r');
    expect(globalHelp).not.toContain('gh link');

    // Targeted help has subcommands/switches
    const tutHelp = registry.getHelp('tut');
    expect(tutHelp).toContain('tut -r');
    expect(tutHelp).toContain('Reset completed tutorials');

    const ghHelp = registry.getHelp('gh');
    expect(ghHelp).toContain('gh link');
    expect(ghHelp).toContain('Link GitHub account');
  });

  test('escapes HTML entities in descriptions and names', () => {
    const registry = new CommandRegistry();
    registry.register(stubCommand({
      name: 'mock',
      description: 'Create <item> & configure',
      subcommands: { 'new': 'Usage: mock new <title> [-b <body>]' },
    }));

    const globalHelp = registry.getHelp();
    expect(globalHelp).toContain('&lt;item&gt; &amp; configure');
    expect(globalHelp).not.toContain('<item>');

    const specificHelp = registry.getHelp('mock');
    expect(specificHelp).toContain('&lt;title&gt;');
    expect(specificHelp).not.toContain('<title>');
  });

  test('aliases resolve to the same command and appear once in help', () => {
    const registry = new CommandRegistry();
    registry.register(stubCommand({
      name: 'chars',
      aliases: ['char'],
      description: 'Display characters',
    }));

    expect(registry.getCommand('char')?.name).toBe('chars');
    expect(registry.listCommands()).toHaveLength(1);
    expect(registry.getHelp()).toContain('chars, char');
    // Querying by alias also provides the command's help
    expect(registry.getHelp('char')).toContain('chars, char');
  });

  test('live global commandRegistry contains ta and vimtut at top level, and subcommands in help ta', async () => {
    await import('../index');
    const { commandRegistry: liveRegistry } = await import('../commandRegistry');

    const help = liveRegistry.getHelp();
    expect(help).toContain('vimtut');
    expect(help).toContain('ta, task');
    // Subcommands should NOT be in top-level help
    expect(help).not.toContain('ta list');
    expect(help).not.toContain('ta new');

    // Subcommands SHOULD be in command-specific help
    const taHelp = liveRegistry.getHelp('ta');
    expect(taHelp).toContain('ta, task');
    expect(taHelp).toContain('ta list');
    expect(taHelp).toContain('ta new');
    expect(taHelp).toContain('ta active');
  });
});
