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
    expect(help).toContain('brand-new -r');
    expect(help).toContain('Reset the new thing');
  });

  test('getHelp includes switches and subcommands', () => {
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

    const help = registry.getHelp();
    expect(help).toContain('tut -r');
    expect(help).toContain('Reset completed tutorials');
    expect(help).toContain('gh link');
    expect(help).toContain('Link GitHub account');
  });
});
