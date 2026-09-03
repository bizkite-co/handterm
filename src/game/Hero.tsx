// Hero.tsx

import { forwardRef, useImperativeHandle } from "react";

import { type ICharacterProps } from "./ICharacterProps";
import { HeroActions } from "./types/ActionTypes";
import { useBaseCharacter } from "./useBaseCharacter";


export const Hero = forwardRef((props: ICharacterProps, ref) => {

  // Use the custom hook for shared logic with BaseCharacter
  const { draw } = useBaseCharacter({
    actions: HeroActions,
    currentActionType: props.currentActionType,
    name: 'Hero',
    scale: props.scale,
    xOffset: 0,
    positionRef: props.positionRef,
    flip: props.flip
  });

  // The hero's body footprint is exposed via the imperative handle so the Game
  // can detect contact with the zombie (a "character width" property).
  useImperativeHandle(ref, () => ({
    draw: (context: CanvasRenderingContext2D) => {
      return draw(context, props.positionRef, props.scale);
    },
    hitbox: props.hitbox ?? { left: 29, width: 43 }
  }));

  return null;
});

Hero.displayName = 'Hero';
