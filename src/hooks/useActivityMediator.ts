import { useState, useCallback, useRef } from 'react';
import { Achievement } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';
import { resetTutorial, unlockAchievement, getNextTutorialAchievement } from '../utils/achievementUtils';
import { PhraseType } from '../utils/Phrases';

export enum ActivityType {
  NORMAL,
  TUTORIAL,
  GAME,
  EDIT,
}

export function useActivityMediator(initialAchievement: Achievement) {
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.TUTORIAL);
  const [achievement, setAchievement] = useState<Achievement>(initialAchievement);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');

  const gameHandleRef = useRef<IGameHandle>(null);

  const handleCommand = useCallback((command: string, _args: string[], switches: Record<string, boolean | string>): boolean => {
    switch (command) {
      case 'play':
        setCurrentActivity(ActivityType.GAME);
        if (gameHandleRef.current) {
          gameHandleRef.current.startGame();
        }
        return true;
      case 'tut':
        if ('r' in switches) resetTutorial();
        setCurrentActivity(ActivityType.TUTORIAL);
        return true;
      case 'edit':
        setCurrentActivity(ActivityType.EDIT);
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

  const progressTutorial = (command: string) => {
    if (currentActivity === ActivityType.TUTORIAL) {
      const nextAchievement = unlockAchievement(command, achievement.phrase.join(''));
      // TODO: Use more complex comparison to Game phrase levels.
      if (achievement.gameLevels) setCurrentActivity(ActivityType.GAME); 
      if (nextAchievement) {
        setAchievement(nextAchievement);
        return { progressed: true, completed: false };
      }
    }
    return { progressed: false, completed: false };
  };

  const checkGameProgress = (successPhrase:PhraseType) => {
    // TODO: Use more complex comparison to tutorial achievements.
    if (successPhrase.tutorial) {
      const nextAchievement = getNextTutorialAchievement();
      if (nextAchievement) {
        setAchievement(nextAchievement);
        setCurrentActivity(ActivityType.TUTORIAL);
        return true;
      }
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
    setNextAchievement,
    progressTutorial,
    heroAction,
    zombie4Action,
    gameHandleRef,
    handleCommand,
    setHeroAction,
    setZombie4Action,
    checkGameProgress,
  };
}
