import type { ActivityType } from '../constants/ActivityType';
import type { GamePhrase } from './Types';

declare global {
  interface Window {
    setActivity: (activity: ActivityType) => void;
    setNextTutorial: (tutorial: GamePhrase | null) => void;
  }
}

export {};
