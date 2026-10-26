import { navigate } from '../utils/navigationUtils';
import { ActivityType, StorageKeys } from '@handterm/types';
import { type ICommand, type ICommandContext, type ICommandResponse } from '../contexts/CommandContext';
import { type ParsedCommand } from '../types/Types';
import {
  getCurrentVimStep,
  setVimTutorialStep,
  vimTutorialStepIndexSignal,
} from '../signals/vimTutorialSignals';
import { VIM_TUTORIAL_STEPS } from '../utils/vimTutorialCurriculum';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'VimTutCommand' });

export function startVimTutorial(stepIndex?: number): void {
  const targetIndex = typeof stepIndex === 'number'
    ? stepIndex
    : vimTutorialStepIndexSignal.value;

  const currentStep = setVimTutorialStep(targetIndex);

  try {
    localStorage.setItem(StorageKeys.editContent, JSON.stringify(currentStep.initialText));
  } catch (e) {
    logger.warn('Failed to set editContent in localStorage for vimtut', e);
  }

  navigate({
    activityKey: ActivityType.EDIT,
    contentKey: 'vimtut',
  });
}

export const VimTutCommand: ICommand = {
  name: 'vimtut',
  description: 'Interactive Vim tutorial in Monaco editor',
  execute: async (
    _context: ICommandContext,
    parsedCommand: ParsedCommand
  ): Promise<ICommandResponse> => {
    try {
      let stepIndex: number | undefined;
      const arg = parsedCommand.args[0];
      if (arg) {
        const parsed = parseInt(arg, 10);
        if (!Number.isNaN(parsed) && parsed >= 1 && parsed <= VIM_TUTORIAL_STEPS.length) {
          stepIndex = parsed - 1;
        }
      }

      startVimTutorial(stepIndex);
      const step = getCurrentVimStep();

      return {
        status: 200,
        message: `Starting Vim Tutor: ${step.title}`,
      };
    } catch (error) {
      logger.error('Failed to start Vim Tutor:', error);
      return {
        status: 500,
        message: 'Failed to start Vim tutorial.',
      };
    }
  },
};

export default VimTutCommand;
