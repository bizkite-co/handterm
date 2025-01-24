export const ActivityType = {
  NORMAL: 'NORMAL',
  TUTORIAL: 'TUTORIAL',
  GAME: 'GAME',
  EDIT: 'EDIT',
  TREE: 'TREE'
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