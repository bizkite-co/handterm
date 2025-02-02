import { type ActionType } from "@handterm/types";
import { type SpritePosition } from "./types/Position";

export interface ICharacterProps {
  currentActionType: ActionType;
  positionRef: React.RefObject<SpritePosition>,
  scale: number;
}