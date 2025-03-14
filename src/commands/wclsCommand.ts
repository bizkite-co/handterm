import { WebContainer } from '@webcontainer/api';
import { type ICommand, type ICommandContext } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';

class WclsCommand implements ICommand {
  name = 'wcls';
  description = 'Executes `ls` in the WebContainer.';

  async execute(context: ICommandContext, _parsedCommand: ParsedCommand): Promise<{ status: number; message: string; type?: 'webcontainer' }> {
    const { webcontainerInstance } = context;

    if (!webcontainerInstance) {
      return {
        status: 500,
        message: 'WebContainer instance not found. Please wait for it to initialize.',
      };
    }

    try {
      const process = await (webcontainerInstance as any).spawn('ls');
      const output = process.output;

      let outputString = '';
      const decoder = new TextDecoder();
      const reader = output.getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          break;
        }
        // Explicitly type value as Uint8Array
        outputString += decoder.decode(value as Uint8Array);

      }

      return {
        status: 0,
        message: outputString,
        type: 'webcontainer'
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