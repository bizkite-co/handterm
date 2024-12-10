import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, act } from '@testing-library/react';
import { activitySignal } from 'src/signals/appSignals';
import { ActivityType } from 'src/types/Types';
import { resetCompletedTutorials, tutorialSignal, setNextTutorial, getNextTutorial } from 'src/signals/tutorialSignals';
import App from 'src/App';
import { render } from 'src/test-utils/test-utils';
import { createLogger } from 'src/utils/Logger';

const logger = createLogger({ prefix: 'tutorialProgression.test' });

describe('Tutorial Progression', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset the tutorial state before each test
    resetCompletedTutorials();
    // Initialize tutorial state
    const firstTutorial = getNextTutorial();
    logger.debug('Initial tutorial:', firstTutorial);
    setNextTutorial(firstTutorial);
    // Ensure we start in tutorial mode with initial tutorial
    activitySignal.value = ActivityType.TUTORIAL;
    window.history.pushState({}, '', '/tutorial/_r');
    logger.debug('Initial location:', window.location.pathname);
  });

  const simulateCommand = async (text: string) => {
    logger.debug('Simulating command:', text);
    // Type each character through the terminal
    for (const char of text.split('')) {
      logger.debug('Typing character:', char);
      await act(async () => {
        // debugger; // Breakpoint 1: Before sending character
        (window as any).triggerTerminalInput(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      });
    }
    // Send Enter with proper terminal sequence
    logger.debug('Sending Enter');
    await act(async () => {
      // debugger; // Breakpoint 2: Before sending Enter
      (window as any).triggerTerminalInput('\r');
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  const waitForTutorialState = async (expectedPhrase: string) => {
    await waitFor(() => {
      // debugger; // Breakpoint 3: Checking tutorial state
      logger.debug('Current tutorial state:', {
        phrase: tutorialSignal.value?.phrase,
        expected: expectedPhrase,
        location: window.location.pathname,
        activity: activitySignal.value,
        prompt: tutorialSignal.value?.prompt
      });
      expect(tutorialSignal.value?.phrase).toBe(expectedPhrase);
    }, { timeout: 1000 });
  };

  const waitForActivityState = async (expectedActivity: ActivityType) => {
    await waitFor(() => {
      // debugger; // Breakpoint 4: Checking activity state
      logger.debug('Current activity state:', {
        activity: activitySignal.value,
        expected: expectedActivity,
        location: window.location.pathname,
        tutorial: tutorialSignal.value?.phrase,
        prompt: tutorialSignal.value?.prompt
      });
      expect(activitySignal.value).toBe(expectedActivity);
    }, { timeout: 1000 });
  };

  it('should progress through tutorial steps and change to game mode', async () => {
    logger.debug('Starting test');
    render(<App />);

    // Given the user is in the tutorial mode
    await waitForTutorialState('\r');

    // When the user types "Enter"
    logger.debug('Testing first tutorial (Enter)');
    await simulateCommand('\r');
    await waitForTutorialState('fdsa');

    // And the user types "fdsa"
    logger.debug('Testing second tutorial (fdsa)');
    await simulateCommand('fdsa');
    await waitForTutorialState('jkl;');

    // And the user types "jkl;"
    logger.debug('Testing third tutorial (jkl;)');
    await simulateCommand('jkl;');

    // Then the Activity should change from Tutorial to Game
    await waitForActivityState(ActivityType.GAME);
    expect(window.location.pathname).toContain('/game');
  });
});
