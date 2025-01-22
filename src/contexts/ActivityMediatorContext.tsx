// src/contexts/ActivityMediatorContext.tsx
import type React from 'react';
import { createContext, useContext, useState } from 'react';

import { ActivityType } from '@handterm/types';

export interface IActivityMediatorContext {
    currentActivity: ActivityType;
    setCurrentActivity: React.Dispatch<React.SetStateAction<ActivityType>>;
}

const ActivityMediatorContext = createContext<IActivityMediatorContext | null>(null);

export const useActivityMediatorContext = (): IActivityMediatorContext => {
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
