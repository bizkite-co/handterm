import { createMachine } from 'xstate';

export const activityMachine = createMachine({
  id: 'activity',
  initial: 'normal',
  states: {
    normal: {
      on: {
        START_GAME: 'game',
        START_TUTORIAL: 'tutorial',
        START_EDIT: 'edit',
      },
    },
    game: {
      on: {
        END_GAME: 'normal',
        CHANGE_PHRASE: 'game',
      },
    },
    tutorial: {
      on: {
        END_TUTORIAL: 'normal',
        NEXT_TUTORIAL: 'tutorial',
      },
    },
    edit: {
      on: {
        END_EDIT: 'normal',
      },
    },
  },
});