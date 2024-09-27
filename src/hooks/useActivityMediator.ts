import { useState, useCallback, useRef } from 'react';
import { TutorialAchievement, TutorialAchievements, ActivityType, ActivityMediatorType } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { resetTutorial, unlockAchievement, getNextTutorialAchievement } from '../utils/achievementUtils';
import Phrases, { PhraseType } from '../utils/Phrases';

export function useActivityMediator(initialTutorialAchievement: TutorialAchievement, refreshHandTerm?: () => void):ActivityMediatorType {
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
  const [tutorialAchievement, setTutorialAchievement] = useState<TutorialAchievement>(initialTutorialAchievement);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const [tutorialGroupPhrases, setTutorialGroupPhrases] = useState<PhraseType[]>([]);

  const gameHandleRef = useRef<IGameHandle>(null);

  const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
    /*
      If the user is new to the site, start the tutorial.
      If the user was in tutorial and completed an achievement that has accompanying game levels, start game play.
      Otherwise, just obey the command.
    */
    const nextAchievement = getNextTutorialAchievement();
    if (!nextAchievement && !commandActivity) {
      return setCurrentActivity(ActivityType.NORMAL);
    } else if (tutorialGroupPhrases.length > 0) {
      const result = setCurrentActivity(ActivityType.GAME);
      if (gameHandleRef.current) {
        gameHandleRef.current.startGame();
      }
      return result;
    } else {
      return setCurrentActivity(ActivityType.TUTORIAL);
    }
  }, []);

  const getNextIncompleteTutorialPhrase = (): PhraseType => {
    let response: PhraseType = {
      key: '',
      value: ''
    };

    return response;
  }

  const handleCommandExecuted = useCallback((command: string, _args: string[], switches: Record<string, boolean | string>): boolean => {
    switch (command) {
      case 'play':
        determineActivityState(ActivityType.GAME);
        return true;
      case 'tut':
        if ('r' in switches) {
          resetTutorial();
          setTutorialGroupPhrases([]);
          if (refreshHandTerm) refreshHandTerm();
        }
        console.log('useActivityMediator.handleCommand switch: TUTORIAL')
        determineActivityState(ActivityType.TUTORIAL);
        return true;
      case 'edit':
        determineActivityState(ActivityType.EDIT);
        return true;

      default:
        // Don't default to NORMAL. 
        return false;
    }
  }, [setCurrentActivity, gameHandleRef]);

  const setNextTutorialAchievement = (nextAchievement: TutorialAchievement | null) => {
    if (nextAchievement) {
      setTutorialAchievement(nextAchievement);
    }
  };

  // Function to switch to the NORMAL activity                                               
  const switchToNormal = useCallback(() => {
    // Perform any necessary cleanup or state resets                                         
    // TODO: Possibly clean up Game state.

    // Update the current activity state                                                     
    setCurrentActivity(ActivityType.NORMAL);
  }, [setCurrentActivity]);

  const checkTutorialProgress = (
    command: string,
    args?: string[],
    _switches?: Record<string, string | boolean>
  ) => {
    const nextAchievement = args?.includes('r') ? TutorialAchievements[0] : unlockAchievement(command, tutorialAchievement.phrase.join(''));
    // TODO: Use more complex comparison to Game phrase levels.
    if (tutorialAchievement.tutorialGroup) {
      setCurrentActivity(ActivityType.GAME);
      const tutorialGroupPhrases = Phrases.getPhrasesByTutorialGroup(tutorialAchievement.tutorialGroup);
      setTutorialGroupPhrases(tutorialGroupPhrases);
      console.log("Play game levels:", tutorialGroupPhrases);
      // TODO: Pass phrases to game play
      return { progressed: true, completed: false, phrases: tutorialGroupPhrases }
    }
    if (nextAchievement) {
      setTutorialAchievement(nextAchievement);
      return { progressed: true, completed: false };
    } else {
      setCurrentActivity(ActivityType.GAME);
      return { progressed: true, completed: true };
    }
  };

  const checkGameProgress = (successPhrase: PhraseType): { resultActivityType: ActivityType, nextPhrase: PhraseType | null } => {
    // TODO: Use more complex comparison to tutorial tutorialAchievements.
    const tutorialGroupPhrase = tutorialGroupPhrases.find(p => p.key === successPhrase.key);
    if (tutorialGroupPhrase) {
      setTutorialGroupPhrases(prevTutorialGroupPhrases => {
        return prevTutorialGroupPhrases.map(phrase => {
          // update and return the matching phrase.
          if (phrase.key === tutorialGroupPhrase.key) {
            return { ...phrase, isCompleted: true }
          }
          // return all other phrases.
          return phrase;
        })
      })
    }
    const nextTutorialGroupPhrase = tutorialGroupPhrases
      .filter(p => p.key !== tutorialGroupPhrase?.key)
      .find(p => !p.isComplete);

    const nextAchievement = getNextTutorialAchievement();
    if (nextTutorialGroupPhrase) {
      // Stay in GAME mode.
      return { resultActivityType: ActivityType.GAME, nextPhrase: nextTutorialGroupPhrase }
    }
    if (nextAchievement) {
      setTutorialAchievement(nextAchievement);
      return { resultActivityType: ActivityType.TUTORIAL, nextPhrase: null };
    }
    return { resultActivityType: ActivityType.GAME, nextPhrase: null };
  };

  return {
    currentActivity,
    isInGameMode: currentActivity === ActivityType.GAME,
    isInTutorial: currentActivity === ActivityType.TUTORIAL,
    isInEdit: currentActivity === ActivityType.EDIT,
    isInNormal: currentActivity === ActivityType.NORMAL,
    tutorialAchievement,
    tutorialGroupPhrases,
    getNextIncompleteTutorialPhrase,
    determineActivityState,
    setNextTutorialAchievement,
    checkTutorialProgress,
    heroAction,
    zombie4Action,
    gameHandleRef,
    handleCommandExecuted,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
    switchToNormal
  };
}
