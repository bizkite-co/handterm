import { type ActionType } from "@handterm/types";
import { type SpritePosition, type CharacterHitbox } from "./types/Position";

export interface ICharacterProps {
  currentActionType: ActionType;
  positionRef: React.RefObject<SpritePosition>,
  scale: number;
  flip?: boolean | undefined;
  hitbox?: CharacterHitbox | undefined;
}