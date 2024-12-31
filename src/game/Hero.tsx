// Hero.tsx

import { forwardRef, useImperativeHandle } from "react";

import { type ICharacterProps } from "./ICharacterProps";
import { HeroActions } from "./types/ActionTypes";
import { useBaseCharacter } from "./useBaseCharacter";


export const Hero = forwardRef((props: ICharacterProps, ref) => {

  // Use the custom hook for shared logic with BaseCharacter
  const { draw } = useBaseCharacter({
    actions: HeroActions,
    currentActionType: props.currentActionType, // Replace with actual default action
    name: 'Hero',
    scale: props.scale,
    xOffset: 0,
    positionRef: props.positionRef
  });

  useImperativeHandle(ref, () => ({
    draw: (context: CanvasRenderingContext2D) => {
      return draw(context, props.positionRef, props.scale);
    }
  }));

  return null;
});

Hero.displayName = 'Hero';
