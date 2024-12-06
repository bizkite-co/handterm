// src/commands/BypassCommand.ts

import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { setBypassTutorial, bypassTutorialSignal } from '../signals/appSignals';
import { activitySignal } from 'src/signals/appSignals';
import { ActivityType } from '../types/Types';
import { navigate } from '../utils/navigationUtils'; // We'll create this utility

export const BypassCommand: ICommand = {
  name: 'bypass',
  description: 'Toggle tutorial bypass mode for testing',
  execute: async (
    context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    const newBypassState = !bypassTutorialSignal.value;
    setBypassTutorial(newBypassState);

    if(newBypassState){
      // Set activity route to normal
      activitySignal.value = ActivityType.NORMAL;
      navigate({
        activityKey: ActivityType.NORMAL,
        contentKey: null,
        groupKey: null
      });
    }

    return {
      status: 200,
      message: `Bypass mode ${newBypassState ? 'enabled' : 'disabled'}. ${newBypassState ? 'You are now in NORMAL mode.' : 'Tutorial mode will resume on next page load.'}`,
    };
  }
};
