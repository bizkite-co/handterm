// src/contexts/ActivityMediatorContext.tsx
import React, { createContext, useContext } from 'react';
import { ActivityType } from '../types/Types';
import { useActivityMediator, IActivityMediatorProps } from '../hooks/useActivityMediator';

export interface IActivityMediatorReturn {
    currentActivity: ActivityType;
    setCurrentActivity: (activity: ActivityType) => void;
    handleCommandExecuted: (command: string) => void;
}

const ActivityMediatorContext = createContext<IActivityMediatorReturn | null>(null);

export const useActivityMediatorContext = () => {
    const context = useContext(ActivityMediatorContext);
    if (!context) {
        throw new Error('useActivityMediatorContext must be used within an ActivityMediatorProvider');
    }
    return context;
};

interface ActivityMediatorProviderProps {
    children: React.ReactNode;
}

export const ActivityMediatorProvider: React.FC<ActivityMediatorProviderProps> = ({ children }) => {
    const activityMediatorProps: IActivityMediatorProps = {
        resetTutorial: () => {}, // Implement this function if needed
        currentTutorial: null, // Set the appropriate initial value
        currentActivity: ActivityType.NORMAL,
        setCurrentActivity: () => {}, // This will be overwritten by useActivityMediator
        startGame: () => {}, // Implement this function if needed
    };

    const { currentActivity, setCurrentActivity, handleCommandExecuted } = useActivityMediator(activityMediatorProps);

    const value: IActivityMediatorReturn = {
        currentActivity,
        setCurrentActivity,
        handleCommandExecuted,
    };

    return (
        <ActivityMediatorContext.Provider value={value}>
            {children}
        </ActivityMediatorContext.Provider>
    );
};
