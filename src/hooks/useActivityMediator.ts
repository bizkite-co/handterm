import { useState, useCallback, useEffect } from 'react';
import { ActivityType, ParsedCommand, GamePhrase } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import GamePhrases from '../utils/GamePhrases';
import { useTutorial } from './useTutorials';
import {
  setNextTutorial, resetCompletedTutorials,
  tutorialSignal, getNextTutorial, setCompletedTutorial
} from 'src/signals/tutorialSignals';
import {
  gamePhraseSignal,
  getIncompletePhrasesByTutorialGroup, initializeGame,
  isInGameModeSignal, setCompletedGamePhrase,
  setNextGamePhrase,
} from 'src/signals/gameSignals';
import { activitySignal, setNotification } from 'src/signals/appSignals'
import { useComputed } from '@preact/signals-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useCustomLocation } from './useCustomLocation';
import { group } from 'console';

export type IActivityMediatorReturn = {
  isInGameMode: boolean;
  isInTutorial: boolean;
  isInEdit: boolean;
  isInNormal: boolean;
  heroAction: ActionType;
  zombie4Action: ActionType;
  handleCommandExecuted: (parsedCommand: ParsedCommand) => boolean;
  setHeroAction: React.Dispatch<React.SetStateAction<ActionType>>,
  setZombie4Action: React.Dispatch<React.SetStateAction<ActionType>>;
  checkTutorialProgress: (command: string | null) => void;
  checkGameProgress: (successPhrase: GamePhrase) => void;
  setActivityNav: (newActivity: ActivityType, phraseId?: string, groupId?: string) => void;
}

class activityPath {
  public activity: ActivityType
  constructor(activity: ActivityType) {
    this.activity = activity;
  }
}

export interface IActivityMediatorProps {
}

