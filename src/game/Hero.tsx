// Hero.tsx

import { useBaseCharacter } from "./useBaseCharacter";
import { HeroActions } from "./types/ActionTypes";
import { ICharacterProps } from "./ICharacterProps";
import { forwardRef, useImperativeHandle } from "react";
import { SpritePosition } from "./types/Position";

export const Hero = forwardRef((props: ICharacterProps, ref) => {

  // Use the custom hook for shared logic with BaseCharacter
  const { draw } = useBaseCharacter({
    actions: HeroActions,
    currentActionType: props.currentActionType, // Replace with actual default action
    name: 'Hero',
    scale: props.scale,
  });

  useImperativeHandle(ref, () => ({
    draw
  }));

  return null;
});