export interface IVimCursorPosition {
  lineNumber: number;
  column: number;
}

export interface VimTutorialStep {
  id: string;
  title: string;
  instruction: string;
  hint?: string;
  initialText: string;
  initialCursor?: IVimCursorPosition;
  targetCursor?: IVimCursorPosition | ((cursor: IVimCursorPosition, text: string) => boolean);
  targetText?: string | ((text: string) => boolean);
  targetMode?: string | ((mode: string) => boolean);
  successMessage?: string;
}

export interface IVimTutorialProgress {
  currentStepIndex: number;
  completedStepIds: string[];
}
