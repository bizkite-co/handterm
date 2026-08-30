import { render, act, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';

import { TutorialManager } from './TutorialManager';
import { commandLineSignal, setCommandLine } from 'src/signals/commandLineSignals';
import { type GamePhrase } from '@handterm/types';

const tutorialPhrase: GamePhrase = {
  key: 'fdsa',
  displayAs: 'Tutorial',
  value: 'Type `fdsa` and Enter.',
};

describe('TutorialManager', () => {
  beforeEach(() => {
    commandLineSignal.value = '';
  });

  test('renders all tutorial key chords before any typing', () => {
    render(<TutorialManager tutorial={tutorialPhrase} />);
    expect(screen.getByText('Type `fdsa` and Enter.')).toBeInTheDocument();
    expect(screen.getByTestId('tutorial-chords').textContent).toBe('fdsa');
  });

  test('removes each correctly typed character from the chord display (game-like shrink)', async () => {
    render(<TutorialManager tutorial={tutorialPhrase} />);

    // Each keystroke flows through handleData -> setCommandLine -> this component
    for (const prefix of ['f', 'fd', 'fds']) {
      await act(async () => {
        setCommandLine(prefix);
      });
    }

    expect(screen.getByTestId('tutorial-chords').textContent).toBe('a');
    expect(screen.queryByText('f')).not.toBeInTheDocument();
    expect(screen.queryByText('d')).not.toBeInTheDocument();
    expect(screen.queryByText('s')).not.toBeInTheDocument();

    // Completing the key empties the chord display
    await act(async () => {
      setCommandLine('fdsa');
    });
    expect(screen.getByTestId('tutorial-chords').textContent).toBe('');
  });

  test('keeps remaining chords on a mismatching character (no removal)', async () => {
    render(<TutorialManager tutorial={tutorialPhrase} />);

    await act(async () => {
      setCommandLine('fdx');
    });

    expect(screen.getByTestId('tutorial-chords').textContent).toBe('sa');
  });

  test('renders an empty container when no tutorial is provided', () => {
    render(<TutorialManager tutorial={null} />);
    expect(screen.getByTestId('tutorial-component').textContent).toBe('');
  });

  test('auto-completes (fires onTutorialComplete) when the full key is typed, like game play', async () => {
    const onTutorialComplete = vi.fn();
    render(<TutorialManager tutorial={tutorialPhrase} onTutorialComplete={onTutorialComplete} />);

    for (const prefix of ['f', 'fd', 'fds']) {
      await act(async () => {
        setCommandLine(prefix);
      });
    }
    expect(onTutorialComplete).not.toHaveBeenCalled();

    await act(async () => {
      setCommandLine('fdsa');
    });
    expect(onTutorialComplete).toHaveBeenCalledTimes(1);
    expect(onTutorialComplete).toHaveBeenCalledWith('fdsa');
  });

  test('does not auto-complete for the \\r (ENTER) tutorial; ENTER unlocks it elsewhere', async () => {
    const onTutorialComplete = vi.fn();
    const enterTutorial: GamePhrase = {
      key: '\r',
      displayAs: 'Tutorial',
      value: 'Press the thumb tip and release.',
    };
    render(<TutorialManager tutorial={enterTutorial} onTutorialComplete={onTutorialComplete} />);

    await act(async () => {
      setCommandLine('\r');
    });
    expect(onTutorialComplete).not.toHaveBeenCalled();
  });
});