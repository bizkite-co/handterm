import { useState, useCallback, useRef, useEffect } from 'react';
import { Tutorial, ActivityType, ParsedCommand } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { GamePhrase } from '../utils/GamePhrases';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { useTutorial } from './useTutorials';

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
  handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
  setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>,
  setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
  checkTutorialProgress: (command: string, args?: string[], _switches?: Record<string, string | boolean>) => { resultActivity: ActivityType, nextTutorial: Tutorial | null };
  checkGameProgress: (successPhrase: GamePhrase) => {
    resultActivityType: ActivityType;
  };
}

export interface IActivityMediatorProps {
  currentTutorial?: Tutorial | null;
  tutorialGroupPhrase?: GamePhrase;
  currentActivity: ActivityType;
  startGame: () => void;
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const { currentActivity, setCurrentActivity } = useActivityMediatorContext();
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const { unlockTutorial, resetTutorial, getNextTutorial } = useTutorial();
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
      setCurrentActivity(commandActivity);
      return commandActivity;
    }

    if (props.currentTutorial && props.currentActivity !== ActivityType.TUTORIAL) {
      setCurrentActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (props.tutorialGroupPhrase && props.currentActivity !== ActivityType.GAME) {
      setCurrentActivity(ActivityType.GAME);
      props.startGame();
      return ActivityType.GAME;
    }

    return props.currentActivity;
  }, [props.currentTutorial, props.tutorialGroupPhrase, props.currentActivity, setCurrentActivity, props.startGame]);

  const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
    let result = false;
    switch (parsedCommand.command) {
      case 'play':
        determineActivityState(ActivityType.GAME);
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetTutorial();
        }
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
    return result;
  }, [determineActivityState]);

  useEffect(() => {
    determineActivityState();
  }, [determineActivityState])

  const checkTutorialProgress = (
    command: string,
  ): { resultActivity: ActivityType, nextTutorial: Tutorial | null, response: string } => {
    let response = "";
    if (!getNextTutorial()) return { resultActivity: props.currentActivity, nextTutorial: null, response: response };
    /*
      If args include 'r', reset the tutorial and set TUTORIAL
      If the current tutorial achievement contains a tutorialGroupPhrase, then switch to GAME
      If there is a next tutorial achievement, stay in TUTORIAL
      If neither is true, return to NORMAL
    */

    // If the current tutorial has attached GamePhrases.
    // Don't unlock until the game is played.
    if (getNextTutorial()?.tutorialGroup) {
      setCurrentActivity(ActivityType.GAME);
      // TODO: Pass phrases to game play
      props.startGame();
      return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Starting game for this tutorial." };
    }
    const isUnlocked = unlockTutorial(command);
    response = isUnlocked ? `Tutorial ${command} unlocked!` : "Try again.";
    const nextTutorial = getNextTutorial();
    if (nextTutorial) {
      determineActivityState(ActivityType.TUTORIAL);
      return { resultActivity: props.currentActivity, nextTutorial, response: response };
    }
    // Set the state for after tutorial completion.
    setCurrentActivity(ActivityType.GAME);
    return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Continuing to Game" };
  };

  const checkGameProgress = (successPhrase: GamePhrase): { resultActivityType: ActivityType } => {
    /*
      If the game phrase is part of a tutorial group
    */
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
