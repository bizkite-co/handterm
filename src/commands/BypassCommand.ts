// src/commands/BypassCommand.ts

import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { setBypassTutorial, bypassTutorialSignal } from '../signals/appSignals';

export const BypassCommand: ICommand = {
  name: 'bypass',
  description: 'Toggle tutorial bypass mode for testing',
  execute: (context: ICommandContext, parsedCommand: ParsedCommand): ICommandResponse => {
    const newBypassState = !bypassTutorialSignal.value;
    setBypassTutorial(newBypassState);
    return {
      status: 200,
      message: `Bypass mode ${newBypassState ? 'enabled' : 'disabled'}. ${newBypassState ? 'You are now in NORMAL mode.' : 'Tutorial mode will resume on next page load.'}`,
    };
  }
};