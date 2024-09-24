import { useState, useCallback, useRef } from 'react';
import { Achievement, ActivityType } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { resetTutorial, unlockAchievement, getNextTutorialAchievement } from '../utils/achievementUtils';
import Phrases, { PhraseType } from '../utils/Phrases';

export function useActivityMediator(initialAchievement: Achievement) {
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
  const [achievement, setAchievement] = useState<Achievement>(initialAchievement);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');
  const [tutorialPhrases, setTutorialPhrases] = useState<PhraseType[]>([]);

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
    } else if (tutorialPhrases.length > 0) {
      const result = setCurrentActivity(ActivityType.GAME);
      if (gameHandleRef.current) {
        gameHandleRef.current.startGame();
      }
      return result;
    } else {
      return setCurrentActivity(ActivityType.TUTORIAL);
    }
  }, []);

  const handleCommand = useCallback((command: string, _args: string[], switches: Record<string, boolean | string>): boolean => {
    switch (command) {
      case 'play':
        determineActivityState(ActivityType.GAME);
        return true;
      case 'tut':
        if ('r' in switches) {
          resetTutorial();
          // TODO: refresh HandTerm.
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

  const setNextAchievement = (nextAchievement: Achievement | null) => {
    if (nextAchievement) {
      setAchievement(nextAchievement);
    }
  };

  // Function to switch to the NORMAL activity                                               
  const switchToNormal = useCallback(() => {
    // Perform any necessary cleanup or state resets                                         
    // TODO: Possibly clean up Game state.

    // Update the current activity state                                                     
    setCurrentActivity(ActivityType.NORMAL);
  }, [setCurrentActivity]);

  const progressTutorial = (command: string) => {
    const nextAchievement = unlockAchievement(command, achievement.phrase.join(''));
    // TODO: Use more complex comparison to Game phrase levels.
    if (achievement.tutorialGroup) {
      setCurrentActivity(ActivityType.GAME);
      const tutorialPhrases = Phrases.getPhrasesByTutorialGroup(achievement.tutorialGroup);
      setTutorialPhrases(tutorialPhrases);
      console.log("Play game levels:", tutorialPhrases);
      // TODO: Pass phrases to game play
      return { progressed: true, completed: true, phrases: tutorialPhrases }
    }
    if (nextAchievement) {
      setAchievement(nextAchievement);
      return { progressed: true, completed: false };
    } else {
      setCurrentActivity(ActivityType.GAME);
      return { progressed: true, completed: true };
    }
  };

  const checkGameProgress = (successPhrase: PhraseType) => {
    // TODO: Use more complex comparison to tutorial achievements.
    if (successPhrase.tutorialGroup) {
      console.log("checkGameProgress: set TUTORIAL")
      setCurrentActivity(ActivityType.TUTORIAL);
    }
    const nextAchievement = getNextTutorialAchievement();
    if (nextAchievement) {
      setAchievement(nextAchievement);
      return true;
    }
    return false;
  };

  return {
    currentActivity,
    isInGameMode: currentActivity === ActivityType.GAME,
    isInTutorial: currentActivity === ActivityType.TUTORIAL,
    isInEdit: currentActivity === ActivityType.EDIT,
    isInNormal: currentActivity === ActivityType.NORMAL,
    achievement,
    tutorialPhrases,
    determineActivityState,
    setNextAchievement,
    progressTutorial,
    heroAction,
    zombie4Action,
    gameHandleRef,
    handleCommand,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
    switchToNormal
  };
}
