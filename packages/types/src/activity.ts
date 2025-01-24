// Activity type constants - use UPPERCASE properties to access lowercase string values
export const ActivityType = {
  NORMAL: 'normal',
  EDIT: 'edit',
  GITHUB: 'github',
  TREE: 'tree',
  TUTORIAL: 'tutorial',
  GAME: 'game'
} as const;

export type ActivityType = typeof ActivityType[keyof typeof ActivityType];

export interface EditorActivityState {
  content: string;
  language: string;
  isDirty: boolean;
}

export interface TreeViewActivityState {
  items: unknown[];
  selectedPath: string;
}