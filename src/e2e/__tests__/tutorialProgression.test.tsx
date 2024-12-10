import { describe, it, expect, beforeEach } from 'vitest';
import { waitFor, act } from '@testing-library/react';
import { activitySignal } from 'src/signals/appSignals';
import { ActivityType } from 'src/types/Types';
import { resetCompletedTutorials, tutorialSignal, setNextTutorial, getNextTutorial } from 'src/signals/tutorialSignals';
import App from 'src/App';
import { render } from 'src/test-utils/test-utils';

describe('Tutorial Progression', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset the tutorial state before each test
    resetCompletedTutorials();
    // Initialize tutorial state
    const firstTutorial = getNextTutorial();
    console.log('Initial tutorial:', firstTutorial);
    setNextTutorial(firstTutorial);
    // Ensure we start in tutorial mode with initial tutorial
    activitySignal.value = ActivityType.TUTORIAL;
    window.history.pushState({}, '', '/tutorial/_r');
    console.log('Initial location:', window.location.pathname);
  });

  const simulateCommand = async (text: string) => {
    console.log('Simulating command:', text);
    // Type each character through the terminal
    for (const char of text.split('')) {
      console.log('Typing character:', char);
      await act(async () => {
        // Breakpoint 1: Before sending character
        (window as any).triggerTerminalInput(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      });
    }
    // Send Enter with proper terminal sequence
    console.log('Sending Enter');
    await act(async () => {
      // Breakpoint 2: Before sending Enter
      (window as any).triggerTerminalInput('\r');
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  };

  const waitForTutorialState = async (expectedPhrase: string) => {
    await waitFor(() => {
      // Breakpoint 3: Checking tutorial state
      console.log('Current tutorial state:', {
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
      // Breakpoint 4: Checking activity state
      console.log('Current activity state:', {
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
    console.log('Starting test');
    render(<App />);

    // Wait for initial tutorial to load (Enter key tutorial)
    await waitForTutorialState('\r');

    // First tutorial: Press Enter
    console.log('Testing first tutorial (Enter)');
    await simulateCommand('\r');
    await waitForTutorialState('fdsa');

    // Second tutorial: Type fdsa
    console.log('Testing second tutorial (fdsa)');
    await simulateCommand('fdsa');
    await waitForTutorialState('fdsa');

    // Third tutorial: Type fdsa with spaces
    console.log('Testing third tutorial (fdsa with spaces)');
    await simulateCommand('f d s a');
    await waitForTutorialState('jkl;');

    // Fourth tutorial: Type jkl; (this completes the single-click group)
    console.log('Testing fourth tutorial (jkl;)');
    await simulateCommand('jkl;');

    // Wait for activity to change to Game
    await waitForActivityState(ActivityType.GAME);
    expect(window.location.pathname).toContain('/game');
  });
});
