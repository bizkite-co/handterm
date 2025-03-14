import { WebContainer } from '@webcontainer/api';
import { type ICommand, type ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

class WclsCommand implements ICommand {
  name = 'wcls';
  description = 'Executes `ls` in the WebContainer.';

  async execute(context: ICommandContext, _parsedCommand: ParsedCommand): Promise<{ status: number; message: string }> {
    const { webcontainerInstance } = context as any; // Temporary workaround

    if (!webcontainerInstance) {
      return {
        status: 500,
        message: 'WebContainer instance not found. Please wait for it to initialize.',
      };
    }

    try {
      const process = await webcontainerInstance.spawn('ls');
      const output = await process.output;

      let outputString = '';
      const decoder = new TextDecoder();
      const reader = output.getReader();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        outputString += decoder.decode(value);

      }

      return {
        status: 0,
        message: outputString,
      };
    } catch (error) {
      return {
        status: 500,
        message: `Error executing ls: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const wclsCommand = new WclsCommand();