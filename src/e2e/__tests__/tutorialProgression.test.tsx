import { describe, it, expect, beforeEach } from 'vitest';
import { fireEvent, waitFor } from '@testing-library/react';
import { activitySignal } from 'src/signals/appSignals';
import { ActivityType } from 'src/types/Types';
import { resetCompletedTutorials } from 'src/signals/tutorialSignals';
import App from 'src/App';
import { render } from 'src/test-utils/test-utils';

describe('Tutorial Progression', () => {
  beforeEach(() => {
    // Reset the tutorial state before each test
    resetCompletedTutorials();
    // Ensure we start in tutorial mode
    activitySignal.value = ActivityType.TUTORIAL;
  });

  const typeAndEnter = async (text: string) => {
    // Type each character
    for (const key of text.split('')) {
      fireEvent.keyDown(document.body, { key });
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    // Press Enter
    fireEvent.keyDown(document.body, { key: 'Enter' });
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  it('should progress through tutorial steps and change to game mode', async () => {
    render(<App />);

    // First tutorial: Press Enter
    await typeAndEnter('');

    // Second tutorial: Type fdsa
    await typeAndEnter('fdsa');

    // Third tutorial: Type fdsa again
    await typeAndEnter('fdsa');

    // Fourth tutorial: Type jkl; (this completes the single-click group)
    await typeAndEnter('jkl;');

    // Wait for activity to change to Game
    await waitFor(() => {
      expect(activitySignal.value).toBe(ActivityType.GAME);
    }, { timeout: 2000 });
  });
});
