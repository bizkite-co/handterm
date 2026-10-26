import { useState, type JSX } from 'react';
import { useComputed } from '@preact/signals-react';
import {
  currentVimStepSignal,
  vimTutorialStepIndexSignal,
  vimStepCompletedSignal,
  vimStepMessageSignal,
  advanceVimTutorial,
  setVimTutorialStep,
} from '../signals/vimTutorialSignals';
import { VIM_TUTORIAL_STEPS } from '../utils/vimTutorialCurriculum';
import { navigate } from '../utils/navigationUtils';
import { ActivityType } from '@handterm/types';
import './VimTutHeader.css';

interface VimTutHeaderProps {
  currentCursor?: { lineNumber: number; column: number };
  currentMode?: string;
  onAdvanceStep?: () => void;
  onRestartStep?: () => void;
}

export function VimTutHeader({
  currentCursor = { lineNumber: 1, column: 1 },
  currentMode = 'normal',
  onAdvanceStep,
  onRestartStep,
}: VimTutHeaderProps): JSX.Element {
  const [showHint, setShowHint] = useState(false);
  const step = useComputed(() => currentVimStepSignal.value).value;
  const stepIndex = useComputed(() => vimTutorialStepIndexSignal.value).value;
  const isCompleted = useComputed(() => vimStepCompletedSignal.value).value;
  const successMsg = useComputed(() => vimStepMessageSignal.value).value;

  const totalSteps = VIM_TUTORIAL_STEPS.length;
  const isLastStep = stepIndex >= totalSteps - 1;

  const handleNext = () => {
    advanceVimTutorial();
    setShowHint(false);
    onAdvanceStep?.();
  };

  const handleRestart = () => {
    setVimTutorialStep(stepIndex);
    setShowHint(false);
    onRestartStep?.();
  };

  const handleExit = () => {
    navigate({ activityKey: ActivityType.NORMAL });
  };

  return (
    <div className="vimtut-header-container" data-testid="vimtut-header">
      <div className="vimtut-header-top">
        <div className="vimtut-header-title-badge">
          <span className="vimtut-badge">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <h2 className="vimtut-header-title">{step.title}</h2>
        </div>

        <div className="vimtut-controls">
          {step.hint && (
            <button
              type="button"
              className="vimtut-btn"
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : '💡 Hint'}
            </button>
          )}
          <button
            type="button"
            className="vimtut-btn"
            onClick={handleRestart}
          >
            Restart Step
          </button>
          {isCompleted && !isLastStep && (
            <button
              type="button"
              className="vimtut-btn vimtut-btn-primary"
              onClick={handleNext}
            >
              Next Step ➔
            </button>
          )}
          <button
            type="button"
            className="vimtut-btn"
            onClick={handleExit}
          >
            Exit (:q)
          </button>
        </div>
      </div>

      <div className="vimtut-instruction-box">
        {step.instruction}
      </div>

      {showHint && step.hint && (
        <div className="vimtut-hint-box">
          <strong>Hint:</strong> {step.hint}
        </div>
      )}

      {isCompleted && (
        <div className="vimtut-success-banner" data-testid="vimtut-success-banner">
          <span>🎉 {successMsg ?? step.successMessage ?? 'Step completed!'}</span>
          {!isLastStep && (
            <button
              type="button"
              className="vimtut-btn vimtut-btn-primary"
              onClick={handleNext}
            >
              Continue ➔
            </button>
          )}
        </div>
      )}

      <div className="vimtut-status-bar">
        <div className="vimtut-status-indicators">
          <span className="vimtut-status-tag">
            <strong>Mode:</strong> {currentMode.toUpperCase()}
          </span>
          <span className="vimtut-status-tag">
            <strong>Position:</strong> Ln {currentCursor.lineNumber}, Col {currentCursor.column}
          </span>
        </div>
      </div>
    </div>
  );
}
