// src/contexts/ActivityMediatorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivityType, ParsedCommand } from '../types/Types';

export interface IActivityMediatorContext {
    currentActivity: ActivityType;
    determineActivityState: (commandActivity?: ActivityType | null) => ActivityType;
    handleCommandExecuted: (parsedCommand: ParsedCommand) => void;
}

const ActivityMediatorContext = createContext<IActivityMediatorContext | null>(null);

export const useActivityMediatorContext = () => {
    const context = useContext(ActivityMediatorContext);
    if (!context) {
        throw new Error('useActivityMediatorContext must be used within an ActivityMediatorProvider');
    }
    return context;
};

export const ActivityMediatorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);

    const determineActivityState = useCallback((commandActivity: ActivityType | null = null) => {
        if (commandActivity) {
            setCurrentActivity(commandActivity);
            return commandActivity;
        }
        // Add your logic here for determining the activity state
        return currentActivity;
    }, [currentActivity]);

    const handleCommandExecuted = useCallback((parsedCommand: ParsedCommand) => {
        // Add your logic here for handling executed commands
        console.log('Command executed:', parsedCommand);
    }, []);

    const value: IActivityMediatorContext = {
        currentActivity,
        determineActivityState,
        handleCommandExecuted,
    };

    return (
        <ActivityMediatorContext.Provider value={value}>
            {children}
        </ActivityMediatorContext.Provider>
    );
};