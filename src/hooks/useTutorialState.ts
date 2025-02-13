import { useEffect, useState } from 'react';
import { tutorialSignal } from 'src/signals/tutorialSignals';
import { allTutorialKeys, type GamePhrase } from '@handterm/types';

export function useTutorialState(): {
  shouldSkipTutorial: boolean;
  setShouldSkipTutorial: (value: boolean) => void;
} {
  const [shouldSkipTutorial, setShouldSkipTutorial] = useState(false);

  useEffect(() => {
    // Check localStorage for completed tutorials
    const completedTutorials = localStorage.getItem('completed-tutorials');
    const parsedTutorials = completedTutorials
      ? JSON.parse(completedTutorials) as GamePhrase[]
      : [];
    const hasCompletedTutorials = parsedTutorials.length === allTutorialKeys.length;

    setShouldSkipTutorial(hasCompletedTutorials );
  }, []);

  useEffect(() => {
    // Update skip state when bypass signal changes
    const unsubscribe = tutorialSignal.subscribe((value) => {
      setShouldSkipTutorial(Boolean(value));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    shouldSkipTutorial,
    setShouldSkipTutorial
  };
}
