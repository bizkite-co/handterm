import { ParsedCommand } from "../types/Types";
import { LogKeys } from "../types/TerminalTypes";

export const commandTextToHTML = (text: string): string => {
  return text.replace(/\n/g, '<br/>');
};

export const loadCommandHistory = () => {
  return JSON.parse(localStorage.getItem(LogKeys.CommandHistory) || '[]');
}
export const saveCommandHistory = (commandHistory: any) => {
  localStorage.setItem(LogKeys.CommandHistory, JSON.stringify(commandHistory));
}
export function parsedCommandToString(cmd: ParsedCommand): string {
  const argsStr = cmd.args.join(' ');
  const switchesStr = Object.entries(cmd.switches)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? `--${key}` : '';
      }
      return `--${key}=${value}`;
    })
    .filter(s => s)
    .join(' ');

  return [cmd.command, argsStr, switchesStr]
    .filter(s => s)
    .join(' ')
    .trim();
}

export const parseCommand = (input: string): ParsedCommand => {
  const parts = input.split(/\s+/); // Split by whitespace
  const command = parts.shift(); // The first element is the command
  const args = [];
  const switches: Record<string, boolean | string> = {};

  if (command) {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part.startsWith('--') || (part.startsWith('-') && part.length === 2)) {
        const switchAssignmentIndex = part.indexOf('=');
        if (switchAssignmentIndex > -1) {
          // It's a switch with an explicit value
          const switchName = part.substring(2, switchAssignmentIndex);
          const switchValue = part.substring(switchAssignmentIndex + 1);
          switches[switchName] = switchValue;
        } else {
          // It's a boolean switch or a switch with a value that's the next part
          const switchName = part.substring(0, 2) === '--' ? part.substring(2) : part.substring(1);
          // Look ahead to see if the next part is a value for this switch
          if (i + 1 < parts.length && !parts[i + 1].startsWith('-')) {
            switches[switchName] = parts[++i]; // Use the next part as the value and increment i
          } else {
            switches[switchName] = true; // No value provided, treat it as a boolean switch
          }
        }
      } else {
        // It's an argument
        args.push(part);
      }
    }
  }

  return {
    command: command || '',
    args: args || [],
    switches: switches || {}
  } as const;
}