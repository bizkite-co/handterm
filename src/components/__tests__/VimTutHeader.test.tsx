import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VimTutHeader } from '../VimTutHeader';
import * as vimTutorialSignals from '../../signals/vimTutorialSignals';

vi.mock('../../utils/navigationUtils', () => ({
  navigate: vi.fn(),
}));

describe('VimTutHeader', () => {
  beforeEach(() => {
    vimTutorialSignals.resetVimTutorial();
    vi.clearAllMocks();
  });

  it('renders step title, badge, and instruction', () => {
    render(<VimTutHeader />);

    expect(screen.getByTestId('vimtut-header')).toBeTruthy();
    expect(screen.getByTestId('vimtut-step-badge').textContent).toContain('vtut-1.1:');
    expect(screen.getByTestId('vimtut-step-title').textContent).toBe('Move the cursor to TARGET');
  });

  it('toggles hint when hint command clicked', () => {
    render(<VimTutHeader />);

    const hintCmd = screen.getByText(/\[:h hint\]/i);
    expect(vimTutorialSignals.showVimHintSignal.value).toBe(false);

    fireEvent.click(hintCmd);
    expect(vimTutorialSignals.showVimHintSignal.value).toBe(true);
    expect(screen.getByText(/\[:h hide hint\]/i)).toBeTruthy();

    const hideHintCmd = screen.getByText(/\[:h hide hint\]/i);
    fireEvent.click(hideHintCmd);
    expect(vimTutorialSignals.showVimHintSignal.value).toBe(false);
  });

  it('calls onAdvanceStep when [:n next] clicked', () => {
    const onAdvanceStep = vi.fn();

    render(<VimTutHeader onAdvanceStep={onAdvanceStep} />);

    const nextCmd = screen.getByText(/\[:n next\]/i);
    fireEvent.click(nextCmd);

    expect(onAdvanceStep).toHaveBeenCalled();
  });

  it('shows auto-advancing indicator when step is completed', () => {
    vimTutorialSignals.vimStepCompletedSignal.value = true;
    const onAdvanceStep = vi.fn();

    render(<VimTutHeader onAdvanceStep={onAdvanceStep} />);

    expect(screen.getByTestId('vimtut-success-banner')).toBeTruthy();
    expect(screen.getByText(/Advancing to next task/i)).toBeTruthy();
  });

  it('displays accomplishment banner above instructions when a previous step was completed', () => {
    vimTutorialSignals.lastVimAccomplishmentSignal.value = {
      stepId: 'vtut-1.1',
      stepTitle: 'vtut-1.1: Move the cursor to TARGET',
      message: 'Great job! You navigated to TARGET using hjkl motions.',
    };

    render(<VimTutHeader />);

    const banner = screen.getByTestId('vimtut-accomplishment');
    expect(banner).toBeTruthy();
    expect(screen.getByText(/Accomplished:/i)).toBeTruthy();
    expect(banner.querySelector('.vimtut-accomplishment-title')?.textContent).toContain('vtut-1.1: Move the cursor to TARGET');
    expect(screen.getByText(/Great job! You navigated to TARGET/i)).toBeTruthy();
  });

  it('calls onRestartStep when [:r restart] clicked', () => {
    const onRestartStep = vi.fn();

    render(<VimTutHeader onRestartStep={onRestartStep} />);

    const restartCmd = screen.getByText(/\[:r restart\]/i);
    fireEvent.click(restartCmd);

    expect(onRestartStep).toHaveBeenCalled();
  });
});
