import { useState, useCallback, useRef, useEffect } from 'react';
import { Tutorial, ActivityType, ParsedCommand } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';
import { useActivityMediatorContext } from '../contexts/ActivityMediatorContext';
import { useTutorial } from './useTutorials';
import { initializeGame, setActivity, activitySignal, tutorialGroupSignal, tutorialSignal, setGamePhrase, setTutorial } from 'src/signals/activitySignals';
import { useComputed } from '@preact/signals-react';

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
  checkGameProgress: (successPhrase: GamePhrase) => void;
}


export interface IActivityMediatorProps {
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const { unlockTutorial, resetTutorial, getNextTutorial } = useTutorial();
  const activity = useComputed(() => activitySignal.value);
  const tutorialGroup = useComputed(() => tutorialGroupSignal.value);
  const tutorial = useComputed(() => tutorialSignal.value);

  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    if (commandActivity && commandActivity !== activity.value) {
      setActivity(commandActivity);
      if (commandActivity === ActivityType.GAME) {
        initializeGame(tutorialGroup.value);
      }
      return commandActivity;
    }

    if (tutorial.value && activity.value !== ActivityType.TUTORIAL) {
      setActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (tutorialGroup.value && activity.value !== ActivityType.GAME) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialGroup.value);
      return ActivityType.GAME;
    }

    return activity.value;
  }, [activity.value, tutorialSignal, tutorialGroupSignal, setActivity]);

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
    if (!getNextTutorial()) return { resultActivity: activity.value, nextTutorial: null, response: response };

    if (getNextTutorial()?.tutorialGroup) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialGroup.value);
      return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Starting game for this tutorial." };
    }
    const isUnlocked = unlockTutorial(command);
    response = isUnlocked ? `Tutorial ${command} unlocked!` : "Try again.";
    const nextTutorial = getNextTutorial();
    if (nextTutorial) {
      determineActivityState(ActivityType.TUTORIAL);
      return { resultActivity: activity.value, nextTutorial, response: response };
    }
    setActivity(ActivityType.GAME);
    return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Continuing to Game" };
  };

  const checkGameProgress = (successPhrase: GamePhrase) => {
    const nextTutorial = getNextTutorial();
    if (tutorialGroup.value) {
      const nextGamePhrase = GamePhrases.getGamePhrasesByTutorialGroup(tutorialGroup.value)
        .find(p => !p.isComplete);
      if (nextGamePhrase) {
        // Set the next phrase
        setGamePhrase(nextGamePhrase);
        setActivity(ActivityType.GAME);
      }
    }
    if (nextTutorial) {
      setTutorial(nextTutorial);
      setActivity(ActivityType.TUTORIAL);
    }
    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if(nextGamePhrase){
      // Set next phrase
      setGamePhrase(nextGamePhrase);
      setActivity(ActivityType.GAME);
    }
    setActivity(ActivityType.NORMAL);
  };

  return {
    isInGameMode: activity.value === ActivityType.GAME,
    isInTutorial: activity.value === ActivityType.TUTORIAL,
    isInEdit: activity.value === ActivityType.EDIT,
    isInNormal: activity.value === ActivityType.NORMAL,
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
