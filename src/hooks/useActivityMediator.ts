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

   const switchToGame = useCallback(() => {
     if (currentActivity === ActivityType.TUTORIAL) {
       setCurrentActivity(ActivityType.GAME);
       setIsInGameMode(true);
       setIsInTutorial(false);
       // Additional logic to start the game
     }
   }, [currentActivity]);

   const switchToTutorial = useCallback(() => {
     if (currentActivity === ActivityType.GAME) {
       setCurrentActivity(ActivityType.TUTORIAL);
       setIsInGameMode(false);
       setIsInTutorial(true);
       // Additional logic to resume the tutorial
     }
   }, [currentActivity]);

   const handleCommand = useCallback((command: string): boolean => {
     if (currentActivity === ActivityType.TUTORIAL) {
       if (achievement.phrase.join('') === command) {
         switchToGame();
         return true;
       }
     } else {
       // Game logic to determine when to switch back to tutorial
       // This is a placeholder and should be replaced with actual game completion logic    
       if (command === 'endgame') {
         switchToTutorial();
         return true;
       }
     }
     return false;
   }, [currentActivity, achievement, switchToGame, switchToTutorial]);

   const setNextAchievement = useCallback((newAchievement: Achievement) => {
     setAchievement(newAchievement);
   }, []);

   return {
     currentActivity,
     isInGameMode,
     isInTutorial,
     achievement,
     heroAction,
     zombie4Action,
     gameHandleRef,
     handleCommand,
     setNextAchievement,
     setHeroAction,
     setZombie4Action,
   };
 }