import { signal } from '@preact/signals-react'
import { ActionType } from '../game/types/ActionTypes';
import { GamePhrase } from '../utils/GamePhrases';
import { SpritePosition } from 'src/game/types/Position';


export const heroActionSignal = signal<ActionType>('Idle');
export const heroPositionSignal = signal<SpritePosition>({leftX: 125, topY: 29})
export const zombie4ActionSignal = signal<ActionType>('Walk');
export const zombie4PostionSignal = signal<SpritePosition>({ leftX: -70, topY: 0})
export const gameLevelSignal = signal<number>(1);

export const setHeroAction = (action: ActionType) => {
  heroActionSignal.value = action;
};

export const setZombie4Action = (action: ActionType) => {
  zombie4ActionSignal.value = action;
};

export const setGameLevel = (level: number) => {
  gameLevelSignal.value = level;
};