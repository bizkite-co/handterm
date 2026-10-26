import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import { chordGlyphScaleSignal, setChordGlyphScale } from '../signals/appSignals';
import { ActivityType, StorageKeys } from '@handterm/types';
import { getFile, putFile } from '../utils/awsApiClient';
import { commandRegistry } from './commandRegistry';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'ConfigCommand' });

export const CONFIG_FILE_NAME = 'config.json';

export function getDefaultConfigContent(): string {
  const currentScale = chordGlyphScaleSignal.value;
  return JSON.stringify(
    {
      'chord-glyph-size': currentScale,
    },
    null,
    2
  );
}

export async function openConfigFile(context: ICommandContext): Promise<ICommandResponse> {
  let content = '';

  // 1. Try AWS S3 if user is logged in
  try {
    const response = await getFile(context.auth, CONFIG_FILE_NAME);
    if (response.status === 200 && response.data?.content) {
      content = response.data.content;
    }
  } catch (error) {
    logger.warn('Failed to fetch config from AWS, falling back to local:', error);
  }

  // 2. Fall back to localStorage if S3 didn't have it
  if (!content) {
    const local = localStorage.getItem(CONFIG_FILE_NAME);
    if (local) {
      content = local;
    } else {
      content = getDefaultConfigContent();
      localStorage.setItem(CONFIG_FILE_NAME, content);
    }
  }

  // 3. Store in editContent and switch location
  localStorage.setItem(StorageKeys.editContent, JSON.stringify(content));
  context.updateLocation({
    activityKey: ActivityType.EDIT,
    contentKey: CONFIG_FILE_NAME,
    groupKey: null,
  });

  return {
    status: 200,
    message: `Opening ${CONFIG_FILE_NAME} in editor`,
  };
}

export async function setConfigValue(
  context: ICommandContext,
  key: string,
  value: string
): Promise<ICommandResponse> {
  if (!key) {
    return {
      status: 400,
      message: 'Usage: config set <key> <value>',
    };
  }

  if (key === 'chord-glyph-size' || key === 'chord-glyph-scale') {
    if (!value) {
      return {
        status: 400,
        message: 'Value required. Example: config set chord-glyph-size 1.5',
      };
    }

    const scale = parseFloat(value);
    if (Number.isNaN(scale) || scale <= 0) {
      return {
        status: 400,
        message: `Invalid value "${value}". Must be a positive number (e.g. 1.0, 1.5, 0.75).`,
      };
    }

    setChordGlyphScale(scale);

    // Update config.json in localStorage
    let configObj: Record<string, unknown> = {};
    try {
      const stored = localStorage.getItem(CONFIG_FILE_NAME);
      if (stored) {
        configObj = JSON.parse(stored);
      }
    } catch {
      configObj = {};
    }
    configObj['chord-glyph-size'] = scale;
    const jsonString = JSON.stringify(configObj, null, 2);
    localStorage.setItem(CONFIG_FILE_NAME, jsonString);

    // Sync to AWS S3 if logged in
    try {
      if (context.auth && context.auth.isLoggedIn) {
        void putFile(context.auth, CONFIG_FILE_NAME, jsonString);
      }
    } catch {
      // background sync
    }

    return {
      status: 200,
      message: `chord-glyph-size set to ${scale}`,
    };
  }

  return {
    status: 404,
    message: `Unknown config key: "${key}". Available: chord-glyph-size`,
  };
}

export function getConfigValue(key?: string): ICommandResponse {
  if (!key) {
    const currentScale = chordGlyphScaleSignal.value;
    const message = `
<div class="command-list">
  <span class="cmd-name">chord-glyph-size    </span>  <span class="cmd-desc">${currentScale} (scale factor for chord glyphs)</span>
  <br><br>
  <span class="cmd-desc">Usage: config set &lt;key&gt; &lt;value&gt;</span>
</div>
`;
    return { status: 200, message };
  }

  if (key === 'chord-glyph-size' || key === 'chord-glyph-scale') {
    return {
      status: 200,
      message: `chord-glyph-size: ${chordGlyphScaleSignal.value}`,
    };
  }

  return {
    status: 404,
    message: `Unknown config key: "${key}". Available: chord-glyph-size`,
  };
}

export const ConfigCommand: ICommand = {
  name: 'config',
  description: 'Open config file in editor or set specific options',
  subcommands: {
    set: 'Set a config option: config set <key> <value>',
    get: 'Get a config option: config get [key]',
    open: 'Open the config file in editor (or just: config)',
    help: 'Show help for config command',
  },
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const subcommand = parsedCommand.args[0]?.toLowerCase();
    const args = parsedCommand.args.slice(1);

    if (!subcommand || subcommand === 'open' || subcommand === 'edit') {
      return await openConfigFile(context);
    }

    if (subcommand === 'set') {
      return await setConfigValue(context, args[0], args[1]);
    }

    if (subcommand === 'get') {
      return getConfigValue(args[0]);
    }

    if (subcommand === 'help') {
      return {
        status: 200,
        message: commandRegistry.formatCommandHelp(ConfigCommand),
      };
    }

    // Backwards compatibility for `config chord-glyph-size [value]`
    if (subcommand === 'chord-glyph-size' || subcommand === 'chord-glyph-scale') {
      if (args[0]) {
        return await setConfigValue(context, subcommand, args[0]);
      }
      return getConfigValue(subcommand);
    }

    return {
      status: 400,
      message: `Unknown subcommand or option "${subcommand}". Usage: config [set <key> <value> | get <key> | help]`,
    };
  },
};

export default ConfigCommand;
