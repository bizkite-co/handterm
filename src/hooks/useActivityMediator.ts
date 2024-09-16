import { useState, useCallback, useRef, useEffect } from 'react';
import { Achievement } from '../types/Types';
import { ActionType } from '../game/types/ActionTypes';
import { IGameHandle } from '../game/Game';

export enum ActivityType {
  TUTORIAL,
  GAME,
  EDIT,
  NORMAL
}

export function useActivityMediator(initialAchievement: Achievement) {
  const [currentActivity, setCurrentActivity] =
    useState<ActivityType>(ActivityType.NORMAL);
  const [isInGameMode, setIsInGameMode] = useState(false);
  const [isInTutorial, setIsInTutorial] = useState(false);
  const [isInEdit, setIsInEdit] = useState(false);
  const [isInNormal, setIsInNormal] = useState(true);
  const [achievement, setAchievement] = useState<Achievement>(initialAchievement);
  const [heroAction, setHeroAction] = useState<ActionType>('Idle');
  const [zombie4Action, setZombie4Action] = useState<ActionType>('Walk');

  const gameHandleRef = useRef<IGameHandle>(null);

  const handleCommand = useCallback((command: string): boolean => {
    const [cmd] = command.split(' ');
    setIsInNormal(false);
    setIsInEdit(false);
    setIsInTutorial(false);
    setIsInGameMode(false);
    switch (cmd) {
      case 'play':
        setCurrentActivity(ActivityType.GAME);
        setIsInGameMode(true);
        if (gameHandleRef.current) {
          gameHandleRef.current.startGame();
        }
        return true;
      case 'tut':
        setCurrentActivity(ActivityType.TUTORIAL);
        setIsInTutorial(true);
        return true;
      case 'edit':
        setCurrentActivity(ActivityType.EDIT);
        setIsInEdit(true);
        return true;

      default:
        setCurrentActivity(ActivityType.NORMAL);
        setIsInNormal(true);
        return false;
    }
  }, [setCurrentActivity, setIsInGameMode, setIsInTutorial, gameHandleRef]);

  useEffect(() => {
    console.log("currentActivity:", ActivityType[currentActivity], "isInTutorial:", isInTutorial);
  }, [currentActivity])

  return {
    currentActivity,
    isInGameMode,
    isInTutorial,
    isInEdit,
    isInNormal,
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
