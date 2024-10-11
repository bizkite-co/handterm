import { useState, useCallback, useRef, useEffect } from 'react';
import { Tutorial, ActivityType, ParsedCommand } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { GamePhrase } from '../utils/GamePhrases';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { useTutorial } from './useTutorials';
import { initializeGame,setActivity, activitySignal, tutorialGroupSignal, tutorialSignal } from 'src/signals/activitySignals';

export type IActivityMediatorReturn = {
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
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const { unlockTutorial, resetTutorial, getNextTutorial } = useTutorial();


  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    if (commandActivity && commandActivity !== activitySignal.value) {
      setActivity(commandActivity);
      if (commandActivity === ActivityType.GAME) {
        initializeGame(tutorialGroupSignal.value);
      }
      return commandActivity;
    }

    if (tutorialSignal.value && activitySignal.value !== ActivityType.TUTORIAL) {
      setActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (tutorialGroupSignal.value && activitySignal.value !== ActivityType.GAME) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialGroupSignal.value);
      return ActivityType.GAME;
    }

    return activitySignal.value;
  }, [activitySignal.value, tutorialSignal, tutorialGroupSignal, setActivity ]);

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
    if (!getNextTutorial()) return { resultActivity: activitySignal.value, nextTutorial: null, response: response };

    if (getNextTutorial()?.tutorialGroup) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialGroupSignal.value);
      return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Starting game for this tutorial." };
    }
    const isUnlocked = unlockTutorial(command);
    response = isUnlocked ? `Tutorial ${command} unlocked!` : "Try again.";
    const nextTutorial = getNextTutorial();
    if (nextTutorial) {
      determineActivityState(ActivityType.TUTORIAL);
      return { resultActivity: activitySignal.value, nextTutorial, response: response };
    }
    setActivity(ActivityType.GAME);
    return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Continuing to Game" };
  };

  const checkGameProgress = (successPhrase: GamePhrase): { resultActivityType: ActivityType } => {
    const nextAchievement = getNextTutorial();
    if (tutorialGroupSignal) {
      return { resultActivityType: ActivityType.GAME }
    }
    if (nextAchievement) {
      return { resultActivityType: ActivityType.TUTORIAL };
    }
    return { resultActivityType: ActivityType.GAME };
  };

  return {
    isInGameMode: activitySignal.value === ActivityType.GAME,
    isInTutorial: activitySignal.value === ActivityType.TUTORIAL,
    isInEdit: activitySignal.value === ActivityType.EDIT,
    isInNormal: activitySignal.value === ActivityType.NORMAL,
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
