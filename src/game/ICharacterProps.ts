import { ActionType } from "./types/ActionTypes";
import { SpritePosition } from "./types/Position";

export interface ICharacterProps {
  currentActionType: ActionType;
  positionRef: React.RefObject<SpritePosition>,
  scale: number;
}