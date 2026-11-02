import { useState, useEffect, type JSX } from 'react';
import { useComputed } from '@preact/signals-react';
import {
  currentVimStepSignal,
  vimTutorialStepIndexSignal,
  vimStepCompletedSignal,
  vimStepMessageSignal,
  lastVimAccomplishmentSignal,
  showVimHintSignal,
  toggleVimHint,
  advanceVimTutorial,
  setVimTutorialStep,
} from '../signals/vimTutorialSignals';
import { VIM_TUTORIAL_STEPS } from '../utils/vimTutorialCurriculum';
import { navigate } from '../utils/navigationUtils';
import { setActivity } from '../signals/appSignals';
import { ActivityType } from '@handterm/types';
import './VimTutHeader.css';

export interface VimGuideProps {
  currentCursor?: { lineNumber: number; column: number };
  currentMode?: string;
  onAdvanceStep?: () => void;
  onRestartStep?: () => void;
}

export function VimGuide({
  onAdvanceStep,
  onRestartStep,
}: VimGuideProps): JSX.Element {
  const [showHint, setShowHint] = useState(() => showVimHintSignal.value);
  const step = useComputed(() => currentVimStepSignal.value).value;
  const stepIndex = useComputed(() => vimTutorialStepIndexSignal.value).value;
  const isCompleted = useComputed(() => vimStepCompletedSignal.value).value;
  const successMsg = useComputed(() => vimStepMessageSignal.value).value;
  const lastAccomplishment = useComputed(() => lastVimAccomplishmentSignal.value).value;

  useEffect(() => {
    return showVimHintSignal.subscribe((val) => {
      setShowHint(val);
    });
  }, []);

  const totalSteps = VIM_TUTORIAL_STEPS.length;
  const isLastStep = stepIndex >= totalSteps - 1;

  const handleToggleHint = () => {
    toggleVimHint();
  };

  const handleNext = () => {
    advanceVimTutorial();
    onAdvanceStep?.();
  };

  const handleRestart = () => {
    setVimTutorialStep(stepIndex);
    setShowHint(false);
    onRestartStep?.();
  };

  const handleExit = () => {
    setActivity(ActivityType.NORMAL);
    navigate({ activityKey: ActivityType.NORMAL });
  };

  return (
    <div className="vim-guide vimtut-header-container" data-testid="vimtut-header">
      {/* 1. Previous Achievement (Rich-like borderless formatting) */}
      {lastAccomplishment && (
        <div className="vimtut-accomplishment-banner" data-testid="vimtut-accomplishment">
          <span className="vimtut-accomplishment-check">✓</span>
          <span className="vimtut-accomplishment-content">
            <strong className="vimtut-accomplishment-label">Accomplished:</strong>{' '}
            <span className="vimtut-accomplishment-title">{lastAccomplishment.stepTitle}</span> —{' '}
            <span className="vimtut-accomplishment-msg">{lastAccomplishment.message}</span>
          </span>
        </div>
      )}

      {/* 2. Current Task Title and Controls */}
      <div className="vim-guide-header vimtut-header-top">
        <div className="vim-guide-title-group vimtut-header-title-badge">
          <span className="vim-guide-step-tag vimtut-badge" data-testid="vimtut-step-badge">
            {step.id}:
          </span>
          <h2 className="vim-guide-title vimtut-header-title" data-testid="vimtut-step-title">
            {step.title}
          </h2>
        </div>

        <div className="vim-guide-commands vimtut-controls">
          {step.hint && (
            <span
              role="button"
              tabIndex={0}
              className="vim-guide-cmd vimtut-btn"
              onClick={handleToggleHint}
              onKeyDown={(e) => { if (e.key === 'Enter') handleToggleHint(); }}
            >
              {showHint ? '[:h hide hint]' : '[:h hint]'}
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            className="vim-guide-cmd vimtut-btn"
            onClick={handleRestart}
            onKeyDown={(e) => { if (e.key === 'Enter') handleRestart(); }}
          >
            [:r restart]
          </span>
          {!isLastStep && (
            <span
              role="button"
              tabIndex={0}
              className="vim-guide-cmd vimtut-btn"
              onClick={handleNext}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
            >
              [:n next]
            </span>
          )}
          <span
            role="button"
            tabIndex={0}
            className="vim-guide-cmd vimtut-btn"
            onClick={handleExit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleExit(); }}
          >
            [:q exit]
          </span>
        </div>
      </div>

      {/* 3. Current Task Instruction */}
      <div className="vim-guide-instruction vimtut-instruction-box">
        {step.instruction}
      </div>

      {/* 4. Completion Achievement Block (displayed for 1000ms success hold) */}
      {isCompleted && (
        <div className="vimtut-success-banner" data-testid="vimtut-success-banner">
          <span className="vimtut-success-check">✓</span>
          <span className="vimtut-success-content">
            <strong>Accomplished:</strong> {step.id}: {step.title} — {successMsg ?? step.successMessage ?? 'Step completed!'}
            {!isLastStep ? (
              <span className="vimtut-autoadvance-indicator"> (Advancing to next task...)</span>
            ) : (
              <span className="vimtut-autoadvance-indicator"> (All lessons completed! Type :q to exit)</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}

// Re-export as VimTutHeader for backward compatibility
export const VimTutHeader = VimGuide;
export type VimTutHeaderProps = VimGuideProps;
