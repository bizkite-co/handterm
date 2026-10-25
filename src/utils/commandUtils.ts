import { type ParsedCommand, StorageKeys } from '@handterm/types';

export const commandTextToHTML = (text: string): string => {
  return text.replace(/\n/g, '<br/>');
};

export const loadCommandHistory = (): string[] => {
  const storedHistory = localStorage.getItem(StorageKeys.commandHistory ?? '') ?? '[]';
  try {
    const parsedHistory = JSON.parse(storedHistory) as unknown;
    // If it's an array of strings, return it directly
    if (Array.isArray(parsedHistory) && parsedHistory.every((item): item is string => typeof item === 'string')) {
      return parsedHistory;
    }
    // If it's an array of ParsedCommand, convert to strings
    if (Array.isArray(parsedHistory) && parsedHistory.every((item): item is ParsedCommand =>
      typeof item === 'object' && item !== null && 'command' in item
    )) {
      return parsedHistory.map(parsedCommandToString);
    }
    // If parsing fails or is invalid, return an empty array
    return [];
  } catch {
    return [];
  }
}

export const saveCommandHistory = (commandHistory: string[]): void => {
  if (StorageKeys.commandHistory != null)
    localStorage.setItem(StorageKeys.commandHistory ?? '', JSON.stringify(commandHistory));
}

export function parsedCommandToString(cmd: ParsedCommand): string {
  const argsStr = cmd.args != null ? cmd.args.join(' ') : '';
  const switchesStr = cmd.switches == null ? '' : Object.entries(cmd.switches)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? `-${key}` : '';
      }
      return `-${key} ${value}`;
    })
    .filter(s => s)
    .join(' ');

  return [cmd.command, argsStr, switchesStr]
    .filter(s => s)
    .join(' ')
    .trim();
}

function isSwitch(part: string): boolean {
  return part.startsWith('--') || (part.startsWith('-') && part.length > 1);
}

export function tokenizeInput(input: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    } else if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (/\s/.test(char) && !inDoubleQuote && !inSingleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
    } else {
      current += char;
    }
  }
  if (current.length > 0) {
    tokens.push(current);
  }
  return tokens;
}

export const parseCommand = (input: string): ParsedCommand => {
  const parts = tokenizeInput(input);
  const command = parts.shift() ?? ''; // The first element is the command
  const args: string[] = [];
  const switches: Record<string, boolean | string> = {};

  for (let i = 0; i < parts.length; i++) {
    const part: string | undefined = parts[i];
    if (part === undefined) continue;
    if (part == null) continue; // Skip if undefined (shouldn't happen due to filter)
    if (isSwitch(part)) {
      const switchAssignmentIndex = part.indexOf('=');
      if (switchAssignmentIndex > -1) {
        // It's a switch with an explicit value
        const rawSwitch = part.substring(0, switchAssignmentIndex);
        const switchName = rawSwitch.startsWith('--') ? rawSwitch.substring(2) : rawSwitch.substring(1);
        const switchValue = part.substring(switchAssignmentIndex + 1);
        switches[switchName] = switchValue;
      } else {
        // It's a boolean switch or a switch with a value that's the next part
        const switchName = part.substring(0, 2) === '--' ? part.substring(2) : part.substring(1);
        // Look ahead to see if the next part is a value for this switch
        if (i + 1 < parts.length) {
          const nextPart = parts[i + 1];
          if (nextPart && !nextPart.startsWith('-')) {
            switches[switchName] = nextPart;
            i++; // Increment i to skip the value
          } else {
            switches[switchName] = true; // No value provided, treat it as a boolean switch
          }
        } else {
          switches[switchName] = true; // No value provided, treat it as a boolean switch
        }
      }
    } else {
      // It's an argument
      args.push(part);
    }
  }

  return {
    command,
    args,
    switches
  } as const;
}
