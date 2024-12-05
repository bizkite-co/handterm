// src/commands/BypassCommand.ts

import { ICommand, ICommandContext, ICommandResponse } from '../contexts/CommandContext';
import { ParsedCommand } from '../types/Types';
import { setBypassTutorial, bypassTutorialSignal } from '../signals/appSignals';
import { useReactiveLocation } from '../hooks/useReactiveLocation';
import { ActivityType } from '../types/Types';

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
      const { updateLocation } = useReactiveLocation();
      updateLocation({
        activityKey: ActivityType.NORMAL,
        contentKey: null,  // Clear any specific content
        groupKey: null     // Clear any group context
      });
    }

    return {
      status: 200,
      message: `Bypass mode ${newBypassState ? 'enabled' : 'disabled'}. ${newBypassState ? 'You are now in NORMAL mode.' : 'Tutorial mode will resume on next page load.'}`,
    };
  }
};