export function useActivityMediator(props: IActivityMediatorProps): IActivityMediatorReturn {
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const {
    getIncompleteTutorialsInGroup,
    canUnlockTutorial
  } = useTutorial();
  const activity = useComputed(() => activitySignal.value).value;
  const routerNavigate = useNavigate();
  const routerLocation = useLocation();
  const [ searchParams, setSearchParams ] = useSearchParams();
  const [activityGroupKey, setActivityGroupKey] = useState<string>('');

  const customLocation = useCustomLocation();

  const baseUrl = window.location.origin;

  useEffect(()=>{
    const _activityGroup = routerLocation.search.includes('group')
      ? routerLocation.search.split('?')[1].split('=')[1]
      : '';
      if(_activityGroup) setActivityGroupKey(_activityGroup);
  }, [routerLocation.pathname])

  const setActivityNav = (
    newActivity: ActivityType,
    phraseId: string = '',
    groupId: string = ''
  ) => {
    const encodedId = phraseId ? encodeURIComponent(phraseId) : '';
    const queryString = groupId ? '?' + new URLSearchParams({group:groupId}) : '';
    let navTo = '/';
    switch (newActivity) {
      case ActivityType.GAME:
        navTo = `/game/${encodedId}${queryString}`;
        break;
      case ActivityType.TUTORIAL:
        navTo = `/tutorial/${encodedId}${queryString}`;
        break;
      case ActivityType.EDIT:
        navTo = `/edit/${encodedId}`;
        break;
      default:
        routerNavigate('/');
    }
    
    routerNavigate(navTo);
  }

  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    /*
      If the user is new to the site, start the tutorial.
      If the user was in tutorial AND completed an achievement that has accompanying game levels, start game play.
      If the user is in a game that has accompanying tutorials, AND it's the last level associated with that tutorial, then complete that tutorial and this game level and then check if there are addtional tutorials, otherwise go to the next game level.
      Otherwise, got to the next phrase in the current activity.
    */

    if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      activitySignal.value = ActivityType.TUTORIAL;
      setActivityNav(
        ActivityType.TUTORIAL,
        tutorialSignal.value.phrase.join('')
      );
      isInGameModeSignal.value = false;
      return;
    }

    if (commandActivity && commandActivity !== activity) {
      activitySignal.value = commandActivity;
      console.error("is this ever used?");
      setActivityNav(commandActivity);
      if (commandActivity === ActivityType.GAME) {
        //TODO: how do we know the tutorial has a tutorial group in this case?
        initializeGame(tutorialSignal.value?.tutorialGroup);
      }
      return commandActivity;
    }

    if (tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      initializeGame(activityGroupKey);
      const gamePhraseInGroup = getIncompletePhrasesByTutorialGroup(activityGroupKey)[0];
      activitySignal.value = ActivityType.GAME;
      setActivityNav(
        ActivityType.GAME,
        gamePhraseInGroup?.key
      );
      isInGameModeSignal.value = true;
      return ActivityType.GAME;
    }

    return activity;
  }, [activity, tutorialSignal]);


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
    determineActivityState(null);
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
    if (!tutorialSignal.value) return;

    const groupKey = searchParams.get('group') ?? '';
    const canUnlock = command ? canUnlockTutorial(command) : false;
    if (canUnlock) {
      if (groupKey) {

        // Will only be unlocked in checkGameProgress.
        const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(activityGroupKey)[0];
        if (incompletePhrasesInGroup) {
          activitySignal.value = ActivityType.GAME;
          //TODO: Select the phrase
          setActivityNav(
            ActivityType.GAME,
            incompletePhrasesInGroup.key,
            groupKey
          );
          initializeGame(groupKey);
        }
        return;
      }
      setCompletedTutorial(tutorialSignal.value.phrase.join(''))
    }
    else {
      setNotification(`Tutorial ${tutorialSignal.value} not unlocked with ${command}`)
      return;
    }
    // TODO: if the tutorial is not completed until the tutorialGroup is completed, how do we know if the tutorialGroup is completed, and which tutorial to complete when it is completed?
    const nextTutorial = getNextTutorial();
    if (nextTutorial?.phrase) {
      determineActivityState(ActivityType.TUTORIAL);
      setNextTutorial();
      setActivityNav(
        activitySignal.value,
        nextTutorial?.phrase.join(''),
        nextTutorial?.tutorialGroup
      )
      return;
    }
    activitySignal.value = ActivityType.GAME;
    setActivityNav(
      ActivityType.GAME,
      GamePhrases.getGamePhrasesNotAchieved()[0].key,
      groupKey
    );
    return;
  };

  const getNextGamePhrase = () => {
    let gamePhrases: GamePhrase[] = [];
    const [, activityName, id, group] = routerLocation.pathname.split('/');
    if (group) {
      gamePhrases = GamePhrases.getGamePhrasesByTutorialGroup(group);
    }
    if (gamePhrases.length === 0) {
      gamePhrases = GamePhrases.getGamePhrasesNotAchieved();
    }
    if (gamePhrases.length === 0) return;

  }

  const checkGameProgress = (successPhrase: GamePhrase) => {
    // Called after phrase completion.
    const groupKey = searchParams.get('group') ?? '';
    setCompletedGamePhrase(successPhrase.key);
    if (groupKey) {
      const incompletePhrasesInGroup = getIncompletePhrasesByTutorialGroup(groupKey);
      if (incompletePhrasesInGroup.length > 0) {
        // Set the next phrase
        setNextGamePhrase();
        activitySignal.value = ActivityType.GAME;
        setActivityNav(ActivityType.GAME, incompletePhrasesInGroup[0].key);
        return;
      }
      //TODO: Set Tutorial completed
      const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
      incompleteTutorialInGroup.forEach(itig => {
        setCompletedTutorial(itig.phrase.join(''));
      });

      const didSetNext = setNextTutorial();
      determineActivityState(ActivityType.TUTORIAL);

      setActivityNav(
        activitySignal.value,
        tutorialSignal.value?.phrase.join(''),
        tutorialSignal.value?.tutorialGroup
      )
      return;
    }

    if ((setNextTutorial())) {
      activitySignal.value = ActivityType.TUTORIAL;
      setActivityNav(
        activitySignal.value,
        tutorialSignal.value?.phrase.join(''),
        tutorialSignal.value?.tutorialGroup
      )
      isInGameModeSignal.value = false;
      return;
    }

    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if (nextGamePhrase) {
      // Set next phrase
      setNextGamePhrase();
      activitySignal.value = ActivityType.GAME;
      setActivityNav(ActivityType.GAME, nextGamePhrase.key);
      isInGameModeSignal.value = true;
      return;
    }
    activitySignal.value = ActivityType.NORMAL;
    setActivityNav(ActivityType.NORMAL);
  };

  return {
    isInGameMode: activity === ActivityType.GAME,
    isInTutorial: activity === ActivityType.TUTORIAL,
    isInEdit: activity === ActivityType.EDIT,
    isInNormal: activity === ActivityType.NORMAL,
    checkTutorialProgress,
    heroAction,
    zombie4Action,
    handleCommandExecuted,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
    setActivityNav,
  };
}
