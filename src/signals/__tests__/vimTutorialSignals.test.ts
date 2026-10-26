import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCurrentVimStep,
  setVimTutorialStep,
  advanceVimTutorial,
  resetVimTutorial,
  vimTutorialStepIndexSignal,
  vimStepCompletedSignal,
  lastVimAccomplishmentSignal,
} from '../vimTutorialSignals';
import { VIM_TUTORIAL_STEPS } from '../../utils/vimTutorialCurriculum';

describe('vimTutorialSignals', () => {
  beforeEach(() => {
    resetVimTutorial();
  });

  it('initializes at step 0', () => {
    expect(vimTutorialStepIndexSignal.value).toBe(0);
    const step = getCurrentVimStep();
    expect(step.id).toBe(VIM_TUTORIAL_STEPS[0]!.id);
  });

  it('advances to next step with advanceVimTutorial', () => {
    const next = advanceVimTutorial();
    expect(next).not.toBeNull();
    expect(vimTutorialStepIndexSignal.value).toBe(1);
    expect(getCurrentVimStep().id).toBe(VIM_TUTORIAL_STEPS[1]!.id);
  });

  it('sets tutorial step within valid bounds', () => {
    setVimTutorialStep(3);
    expect(vimTutorialStepIndexSignal.value).toBe(3);
    expect(getCurrentVimStep().id).toBe(VIM_TUTORIAL_STEPS[3]!.id);

    // Clamps out of bound negative index
    setVimTutorialStep(-5);
    expect(vimTutorialStepIndexSignal.value).toBe(0);

    // Clamps out of bound upper index
    setVimTutorialStep(999);
    expect(vimTutorialStepIndexSignal.value).toBe(VIM_TUTORIAL_STEPS.length - 1);
  });

  it('resets step index, completion, and accomplishment signals with resetVimTutorial', () => {
    setVimTutorialStep(3);
    vimStepCompletedSignal.value = true;
    lastVimAccomplishmentSignal.value = {
      stepId: 'vim-01',
      stepTitle: 'Lesson 1.1',
      message: 'Done!',
    };
    resetVimTutorial();

    expect(vimTutorialStepIndexSignal.value).toBe(0);
    expect(vimStepCompletedSignal.value).toBe(false);
    expect(lastVimAccomplishmentSignal.value).toBeNull();
  });

  it('returns null when advancing past the last step', () => {
    setVimTutorialStep(VIM_TUTORIAL_STEPS.length - 1);
    const result = advanceVimTutorial();
    expect(result).toBeNull();
  });
});
