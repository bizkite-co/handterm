import { describe, it, expect } from 'vitest';
import { VIM_TUTORIAL_STEPS } from '../vimTutorialCurriculum';
import { evaluateVimStepConditions } from '../../signals/vimTutorialSignals';

describe('VimTutorialCurriculum', () => {
  it('contains 6 defined tutorial lessons', () => {
    expect(VIM_TUTORIAL_STEPS.length).toBe(6);
  });

  it('each step has a unique id, title, instruction, and initialText', () => {
    const ids = new Set<string>();
    for (const step of VIM_TUTORIAL_STEPS) {
      expect(ids.has(step.id)).toBe(false);
      ids.add(step.id);
      expect(step.title.length).toBeGreaterThan(0);
      expect(step.instruction.length).toBeGreaterThan(0);
      expect(step.initialText.length).toBeGreaterThan(0);
    }
  });

  describe('Step 1 (hjkl navigation)', () => {
    const step = VIM_TUTORIAL_STEPS[0]!;

    it('validates target cursor position on line 3 target range', () => {
      expect(evaluateVimStepConditions(step, { lineNumber: 1, column: 1 }, step.initialText, 'normal')).toBe(false);
      expect(evaluateVimStepConditions(step, { lineNumber: 3, column: 38 }, step.initialText, 'normal')).toBe(true);
    });
  });

  describe('Step 2 (x character delete)', () => {
    const step = VIM_TUTORIAL_STEPS[1]!;

    it('validates corrected text', () => {
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 5 }, step.initialText, 'normal')).toBe(false);
      const fixedText = step.initialText.replace('ccow', 'cow');
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 5 }, fixedText, 'normal')).toBe(true);
    });
  });

  describe('Step 3 (dw word delete)', () => {
    const step = VIM_TUTORIAL_STEPS[2]!;

    it('validates removed duplicate word', () => {
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 1 }, step.initialText, 'normal')).toBe(false);
      const fixedText = step.initialText.replace('words words', 'words');
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 1 }, fixedText, 'normal')).toBe(true);
    });
  });

  describe('Step 4 (insert mode and back to normal)', () => {
    const step = VIM_TUTORIAL_STEPS[3]!;

    it('requires text to be updated AND mode to be normal', () => {
      const fixedText = step.initialText.replace('this .', 'this line.');
      // Text fixed but still in insert mode -> false
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 36 }, fixedText, 'insert')).toBe(false);
      // Text fixed and in normal mode -> true
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 36 }, fixedText, 'normal')).toBe(true);
    });
  });

  describe('Step 5 (word motions w, b, e)', () => {
    const step = VIM_TUTORIAL_STEPS[4]!;

    it('validates cursor reaching [GOAL]', () => {
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 1 }, step.initialText, 'normal')).toBe(false);
      expect(evaluateVimStepConditions(step, { lineNumber: 2, column: 50 }, step.initialText, 'normal')).toBe(true);
    });
  });
});
