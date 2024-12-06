import { ActionType } from '../game/types/ActionTypes';
import { ActivityType, ParsedCommand, GamePhrase } from '../types/Types';

export interface IActivityMediatorReturn {
  isInGameMode: boolean;
  isInTutorial: boolean;
  isInEdit: boolean;
  isInNormal: boolean;
  heroAction: ActionType;
  zombie4Action: ActionType;
  handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
  setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>;
  setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
  checkTutorialProgress: (command: string | null) => void;
  checkGameProgress: (successPhrase: GamePhrase) => void;
}

export function useActivityMediator(): IActivityMediatorReturn;

// Explicitly declare the module to help TypeScript resolution
declare module 'src/hooks/useActivityMediator' {
  export { useActivityMediator, IActivityMediatorReturn };
}
