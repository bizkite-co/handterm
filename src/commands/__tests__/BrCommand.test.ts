import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ActivityType } from '@handterm/types';
import { type ICommandContext } from '../../contexts/CommandContext';
import { type IAuthProps } from '../../hooks/useAuth';
import { CommandRegistry } from '../commandRegistry';
import { BrCommand } from '../BrCommand';

vi.mock('src/utils/navigationUtils', () => ({
  navigate: vi.fn(),
}));

import { navigate } from 'src/utils/navigationUtils';

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

describe('BrCommand', () => {
  beforeEach(() => {
    vi.mocked(navigate).mockClear();
  });

  it('is named br with alias y and appears in help', () => {
    expect(BrCommand.name).toBe('br');
    expect(BrCommand.aliases).toContain('y');
    const registry = new CommandRegistry();
    registry.register(BrCommand);
    expect(registry.getHelp()).toContain('br');
    expect(registry.getHelp()).toContain('y');
    expect(registry.getCommand('y')).toBe(BrCommand);
    expect(registry.getHelp()).toContain('Browse GitHub and S3 files');
  });

  it('opens the browse activity at the root', async () => {
    const response = await BrCommand.execute(mockContext, {
      command: 'br',
      args: [],
      switches: {},
    });
    expect(response.status).toBe(200);
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.BROWSE,
      contentKey: null,
      groupKey: null,
    });
  });

  it('br s3 and br github jump to those mounts', async () => {
    await BrCommand.execute(mockContext, { command: 'br', args: ['s3'], switches: {} });
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.BROWSE,
      contentKey: 's3',
      groupKey: null,
    });
    await BrCommand.execute(mockContext, { command: 'br', args: ['gh'], switches: {} });
    expect(navigate).toHaveBeenCalledWith({
      activityKey: ActivityType.BROWSE,
      contentKey: 'github',
      groupKey: null,
    });
  });
});
