import { useState, useCallback, useRef } from 'react';
import { Achievement } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';

export enum ActivityType {
  TUTORIAL,
  GAME
}

export function useActivityMediator(initialAchievement: Achievement) {
  const [currentActivity, setCurrentActivity] =
    useState<ActivityType>(ActivityType.TUTORIAL);
  const [isInGameMode, setIsInGameMode] = useState(false);
  const [isInTutorial, setIsInTutorial] = useState(true);
  const [achievement, setAchievement] = useState<Achievement>(initialAchievement);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');

  const gameHandleRef = useRef<IGameHandle>(null);


  const handleCommand = useCallback((command: string): boolean => {
    const [cmd] = command.split(' ');

    switch (cmd) {
      case 'play':
      case 'phrase':
        setCurrentActivity(ActivityType.GAME);
        setIsInGameMode(true);
        setIsInTutorial(false);
        if (gameHandleRef.current) {
          gameHandleRef.current.startGame();
        }
        return true;
      // ... other command cases ...
      default:
        return false;
    }
  }, [setCurrentActivity, setIsInGameMode, setIsInTutorial, gameHandleRef]);

  return {
    currentActivity,
    isInGameMode,
    isInTutorial,
    achievement,
    heroAction,
    zombie4Action,
    gameHandleRef,
    handleCommand,
    setNextAchievement: setAchievement,
    setHeroAction,
    setZombie4Action,
  };
}
