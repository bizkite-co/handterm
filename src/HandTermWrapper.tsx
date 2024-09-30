
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HandTerm, IHandTermMethods } from './components/HandTerm';
import { getNextTutorial, resetTutorial } from './utils/tutorialUtils';
import { ActivityType, Tutorial } from './types/Types';
import { useActivityMediator, IActivityMediatorProps } from './hooks/useActivityMediator';
import { useCommandHistory } from './hooks/useCommandHistory';
import Game, { IGameHandle } from './game/Game';
import { IAuthProps } from './lib/useAuth';
import { usePhraseHandler } from './hooks/usePhraseHandler';
import { GamePhrase } from './utils/GamePhrases';
import { ActionType } from './game/types/ActionTypes';

export interface IHandTermWrapperProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: IAuthProps;
  commandHistoryHook: ReturnType<typeof useCommandHistory>;
  onOutputUpdate: (output: React.ReactNode) => void;
}

export const HandTermWrapper = React.forwardRef<IHandTermMethods, IHandTermWrapperProps>((props, ref) => {
  const [key, setKey] = useState(0);
  const [currentPhrase, setCurrentPhrase] = useState<GamePhrase | null>(null);
  const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(getNextTutorial());
  const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
  const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
  const [canvasHeight, setCanvasHeight] = useState(parseInt(initialCanvasHeight));

  const gameHandleRef = useRef<IGameHandle>(null);

  // Function to reset tutorial and refresh HandTerm
  const onResetTutorial = () => {
    if (ref && 'current' in ref && ref.current) {
      resetTutorial();
      ref.current.refreshComponent(); // Call the new method to force a re - render
    }
  }

  const startGame = () => {
    console.log("startGame called:", gameHandleRef);
    if (gameHandleRef.current) gameHandleRef.current.startGame();
  }

  const activityMediatorProps: IActivityMediatorProps = {
    resetTutorial: onResetTutorial,
    currentTutorial: getNextTutorial(),
    currentActivity,
    setCurrentActivity,
    startGame,
  }

  // const {
  //   fontSize,
  //   resizedCanvasHeight:canvasHeight,
  //   handleTouchMove,
  //   handleTouchStart,
  //   handleTouchEnd,
  // } = useResizeCanvasAndFont(initialFontSize, initialCanvasHeight);

  // Initialize activityMediator with the appropriate initial values
  const activityMediator = useActivityMediator(
    activityMediatorProps,
  );
  const { } = usePhraseHandler({
    currentActivity: activityMediator.currentActivity
  });

  // Determine the initial achievement and activity type
  useEffect(() => {
    const currentActivity = activityMediator.determineActivityState();
    setCurrentActivity(currentActivity);
    console.log("Wrapper useEffect CurrentActivity:", ActivityType[activityMediator.currentActivity], ActivityType[currentActivity]);
  }, []);

  const handleActivityChange = useCallback((newActivityType: ActivityType) => {
    console.log("Activity changed to:", newActivityType);
    // Add any additional logic for activity change here
  }, []);

  const handleCommandExecuted = (command: string, args: string[], switches: Record<string, string | boolean>) => {
    activityMediator.handleCommandExecuted(command, args, switches);
    if (currentActivity === ActivityType.TUTORIAL) {
      const { resultActivity, nextTutorial } = activityMediator
        .checkTutorialProgress(command, args, switches);
      console.log("HandTermWrapper.handleCommandExectud nextTutorial:", nextTutorial);
      setCurrentActivity(resultActivity);
      if (nextTutorial) {
        setCurrentTutorial(nextTutorial);
      }
    }
  }

  function setHeroAction(action: ActionType): void {
    console.error('Function not implemented.', action);
  }

  const zombie4StartPosition = { leftX: -70, topY: 0 };

  return (
    <>
      {currentActivity === ActivityType.GAME && (<Game
        ref={gameHandleRef}
        canvasHeight={canvasHeight}
        canvasWidth={props.terminalWidth}
        isInGameMode={currentActivity === ActivityType.GAME}
        heroActionType={activityMediator.heroAction}
        zombie4ActionType={activityMediator.zombie4Action}
        onSetHeroAction={setHeroAction}
        onSetZombie4Action={activityMediator.setZombie4Action}
        zombie4StartPosition={zombie4StartPosition}
      />
      )}
      <HandTerm
        ref={ref as React.Ref<HandTerm>}
        {...props}
        refreshHandTerm={onResetTutorial}
        key={key}
        gameHandleRef={gameHandleRef}
        activityMediator={activityMediator}
        onCommandExecuted={handleCommandExecuted}
        onActivityChange={handleActivityChange}
        currentActivity={currentActivity}
        setCurrentActivity={setCurrentActivity}
        currentPhrase={currentPhrase}
        currentTutorial={currentTutorial}
      />
    </>
  );
});

