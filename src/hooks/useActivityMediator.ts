import { useState, useCallback, useRef, useEffect } from 'react';
import { Tutorial, ActivityType, ParsedCommand } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { GamePhrase } from '../utils/GamePhrases';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { useTutorial } from './useTutorials';
import { signalGameStart } from 'src/signals/gameSignals';

export type IActivityMediatorReturn = {
  currentActivity: ActivityType;
  isInGameMode: boolean;
  isInTutorial: boolean;
  isInEdit: boolean;
  isInNormal: boolean;
  determineActivityState: (commandActivity?: ActivityType | null) => ActivityType;
  heroAction: ActionType;
  zombie4Action: ActionType;
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
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const { currentActivity, setCurrentActivity } = useActivityMediatorContext();
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const { unlockTutorial, resetTutorial, getNextTutorial } = useTutorial();


  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    if (commandActivity && commandActivity !== currentActivity) {
      setCurrentActivity(commandActivity);
      if (commandActivity === ActivityType.GAME) {
        signalGameStart();
      }
      return commandActivity;
    }

    if (props.currentTutorial && currentActivity !== ActivityType.TUTORIAL) {
      setCurrentActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (props.tutorialGroupPhrase && currentActivity !== ActivityType.GAME) {
      setCurrentActivity(ActivityType.GAME);
      signalGameStart();
      return ActivityType.GAME;
    }

    return currentActivity;
  }, [currentActivity, props.currentTutorial, props.tutorialGroupPhrase, setCurrentActivity ]);

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
        result = false;
    }
    return result;
  }, [determineActivityState, resetTutorial]);

  useEffect(() => {
    determineActivityState();
  }, [determineActivityState]);

  const checkTutorialProgress = (
    command: string,
  ): { resultActivity: ActivityType, nextTutorial: Tutorial | null, response: string } => {
    let response = "";
    if (!getNextTutorial()) return { resultActivity: currentActivity, nextTutorial: null, response: response };

    if (getNextTutorial()?.tutorialGroup) {
      setCurrentActivity(ActivityType.GAME);
      signalGameStart();
      return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Starting game for this tutorial." };
    }
    const isUnlocked = unlockTutorial(command);
    response = isUnlocked ? `Tutorial ${command} unlocked!` : "Try again.";
    const nextTutorial = getNextTutorial();
    if (nextTutorial) {
      determineActivityState(ActivityType.TUTORIAL);
      return { resultActivity: currentActivity, nextTutorial, response: response };
    }
    setCurrentActivity(ActivityType.GAME);
    return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Continuing to Game" };
  };

  const checkGameProgress = (successPhrase: GamePhrase): { resultActivityType: ActivityType } => {
    const nextAchievement = getNextTutorial();
    if (props.tutorialGroupPhrase) {
      return { resultActivityType: ActivityType.GAME }
    }
    if (nextAchievement) {
      return { resultActivityType: ActivityType.TUTORIAL };
    }
    return { resultActivityType: ActivityType.GAME };
  };

  return {
    currentActivity,
    isInGameMode: currentActivity === ActivityType.GAME,
    isInTutorial: currentActivity === ActivityType.TUTORIAL,
    isInEdit: currentActivity === ActivityType.EDIT,
    isInNormal: currentActivity === ActivityType.NORMAL,
    determineActivityState,
    checkTutorialProgress,
    heroAction,
    zombie4Action,
    handleCommandExecuted,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
  };
}
