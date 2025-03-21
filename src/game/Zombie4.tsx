import { forwardRef, useImperativeHandle } from 'react';

import { type ICharacterProps } from './ICharacterProps';
import { Zombie4Actions } from './types/ActionTypes';
import { useBaseCharacter } from './useBaseCharacter';


// * Idle - 5 frames
// * Walk - 13 frames
// * Attack - 15 frames
// * Hurt - 7 frames
// * Death - 12 frames
// * Spawn - 10 frames
// There are 6 animations. All frames are on a 62x62 "canvas."

export const Zombie4 = forwardRef((props: ICharacterProps, ref) => {
  const { draw } = useBaseCharacter({
    actions: Zombie4Actions,
    currentActionType: props.currentActionType,
    name: 'Zombie4',
    scale: props.scale,
    xOffset: 77,
    positionRef: props.positionRef
  });

  useImperativeHandle(ref, () => ({
    draw: (context: CanvasRenderingContext2D) => {
      return draw(context, props.positionRef, props.scale);
    }
  }));

  return null;
});

Zombie4.displayName = 'Zombie4';
