import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type ICommandContext } from 'src/contexts/CommandContext';
import { type IAuthProps } from 'src/hooks/useAuth';
import { type ParsedCommand } from '@handterm/types';
import { ActivityType, StorageKeys } from '@handterm/types';

import * as awsApiClient from 'src/utils/awsApiClient';
import {
  ConfigCommand,
  CONFIG_FILE_NAME,
  getDefaultConfigContent,
} from '../ConfigCommand';
import { chordGlyphScaleSignal, setChordGlyphScale } from 'src/signals/appSignals';

vi.mock('src/utils/awsApiClient', () => ({
  getFile: vi.fn(),
  putFile: vi.fn(),
}));

describe('ConfigCommand', () => {
  const createMockContext = (overrides: Partial<ICommandContext> = {}): ICommandContext => ({
    executeCommand: vi.fn(),
    commandHistory: [],
    addToCommandHistory: vi.fn(),
    output: [],
    appendToOutput: vi.fn(),
    handTermRef: { current: null },
    auth: {
      user: { id: 'user-1', email: 'test@example.com' },
      token: 'jwt-token',
      isLoggedIn: true,
    } as unknown as IAuthProps,
    updateLocation: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setChordGlyphScale(1.0);
  });

  describe('opening config file', () => {
    it('opens config.json in the editor when called with no arguments', async () => {
      const updateLocation = vi.fn();
      const context = createMockContext({ updateLocation });
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: [],
        switches: {},
      };

      vi.mocked(awsApiClient.getFile).mockResolvedValue({
        status: 404,
        error: 'Not found',
      });

      const res = await ConfigCommand.execute(context, parsedCommand);

      expect(res.status).toBe(200);
      expect(res.message).toContain('Opening config.json in editor');
      expect(updateLocation).toHaveBeenCalledWith({
        activityKey: ActivityType.EDIT,
        contentKey: CONFIG_FILE_NAME,
        groupKey: null,
      });

      const storedEditContent = localStorage.getItem(StorageKeys.editContent);
      expect(storedEditContent).toBeTruthy();
      const parsed = JSON.parse(JSON.parse(storedEditContent!));
      expect(parsed['chord-glyph-size']).toBe(1);
    });

    it('opens config.json when called with "config open" or "config edit"', async () => {
      const updateLocation = vi.fn();
      const context = createMockContext({ updateLocation });
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['open'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(updateLocation).toHaveBeenCalledWith({
        activityKey: ActivityType.EDIT,
        contentKey: CONFIG_FILE_NAME,
        groupKey: null,
      });
    });

    it('loads existing config from AWS S3 if available', async () => {
      const remoteConfig = JSON.stringify({ 'chord-glyph-size': 1.5 });
      vi.mocked(awsApiClient.getFile).mockResolvedValue({
        status: 200,
        data: {
          content: remoteConfig,
          encoding: 'utf-8',
        },
      });

      const updateLocation = vi.fn();
      const context = createMockContext({ updateLocation });
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: [],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);

      const stored = localStorage.getItem(StorageKeys.editContent);
      expect(JSON.parse(stored!)).toBe(remoteConfig);
    });
  });

  describe('config set', () => {
    it('sets chord-glyph-size to a valid positive number', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['set', 'chord-glyph-size', '1.75'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toBe('chord-glyph-size set to 1.75');
      expect(chordGlyphScaleSignal.value).toBe(1.75);

      const storedConfig = localStorage.getItem(CONFIG_FILE_NAME);
      expect(storedConfig).toBeTruthy();
      expect(JSON.parse(storedConfig!)['chord-glyph-size']).toBe(1.75);

      expect(awsApiClient.putFile).toHaveBeenCalledWith(
        context.auth,
        CONFIG_FILE_NAME,
        expect.stringContaining('"chord-glyph-size": 1.75')
      );
    });

    it('rejects invalid non-numeric scale values', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['set', 'chord-glyph-size', 'abc'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(400);
      expect(res.message).toContain('Invalid value');
      expect(chordGlyphScaleSignal.value).toBe(1.0);
    });

    it('rejects zero or negative values', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['set', 'chord-glyph-size', '-0.5'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(400);
      expect(res.message).toContain('Invalid value');
    });

    it('returns 404 for unknown config keys', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['set', 'unsupported-key', 'value'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(404);
      expect(res.message).toContain('Unknown config key');
    });
  });

  describe('config get', () => {
    it('returns specific key value when specified', async () => {
      setChordGlyphScale(1.25);
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['get', 'chord-glyph-size'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toBe('chord-glyph-size: 1.25');
    });

    it('returns formatted list when no key is specified', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['get'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('chord-glyph-size');
    });
  });

  describe('backward compatibility', () => {
    it('supports direct key-value syntax "config chord-glyph-size 1.5"', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['chord-glyph-size', '1.5'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toBe('chord-glyph-size set to 1.5');
      expect(chordGlyphScaleSignal.value).toBe(1.5);
    });
  });

  describe('config help', () => {
    it('displays help information for config command', async () => {
      const context = createMockContext();
      const parsedCommand: ParsedCommand = {
        command: 'config',
        args: ['help'],
        switches: {},
      };

      const res = await ConfigCommand.execute(context, parsedCommand);
      expect(res.status).toBe(200);
      expect(res.message).toContain('config set');
      expect(res.message).toContain('config get');
      expect(res.message).toContain('config open');
    });
  });
});
