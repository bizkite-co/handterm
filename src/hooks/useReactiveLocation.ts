import { ActivityType } from '../types/Types';

export const useReactiveLocation = () => ({
  reactiveLocation: {
    activity: 'normal',
    phraseKey: '',
    groupKey: '',
    getPath: jest.fn(),
  },
  updateLocation: jest.fn(),
  parseLocation: () => ({
    activityKey: ActivityType.NORMAL,
    contentKey: '',
    groupKey: ''
  })
});
