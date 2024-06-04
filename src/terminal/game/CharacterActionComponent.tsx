import React, { useEffect } from 'react';
import { ActionType } from './types/ActionTypes';
import { BaseCharacter } from './BaseCharacter';

import { SpritePosition } from './types/Position';

interface ICharacterActionComponentProps {
  baseCharacter: BaseCharacter;
  currentActionType: ActionType;
  position: SpritePosition;
  name: string;
  canvasWidth: number;
  onPositionChange: (newPosition: SpritePosition) => void;
  isInScrollMode: boolean;
};

export const CharacterActionComponent: React.FC<ICharacterActionComponentProps> = (
  props: ICharacterActionComponentProps
) => {
  // Start or restart the animation when the action type changes
  // In CharacterActionComponent.tsx
  useEffect(() => {
    // Set the current action type
    props.baseCharacter.setCurrentActionType(props.currentActionType);

    // Start the animation loop and handle position updates
    props.baseCharacter.updatePositionAndAnimate(props.onPositionChange, props.canvasWidth, props.isInScrollMode);

    // Specify how to clean up after this effect
    return () => {
      props.baseCharacter.stopAnimation();
    };
  }, [props.currentActionType, props.baseCharacter, props.onPositionChange]);

  return null;
};