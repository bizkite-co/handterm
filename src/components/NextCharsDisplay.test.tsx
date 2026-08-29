import { render, act, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';

import NextCharsDisplay from './NextCharsDisplay';
import { gamePhraseSignal } from 'src/signals/gameSignals';
import { commandLineSignal, setCommandLine } from 'src/signals/commandLineSignals';
import { type GamePhrase } from '@handterm/types';

vi.mock('./Timer', () => ({ default: () => null }));
vi.mock('./ErrorDisplay', () => ({ default: () => null }));

const firstPhrase: GamePhrase = {
  key: 'first-eight',
  displayAs: 'Game',
  value: 'all sad lads ask dad; alas fads fall',
  tutorialGroup: 'single-click',
};

const secondPhrase: GamePhrase = {
  key: 'numbers',
  displayAs: 'Game',
  value: '0123 4567 8901 2345 6789 0987',
  tutorialGroup: 'numbers',
};

const tutorialPhrase: GamePhrase = {
  key: 'fdsa',
  displayAs: 'Tutorial',
  value: 'Type `fdsa` and Enter.',
};

describe('NextCharsDisplay', () => {
  beforeEach(() => {
    gamePhraseSignal.value = null;
    commandLineSignal.value = '';
  });

  test('removes typed characters from nextChars as the command line grows', async () => {
    await act(async () => {
      gamePhraseSignal.value = firstPhrase;
    });
    const { container } = render(
      <NextCharsDisplay isInPhraseMode={true} onPhraseSuccess={vi.fn()} onError={vi.fn()} />
    );
    expect(screen.getByText('all sad lads ask dad; alas fads fall')).toBeInTheDocument();

    // Each keystroke flows through handleData -> setCommandLine -> this component
    for (const prefix of ['a', 'al', 'all', 'all ', 'all s', 'all sa']) {
      await act(async () => {
        setCommandLine(prefix);
      });
    }

    expect(screen.getByText('d lads ask dad; alas fads fall')).toBeInTheDocument();
    expect(screen.queryByText('all sad lads ask dad; alas fads fall')).not.toBeInTheDocument();

    // Finishing the phrase empties nextChars (and fires onPhraseSuccess)
    await act(async () => {
      setCommandLine('all sad lads ask dad; alas fads fall');
    });
    expect(container.querySelector('#next-chars')?.textContent).toBe('');
  });

  test('shows the current game phrase from gamePhraseSignal', async () => {
    await act(async () => {
      gamePhraseSignal.value = firstPhrase;
    });
    render(
      <NextCharsDisplay isInPhraseMode={true} onPhraseSuccess={vi.fn()} onError={vi.fn()} />
    );
    expect(screen.getByText('all sad lads ask dad; alas fads fall')).toBeInTheDocument();
  });

  test('switches to the next phrase when gamePhraseSignal changes (level-up)', async () => {
    await act(async () => {
      gamePhraseSignal.value = firstPhrase;
    });
    render(
      <NextCharsDisplay isInPhraseMode={true} onPhraseSuccess={vi.fn()} onError={vi.fn()} />
    );
    expect(screen.getByText('all sad lads ask dad; alas fads fall')).toBeInTheDocument();

    // The mediator sets the next phrase on level-up; the display must reload it
    await act(async () => {
      gamePhraseSignal.value = secondPhrase;
    });

    expect(screen.getByText('0123 4567 8901 2345 6789 0987')).toBeInTheDocument();
    expect(screen.queryByText('all sad lads ask dad; alas fads fall')).not.toBeInTheDocument();
  });

  test('does not render tutorial explanatory text as a typing phrase', async () => {
    await act(async () => {
      gamePhraseSignal.value = tutorialPhrase;
    });
    render(
      <NextCharsDisplay isInPhraseMode={true} onPhraseSuccess={vi.fn()} onError={vi.fn()} />
    );
    expect(screen.queryByText('Type `fdsa` and Enter.')).not.toBeInTheDocument();
  });
});