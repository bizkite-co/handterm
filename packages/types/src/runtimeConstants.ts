const ActionType = {
  Run: 'Run',
  Idle: 'Idle',
  Walk: 'Walk',
  Jump: 'Jump',
  Attack: 'Attack',
  Summersault: 'Summersault',
  Death: 'Death',
  Hurt: 'Hurt',
} as const;

export type ActionType = typeof ActionType[keyof typeof ActionType];

export const ActivityType = {
  NORMAL: 'normal',
  EDIT: 'edit',
  GITHUB: 'github',
  TREE: 'tree',
  TUTORIAL: 'tutorial',
  GAME: 'game'
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];
export type ActivityTypeValues = typeof ActivityType[keyof typeof ActivityType];

export const TokenKeys = {
  AccessToken: 'AccessToken',
  RefreshToken: 'RefreshToken',
  IdToken: 'IdToken',
  ExpiresAt: 'ExpiresAt',
  ExpiresIn: 'ExpiresIn',
  GithubUsername: 'githubUsername'
} as const;
export type TokenKey = keyof typeof TokenKeys;

// TODO: Verify that any legacy runtime constants (e.g., those from src/types/HandTerm.d.ts) are fully migrated.
