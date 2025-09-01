import { ActivityType } from '@handterm/types';

declare global {
  interface Window {
    setNextTutorial: (tutorialKey: string | null) => void;
    ActivityType: typeof ActivityType;
    __FORCE_EDIT_ACTIVITY__?: boolean;
  }
}
