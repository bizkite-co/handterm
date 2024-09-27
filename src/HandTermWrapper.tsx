
import React, { useCallback, useEffect, useState } from 'react';
import { HandTerm, IHandTermMethods } from './components/HandTerm';
import { getNextTutorialAchievement, resetTutorial } from './utils/tutorialAchievementUtils';
import { ActivityType } from './types/Types';
import { useActivityMediator } from './hooks/useActivityMediator';
import { useCommandHistory } from './hooks/useCommandHistory';
import { IGameHandle } from './game/Game';
import { IAuthProps } from './lib/useAuth';
import { usePhraseHandler } from './hooks/usePhraseHandler';

export interface IHandTermWrapperProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: IAuthProps;
  commandHistoryHook: ReturnType<typeof useCommandHistory>;
  onOutputUpdate: (output: React.ReactNode) => void;
  gameHandleRef: React.RefObject<IGameHandle>;
}
const HandTermWrapper = React.forwardRef<IHandTermMethods, IHandTermWrapperProps>((props, ref) => {
  const [key, setKey] = useState(0);
  // Determine the initial achievement and activity type                                     
  // Set the initial activity type based on the initial achievement                          
  // Determine the initial achievement and activity type
  const initialAchievement = getNextTutorialAchievement();

  // Function to reset tutorial and refresh HandTerm
  const refreshHandTerm = () => {
    setKey(prevKey => prevKey + 1); // Increment key to force re-render.
  }

  // Initialize activityMediator with the appropriate initial values
  const activityMediator = useActivityMediator(
    initialAchievement
    || { phrase: [], prompt: '', unlocked: false },
    refreshHandTerm
  );

  const { currentPhrase } = usePhraseHandler(activityMediator);

  // Set the initial activity type based on the initial achievement
  useEffect(() => {
    activityMediator.determineActivityState();
    console.log("App useEffect CurrentActivity:", ActivityType[activityMediator.currentActivity]);
  }, []);

  const handleActivityChange = useCallback((newActivityType: ActivityType) => {
    console.log("Activity changed to:", newActivityType);
    // Add any additional logic for activity change here
  }, []);

  return (
    <HandTerm
      ref={ref as React.Ref<HandTerm>}
      {...props}
      refreshHandTerm={refreshHandTerm}
      key={key}
      activityMediator={activityMediator}
      onCommandExecuted={(command, args, switches) => {
        activityMediator.handleCommandExecuted(command, args, switches);
      }}
      onActivityChange={handleActivityChange}
      currentPhrase={currentPhrase}
    />
  );
});

export default React.memo(HandTermWrapper);
