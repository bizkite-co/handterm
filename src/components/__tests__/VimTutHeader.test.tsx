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

  it('renders step title, badge, mode, and position', () => {
    render(
      <VimTutHeader
        currentCursor={{ lineNumber: 3, column: 12 }}
        currentMode="normal"
      />
    );

    expect(screen.getByTestId('vimtut-header')).toBeTruthy();
    expect(screen.getByText(/Step 1 of/i)).toBeTruthy();
    expect(screen.getByText(/Lesson 1.1/i)).toBeTruthy();
    expect(screen.getByText(/NORMAL/i)).toBeTruthy();
    expect(screen.getByText(/Ln 3, Col 12/i)).toBeTruthy();
  });

  it('toggles hint when hint button clicked', () => {
    render(<VimTutHeader />);

    const hintBtn = screen.getByRole('button', { name: /💡 Hint/i });
    expect(screen.queryByText(/Make sure you are in NORMAL mode/i)).toBeNull();

    fireEvent.click(hintBtn);
    expect(screen.getByText(/Make sure you are in NORMAL mode/i)).toBeTruthy();

    fireEvent.click(hintBtn);
    expect(screen.queryByText(/Make sure you are in NORMAL mode/i)).toBeNull();
  });

  it('calls onAdvanceStep when Next Step clicked', () => {
    vimTutorialSignals.vimStepCompletedSignal.value = true;
    const onAdvanceStep = vi.fn();

    render(<VimTutHeader onAdvanceStep={onAdvanceStep} />);

    const nextButtons = screen.getAllByRole('button', { name: /Next Step/i });
    fireEvent.click(nextButtons[0]!);

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
      stepId: 'vim-01-hjkl',
      stepTitle: 'Lesson 1.1: Moving the Cursor (h, j, k, l)',
      message: 'Great job! You navigated to the target using hjkl motions.',
    };

    render(<VimTutHeader />);

    const banner = screen.getByTestId('vimtut-accomplishment');
    expect(banner).toBeTruthy();
    expect(screen.getByText(/Accomplished:/i)).toBeTruthy();
    expect(banner.querySelector('.vimtut-accomplishment-title')?.textContent).toContain('Lesson 1.1: Moving the Cursor');
    expect(screen.getByText(/Great job! You navigated to the target/i)).toBeTruthy();
  });

  it('calls onRestartStep when Restart Step clicked', () => {
    const onRestartStep = vi.fn();

    render(<VimTutHeader onRestartStep={onRestartStep} />);

    const restartBtn = screen.getByRole('button', { name: /Restart Step/i });
    fireEvent.click(restartBtn);

    expect(onRestartStep).toHaveBeenCalled();
  });
});
