import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { type ICommandContext, type ICommandResponse } from 'src/contexts/CommandContext';
import { type IAuthProps } from 'src/hooks/useAuth';
import { type ParsedCommand } from '@handterm/types';

import * as apiClient from 'src/utils/apiClient';
import { GitHubCommand } from '../GitHubCommand';

vi.mock('src/utils/apiClient', () => ({
  getGitHubDeviceCode: vi.fn(),
  pollGitHubDeviceAuth: vi.fn(),
  getRepoTree: vi.fn(),
  listRecentRepos: vi.fn(),
  unlinkGitHub: vi.fn(),
}));

const deviceCodeResponse = {
  status: 200,
  data: {
    verification_uri: 'https://github.com/login/device',
    user_code: 'ABCD-EFGH',
    device_code: 'device-123',
  },
};

const pollPending = {
  status: 202,
  data: { status: 'pending', user_code: 'ABCD-EFGH', device_code: 'device-123' },
};

const pollComplete = {
  status: 200,
  data: { status: 'complete', user_code: 'ABCD-EFGH', device_code: 'device-123' },
};

describe('GitHubCommand -l', () => {
  const createMockContext = (overrides: Partial<ICommandContext> = {}): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: { current: null },
    auth: {} as IAuthProps,
    updateLocation: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.mocked(apiClient.getGitHubDeviceCode).mockResolvedValue(deviceCodeResponse);
    vi.mocked(apiClient.pollGitHubDeviceAuth)
      .mockResolvedValueOnce(pollPending)
      .mockResolvedValue(pollComplete);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('displays the device code and verification URL in the terminal', async () => {
    const appendToOutput = vi.fn();
    const clipboards = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, 'clipboard', {
      value: clipboards,
      configurable: true,
    });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    const mockContext = createMockContext({ appendToOutput });
    const parsedCommand: ParsedCommand = {
      command: 'gh',
      args: ['link'],
      switches: {},
    };

    const responsePromise = GitHubCommand.execute(mockContext, parsedCommand);
    await vi.advanceTimersByTimeAsync(6000);
    const response: ICommandResponse = await responsePromise;

    expect(response.status).toBe(200);
    expect(appendToOutput).toHaveBeenCalledTimes(1);
    const appended = appendToOutput.mock.calls[0][0] as { response: string };
    expect(appended.response).toContain('ABCD-EFGH');
    expect(appended.response).toContain('https://github.com/login/device');
    expect(clipboards.writeText).toHaveBeenCalledWith('ABCD-EFGH');
    expect(openSpy).toHaveBeenCalledWith('https://github.com/login/device', '_blank');
  });
});