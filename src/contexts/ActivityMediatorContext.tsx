// src/contexts/ActivityMediatorContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { ActivityType, ParsedCommand } from '../types/Types';
import { reset } from 'canvas-confetti';
import { useActivityMediator } from 'src/hooks/useActivityMediator';

export interface IActivityMediatorContext {
    currentActivity: ActivityType;
    setCurrentActivity: React.Dispatch<React.SetStateAction<ActivityType>>;
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

    const value: IActivityMediatorContext = {
        currentActivity,
        setCurrentActivity
    };

    return (
        <ActivityMediatorContext.Provider value={value}>
            {children}
        </ActivityMediatorContext.Provider>
    );
};
