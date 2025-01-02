import type { ActivityType } from '../constants/ActivityType';
import type { Tutorial } from './Types';

declare global {
  interface Window {
    setActivity: (activity: ActivityType) => void;
    setNextTutorial: (tutorial: Tutorial | null) => void;
  }
}

export {};
