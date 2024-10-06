import { useState, useCallback, useRef } from 'react';
import { Tutorial, ActivityType } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { GamePhrase } from '../utils/GamePhrases';
import { getNextTutorial, unlockTutorial } from '../utils/tutorialUtils';

export type IActivityMediatorReturn = {
  currentActivity: ActivityType;
  isInGameMode: boolean;
  isInTutorial: boolean;
  isInEdit: boolean;
  isInNormal: boolean;
  determineActivityState: (commandActivity?: ActivityType | null) => ActivityType;
  heroAction: ActionType;
  zombie4Action: ActionType;
  gameHandleRef: React.RefObject<IGameHandle>;
  handleCommandExecuted: (command: string, _args: string[], switches: Record<string, boolean | string>) => boolean;
  setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>,
  setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
  checkTutorialProgress: (command: string, args?: string[], _switches?: Record<string, string | boolean>) => { resultActivity: ActivityType, nextTutorial: Tutorial | null };
  checkGameProgress: (successPhrase: GamePhrase) => {
    resultActivityType: ActivityType;
  };
}

export interface IActivityMediatorProps {
  resetTutorial: () => void;
  currentTutorial?: Tutorial | null;
  tutorialGroupPhrase?: GamePhrase;
  setCurrentActivity: (currentActivity: ActivityType) => void;
  currentActivity: ActivityType;
  startGame: () => void;
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');

  const gameHandleRef = useRef<IGameHandle>(null);

  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    /*
      If the user is new to the site, 
        start the tutorial.
      If the user was in tutorial and completed an achievement that has accompanying game levels, 
        start game play.
      Otherwise, 
        just obey the command.
    */
    if (commandActivity && commandActivity !== props.currentActivity) {
      props.setCurrentActivity(commandActivity);
      return commandActivity;
    }

    if (props.currentTutorial && props.currentActivity !== ActivityType.TUTORIAL) {
      props.setCurrentActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (props.tutorialGroupPhrase && props.currentActivity !== ActivityType.GAME) {
      props.setCurrentActivity(ActivityType.GAME);
      props.startGame();
      return ActivityType.GAME;
    }

    return props.currentActivity;
  }, [props.currentTutorial, props.tutorialGroupPhrase, props.currentActivity, props.setCurrentActivity, props.startGame]);

  const handleCommandExecuted = useCallback((command: string, _args: string[], switches: Record<string, boolean | string>): boolean => {
    let result = false;
    switch (command) {
      case 'play':
        determineActivityState(ActivityType.GAME);
        result = true;
        break;
      case 'tut':
        if ('r' in switches) {
          props.resetTutorial();
        }
        console.log('useActivityMediator.handleCommand switch: TUTORIAL')
        determineActivityState(ActivityType.TUTORIAL);
        result = true;
        break;
      case 'edit':
        determineActivityState(ActivityType.EDIT);
        result = true;
        break;
      default:
        // Don't default to NORMAL. 
        result = false;
    }
    console.log("Switch Activity result:", ActivityType[props.currentActivity], "isSwitched:", result);
    return result;
  }, [props.setCurrentActivity, gameHandleRef]);

  const checkTutorialProgress = (
    command: string,
    _args?: string[],
    _switches?: Record<string, string | boolean>
  ): { resultActivity: ActivityType, nextTutorial: Tutorial | null } => {
    if (!props.currentTutorial) return { resultActivity: props.currentActivity, nextTutorial: null };
    /*
      If args include 'r', reset the tutorial and set TUTORIAL
      If the current tutorial achievement contains a tutorialGroupPhrase, then switch to GAME
      If there is a next tutorial achievement, stay in TUTORIAL
      If neither is true, return to NORMAL
    */

    // If the current tutorial has attached GamePhrases.
    // Don't unlock until the game is played.
    if (props.currentTutorial.tutorialGroup) {
      props.setCurrentActivity(ActivityType.GAME);
      // TODO: Pass phrases to game play
      props.startGame();
      return { resultActivity: ActivityType.GAME, nextTutorial: null };
    }
    const isUnlocked = unlockTutorial(command, props.currentTutorial);
    console.log("Unlock result:", isUnlocked);
    const nextTutorial = getNextTutorial();
    if (!nextTutorial) {
      props.setCurrentActivity(ActivityType.GAME);
      return { resultActivity: ActivityType.GAME, nextTutorial: null };
    }
    return { resultActivity: props.currentActivity, nextTutorial };
  };

  const checkGameProgress = (successPhrase: GamePhrase): { resultActivityType: ActivityType } => {
    /*
      If the game phrase is part of a tutorial group
    */
    console.log("SuccessPhrase", successPhrase);
    const nextAchievement = getNextTutorial();
    if (props.tutorialGroupPhrase) {
      // Stay in GAME mode.
      return { resultActivityType: ActivityType.GAME }
    }
    if (nextAchievement) {
      return { resultActivityType: ActivityType.TUTORIAL };
    }
    return { resultActivityType: ActivityType.GAME };
  };

  return {
    currentActivity: props.currentActivity,
    isInGameMode: props.currentActivity === ActivityType.GAME,
    isInTutorial: props.currentActivity === ActivityType.TUTORIAL,
    isInEdit: props.currentActivity === ActivityType.EDIT,
    isInNormal: props.currentActivity === ActivityType.NORMAL,
    determineActivityState,
    checkTutorialProgress,
    heroAction,
    zombie4Action,
    gameHandleRef,
    handleCommandExecuted,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
  };
}
