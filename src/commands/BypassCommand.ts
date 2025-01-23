// src/commands/BypassCommand.ts

import { activitySignal , setBypassTutorial, bypassTutorialSignal } from 'src/signals/appSignals';

import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { ActivityType } from '@handterm/types';
import type { ParsedCommand } from '../types/Types';
import { navigate } from '../utils/navigationUtils';

export const BypassCommand: ICommand = {
  name: 'bypass',
  description: 'Toggle tutorial bypass mode for testing',
  execute: (
    _context: ICommandContext,
    _parsedCommand: ParsedCommand
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

    return Promise.resolve({
      status: 200,
      message: `Bypass mode ${newBypassState ? 'enabled' : 'disabled'}. ${newBypassState ? 'You are now in NORMAL mode.' : 'Tutorial mode will resume on next page load.'}`
    });
  }
};


