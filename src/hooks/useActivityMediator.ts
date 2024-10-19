import { useState, useCallback, useEffect } from 'react';
import { ActivityType, Tutorial, ParsedCommand, GamePhrase } from '../types/Types';
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
  getNextGamePhrase,
  setGamePhrase,
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [activityGroupKey, setActivityGroupKey] = useState<string>('');

  const parsedLocation = useCustomLocation();

  const baseUrl = window.location.origin;

  useEffect(() => {
    const _activityGroup = routerLocation.search.includes('group')
      ? routerLocation.search.split('?')[1].split('=')[1]
      : '';
    if (_activityGroup) setActivityGroupKey(_activityGroup);
  }, [routerLocation.pathname])

  const setActivityNav = (
    newActivity: ActivityType,
    phraseKey: string = '',
    groupKey: string = ''
  ) => {
    const encodedId = phraseKey ? encodeURIComponent(phraseKey) : '';
    const queryString = groupKey ? '?' + new URLSearchParams({ group: groupKey }) : '';
    let navTo = '/';
    switch (newActivity) {
      case ActivityType.GAME:
        navTo = `/game/${encodedId}${queryString}`;
        break;
      case ActivityType.TUTORIAL:
        navTo = `/tutorial/${encodedId.replace('%0D','_r')}${queryString}`;
        break;
      case ActivityType.EDIT:
        navTo = `/edit/${encodedId}`;
        break;
      default:
        routerNavigate('/');
    }

    // Get the stack trace
    const stack = new Error().stack;
    // Parse the stack to get the caller information
    const caller = stack?.split('\n').slice(2, 5).join('\n').trim();
    const trimmedCaller = caller?.replaceAll(baseUrl, '').replaceAll(/\?t=\d*/g, '');
    console.log(`Nav to: ${navTo}`, `From: ${trimmedCaller}`);
    routerNavigate(navTo);
  }

  const decideActivityChange = useCallback((commandActivity: ActivityType | null = null): ActivityType => {
    /*
      If the user is new to the site, start the tutorial.
      If the user was in tutorial AND completed an achievement that has accompanying game levels, start game play.
      If the user is in a game that has accompanying tutorials, AND it's the last level associated with that tutorial, then complete that tutorial and this game level and then check if there are addtional tutorials, otherwise go to the next game level.
      Otherwise, got to the next phrase in the current activity.
    */

    if (tutorialSignal.value && !tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.TUTORIAL;
    }

    if (tutorialSignal.value?.tutorialGroup && activity !== ActivityType.GAME) {
      return ActivityType.GAME;
    }
    if (getNextTutorial()) commandActivity = ActivityType.TUTORIAL;

    return commandActivity ?? ActivityType.NORMAL;
  }, [activity, tutorialSignal]);

  const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand): boolean => {
    let result = false;
    switch (parsedCommand.command) {
      case 'play':
        decideActivityChange(ActivityType.GAME);
        setActivityNav(
          ActivityType.GAME,
          getNextGamePhrase()?.key,
        )
        result = true;
        break;
      case 'tut':
        if ('r' in parsedCommand.switches) {
          resetCompletedTutorials();
        }
        decideActivityChange(ActivityType.TUTORIAL);
        const nextTutorial = getNextTutorial();
        setActivityNav(
          ActivityType.TUTORIAL,
          nextTutorial?.phrase,
          nextTutorial?.tutorialGroup
        )
        result = true;
        break;
      case 'edit':
        decideActivityChange(ActivityType.EDIT);
        setActivityNav(
          ActivityType.EDIT,
          parsedCommand.args.join(''),
          parsedCommand.switches.toString()
        )
        result = true;
        break;
      default:
        result = false;
    }
    if(window.location.pathname.includes('tutorial')) 
      checkTutorialProgress(parsedCommand.command);
    if(parsedLocation.activity === 'game' && parsedLocation.phraseId)
    {
      const gamePhrase = GamePhrases.getGamePhraseByKey(parsedLocation.phraseId)
      if(gamePhrase) checkGameProgress(gamePhrase);
    }

    return result;
  }, [decideActivityChange]);

  useEffect(() => {
    const resultActivity = decideActivityChange(null);
    if (resultActivity === ActivityType.TUTORIAL) {
      checkTutorialProgress(null);
    }
  }, [decideActivityChange]);

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
    const nextTutorial = getNextTutorial();
    if (!nextTutorial) return;

    const groupKey = searchParams.get('group') ?? '';
    if (command) {
      if (canUnlockTutorial(command)) {
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
        setCompletedTutorial(nextTutorial.phrase)
      }
      else {
        setNotification(
          `Tutorial ${tutorialSignal.value} not unlocked with ${command}`
        )
        return;
      }
    }
    // TODO: if the tutorial is not completed until the tutorialGroup is completed, how do we know if the tutorialGroup is completed, and which tutorial to complete when it is completed?
    if (nextTutorial?.phrase) {
      const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
      // I think we are already sure this is to be TUTORIAL?
      setNextTutorial(nextTutorial);
      //TODO: Should we just set it to TUTORIAL always here?
      setActivityNav(
        resultActivity,
        nextTutorial?.phrase,
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

  const checkGameProgress = (successPhrase: GamePhrase) => {
    // Called after phrase completion.
    const groupKey = searchParams.get('group') ?? '';
    setCompletedGamePhrase(successPhrase.key);
    if (groupKey) {
      // If the game is part of a group, see if we can assign the next game in the group.
      const nextPhraseInGroup = getIncompletePhrasesByTutorialGroup(groupKey)[0];
      if (nextPhraseInGroup) {
        // Set the next phrase
        setGamePhrase(getNextGamePhrase());
        activitySignal.value = ActivityType.GAME;
        setActivityNav(
          ActivityType.GAME,
          nextPhraseInGroup.key,
          nextPhraseInGroup.tutorialGroup
        );
        return;
      }
      // Otherweise, complete the related tutorial ...
      const incompleteTutorialInGroup = getIncompleteTutorialsInGroup(groupKey);
      incompleteTutorialInGroup.forEach(itig => {
        setCompletedTutorial(itig.phrase);
      });
      // And then get the next incomplete tutorial.
      const nextTutorial = getNextTutorial();
      if (nextTutorial) {
        const resultActivity = decideActivityChange(ActivityType.TUTORIAL);
        // I think we are already sure this is TUTORIAL.
        setActivityNav(
          activitySignal.value,
          nextTutorial.phrase,
          nextTutorial.tutorialGroup
        )
        return;
      }
    }

    const nextGamePhrase = GamePhrases.getGamePhrasesNotAchieved()[0];
    if (nextGamePhrase) {
      // Set next phrase
      setGamePhrase(getNextGamePhrase());
      activitySignal.value = ActivityType.GAME;
      setActivityNav(
        ActivityType.GAME,
        nextGamePhrase.key,
        nextGamePhrase.tutorialGroup
      );
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
