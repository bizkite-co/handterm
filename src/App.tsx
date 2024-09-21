// App.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import HandTermWrapper from './HandTermWrapper';
import { CommandProvider } from './commands/CommandProvider';
import { TerminalCssClasses } from './types/TerminalTypes';
import { useAuth } from './lib/useAuth';
import { Output } from './components/Output';
import { useCommandHistory } from './hooks/useCommandHistory';
import { useActivityMediator } from './hooks/useActivityMediator';
import { getNextTutorialAchievement, loadTutorialAchievements } from './utils/achievementUtils';
import { IHandTermMethods } from './components/HandTerm';
import { ActivityType } from './types/Types';
import { IGameHandle } from './game/Game';

const MemoizedOutput = React.memo(Output);

const App = () => {
  const containerRef = React.createRef<HTMLDivElement>();
  const [containerWidth, setContainerWidth] = React.useState<number>(0);
  const handexTermRef = useRef<IHandTermMethods>(null);
  const auth = useAuth();
  const [outputElements, setOutputElements] = useState<React.ReactNode[]>([]);

  const commandHistoryHook = useCommandHistory(loadTutorialAchievements());
  // Determine the initial achievement and activity type                                     
  // Set the initial activity type based on the initial achievement                          
  // Determine the initial achievement and activity type
  const initialAchievement = loadTutorialAchievements().length > 0 ? getNextTutorialAchievement() : null;
  const initialActivityType = initialAchievement ? ActivityType.TUTORIAL : ActivityType.NORMAL;

  // Initialize activityMediator with the appropriate initial values
  const activityMediator = useActivityMediator(initialAchievement || { phrase: [], prompt: '', unlocked: false });

  const gameHandleRef = useRef<IGameHandle>(null);

  // Set the initial activity type based on the initial achievement
  useEffect(() => {
    activityMediator.setCurrentActivity(initialActivityType);
    console.log("CurrentActivity:", ActivityType[activityMediator.currentActivity]);
  }, [activityMediator, initialActivityType]);

  useEffect(() => {
    const w = getContainerWidth();
    setContainerWidth(w);

    const handleClickOutsideTerminal = (event: UIEvent) => {
      // Check if the click is outside of the terminal area
      if (
        handexTermRef.current &&
        (event.target as HTMLElement).id !== TerminalCssClasses.Terminal
      ) {
        event.stopPropagation();
        handexTermRef.current.focusTerminal();

        if (event instanceof MouseEvent || (event instanceof TouchEvent && event.touches.length === 1)) {
          setTimeout(() => {
            handexTermRef.current?.focusTerminal();
          }, 1000);
        }
      }
    };

    // Attach the event listener to the document body
    document.body.addEventListener('click', handleClickOutsideTerminal);
    document.body.addEventListener('touchstart', handleClickOutsideTerminal);

    // Clean up the event listener
    return () => {
      document.body.removeEventListener('click', handleClickOutsideTerminal);
      document.body.removeEventListener('touchstart', handleClickOutsideTerminal);
    };
  }, []);

  const getContainerWidth = () => {
    return containerRef.current?.clientWidth ?? 0
  }

  useEffect(() => {
    const handleResize = () => {
      const w = getContainerWidth();
      setContainerWidth(w);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleOutputUpdate = useCallback((newOutput: React.ReactNode) => {
    setOutputElements(_prevOutputs => [newOutput]);
  }, []);

  const handleTouchStart = useCallback(() => {
    // Implement your touch start logic here
    console.log("handling touch start");
  }, []);

  const handleTouchEnd = useCallback(() => {
    // Implement your touch end logic here
    console.log("Handling touch end");
  }, []);

  const handleActivityChange = useCallback((newActivityType: ActivityType) => {
    console.log("Activity changed to:", newActivityType);
    // Add any additional logic for activity change here
  }, []);

  return (
    <CommandProvider handTermRef={handexTermRef}>
      <div ref={containerRef}>
        <MemoizedOutput
          elements={outputElements}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />
        <HandTermWrapper
          ref={handexTermRef}
          auth={auth}
          terminalWidth={containerWidth}
          commandHistoryHook={commandHistoryHook}
          activityMediator={activityMediator}
          onOutputUpdate={handleOutputUpdate}
          onCommandExecuted={(command, args, switches) => {
            activityMediator.handleCommand(command, args, switches);
          }}
          onActivityChange={handleActivityChange}
          gameHandleRef={gameHandleRef}
        />
      </div>
    </CommandProvider>
  );
};

export default App;
