import { signal, computed } from '@preact/signals-react';
import { createPersistentSignal } from '../utils/signalPersistence';
import { VIM_TUTORIAL_STEPS } from '../utils/vimTutorialCurriculum';
import type { VimTutorialStep, IVimCursorPosition } from '../types/VimTutorialTypes';
import { createLogger } from '../utils/Logger';

const logger = createLogger({ prefix: 'vimTutorialSignals' });

const VIM_CURRENT_STEP_KEY = 'vimtut-current-step';
const VIM_COMPLETED_STEPS_KEY = 'completed-vim-tutorials';

export const { signal: vimTutorialStepIndexSignal, update: updateVimTutorialStepIndex } = createPersistentSignal<number>({
  key: VIM_CURRENT_STEP_KEY,
  signal: signal<number>(0),
  serialize: (val) => String(val),
  deserialize: (str) => {
    const parsed = parseInt(str, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  },
});

export const { signal: completedVimTutorialsSignal, update: updateCompletedVimTutorials } = createPersistentSignal<Set<string>>({
  key: VIM_COMPLETED_STEPS_KEY,
  signal: signal<Set<string>>(new Set()),
  serialize: (set) => JSON.stringify([...set]),
  deserialize: (str) => {
    try {
      const arr = JSON.parse(str);
      return Array.isArray(arr) ? new Set(arr) : new Set();
    } catch {
      return new Set();
    }
  },
});

export const vimStepCompletedSignal = signal<boolean>(false);
export const vimStepMessageSignal = signal<string | null>(null);

export const currentVimStepSignal = computed<VimTutorialStep>(() => {
  const index = Math.max(0, Math.min(vimTutorialStepIndexSignal.value, VIM_TUTORIAL_STEPS.length - 1));
  return VIM_TUTORIAL_STEPS[index] ?? VIM_TUTORIAL_STEPS[0]!;
});

export function getCurrentVimStep(): VimTutorialStep {
  return currentVimStepSignal.value;
}

export function setVimTutorialStep(index: number): VimTutorialStep {
  const safeIndex = Math.max(0, Math.min(index, VIM_TUTORIAL_STEPS.length - 1));
  updateVimTutorialStepIndex(safeIndex);
  vimStepCompletedSignal.value = false;
  vimStepMessageSignal.value = null;
  return VIM_TUTORIAL_STEPS[safeIndex]!;
}

export function advanceVimTutorial(): VimTutorialStep | null {
  const nextIndex = vimTutorialStepIndexSignal.value + 1;
  if (nextIndex < VIM_TUTORIAL_STEPS.length) {
    return setVimTutorialStep(nextIndex);
  }
  logger.info('Vim tutorial completed all steps!');
  return null;
}

export function resetVimTutorial(): void {
  updateVimTutorialStepIndex(0);
  updateCompletedVimTutorials(new Set());
  vimStepCompletedSignal.value = false;
  vimStepMessageSignal.value = null;
  try {
    localStorage.removeItem(VIM_CURRENT_STEP_KEY);
    localStorage.removeItem(VIM_COMPLETED_STEPS_KEY);
  } catch (e) {
    logger.warn('Failed to clear vim tutorial keys from localStorage', e);
  }
}

export function evaluateVimStepConditions(
  step: VimTutorialStep,
  cursor: IVimCursorPosition,
  text: string,
  mode: string
): boolean {
  // If targetMode is required, check it
  if (step.targetMode) {
    const modeMatches = typeof step.targetMode === 'function'
      ? step.targetMode(mode)
      : step.targetMode.toLowerCase() === mode.toLowerCase();
    if (!modeMatches) return false;
  }

  // If targetText is required, check it
  if (step.targetText) {
    const textMatches = typeof step.targetText === 'function'
      ? step.targetText(text)
      : step.targetText === text;
    if (!textMatches) return false;
  }

  // If targetCursor is required, check it
  if (step.targetCursor) {
    const cursorMatches = typeof step.targetCursor === 'function'
      ? step.targetCursor(cursor, text)
      : step.targetCursor.lineNumber === cursor.lineNumber && step.targetCursor.column === cursor.column;
    if (!cursorMatches) return false;
  }

  return true;
}
