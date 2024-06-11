import { useBaseCharacter } from './useBaseCharacter';
import { Zombie4Actions } from './types/ActionTypes';
import { ICharacterProps } from './ICharacterProps';
import { forwardRef, useImperativeHandle } from 'react';
import { SpritePosition } from './types/Position';

// * Idle - 5 frames
// * Walk - 13 frames
// * Attack - 15 frames
// * Hurt - 7 frames
// * Death - 12 frames
// * Spawn - 10 frames
// There are 6 animations. All frames are on a 62x62 "canvas."

export const Zombie4 = forwardRef((props: ICharacterProps, ref) => {

  // Use the custom hook for shared logic with BaseCharacter
  const { draw } = useBaseCharacter({
    actions: Zombie4Actions,
    currentActionType: props.currentActionType, // Replace with actual default action
    name: 'Zombie4',
    scale: props.scale,
  });

  useImperativeHandle(ref, () => ({
    draw
  }));

  return null;
});