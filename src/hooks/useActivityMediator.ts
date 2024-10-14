import { useState, useCallback, useRef, useEffect } from 'react';
import { Tutorial, ActivityType, ParsedCommand } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';
import { useTutorial } from './useTutorials';
import { updateTutorial, unlockTutorial, resetCompletedTutorials, tutorialSignal, getNextTutorial } from 'src/signals/tutorialSignals';
import { 
  initializeGame, 
  setActivity, 
  activitySignal, 
  setGamePhrase, 
} from 'src/signals/activitySignals';
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
  checkTutorialProgress: (command: string | null) => { resultActivity: ActivityType, nextTutorial: Tutorial | null };
  checkGameProgress: (successPhrase: GamePhrase) => void;
}


export interface IActivityMediatorProps {
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const { 
    getIncompleteTutorialsInGroup 
  } = useTutorial();
  const activity = useComputed(() => activitySignal.value).value;

  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    /*
      If the user is new to the site, start the tutorial.
      If the user was in tutorial and completed an achievement that has accompanying game levels, start game play.
      Otherwise, just obey the command.
    */
    if (commandActivity && commandActivity !== activity) {
      setActivity(commandActivity);
      if (commandActivity === ActivityType.GAME) {
        //TODO: how do we know the tutorial has a tutorial group in this case?
        initializeGame(tutorialSignal.value?.tutorialGroup);
      }
      return commandActivity;
    }

    if (tutorialSignal.value && activity !== ActivityType.TUTORIAL) {
      setActivity(ActivityType.TUTORIAL);
      return ActivityType.TUTORIAL;
    }

    if (tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialSignal.value.tutorialGroup);
      return ActivityType.GAME;
    }

    return activity;
  }, [activity, tutorialSignal, setActivity]);

  const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
    let result = false;
    switch (parsedCommand.command) {
      case 'play':
        determineActivityState(ActivityType.GAME);
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetCompletedTutorials();
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
  }, [determineActivityState]);

  useEffect(() => {
    determineActivityState();
  }, [determineActivityState]);

  const checkTutorialProgress = (
    command: string | null,
  ) => {
    /*
      If args include 'r', reset the tutorial and set TUTORIAL
      If the current tutorial achievement contains a tutorialGroupPhrase, then switch to GAME
      If there is a next tutorial achievement, stay in TUTORIAL
      If neither is true, return to NORMAL
    */

    // If the current tutorial has attached GamePhrases.
    // Don't unlock until the game is played.
    let response = "";
    if (!tutorialSignal.value) return { resultActivity: activity, nextTutorial: null, response: response };
    if (tutorialSignal.value?.tutorialGroup) {
      setActivity(ActivityType.GAME);
      initializeGame(tutorialSignal.value.tutorialGroup);
      return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Starting game for this tutorial." };
    }
    const isUnlocked = command ? unlockTutorial(command) : false;
    response = isUnlocked ? `Tutorial ${command} unlocked!` : "Try again.";
    // TODO: if the tutorial is not completed until the tutorialGroup is completed, how do we know if the tutorialGroup is completed, and which tutorial to complete when it is completed?
    const nextTutorial = getNextTutorial();
    if (nextTutorial) {
      determineActivityState(ActivityType.TUTORIAL);
      return { resultActivity: activity, nextTutorial, response: response };
    }
    setActivity(ActivityType.GAME);
    return { resultActivity: ActivityType.GAME, nextTutorial: null, response: "Continuing to Game" };
  };

  const checkGameProgress = (successPhrase: GamePhrase) => {
    // Called after phrase completion.
    if (successPhrase?.tutorialGroup) {
      //TODO: isComplete is IMMUTABLE in the JSON file. THis is not a list of incomplete phrases.
      const incompletePhrasesInGroup = GamePhrases.getIncompletePhrasesByTutorialGroup(successPhrase.tutorialGroup);
      if (incompletePhrasesInGroup.length > 0) {
        // Set the next phrase
        setGamePhrase(incompletePhrasesInGroup[0]);
        setActivity(ActivityType.GAME);
        return;
      }
      //TODO: Set Tutorial completed
      const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(successPhrase.tutorialGroup);
      incompleteTutorialInGroup.forEach(itig => {
        unlockTutorial(itig.phrase.join(''))
      });
    }

    const nextTutorial = getNextTutorial();
    if ((updateTutorial())) {
      setActivity(ActivityType.TUTORIAL);
      return;
    }

    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if(nextGamePhrase){
      // Set next phrase
      setGamePhrase(nextGamePhrase);
      setActivity(ActivityType.GAME);
      return;
    }
    setActivity(ActivityType.NORMAL);
  };

  return {
    isInGameMode: activity === ActivityType.GAME,
    isInTutorial: activity === ActivityType.TUTORIAL,
    isInEdit: activity === ActivityType.EDIT,
    isInNormal: activity === ActivityType.NORMAL,
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
