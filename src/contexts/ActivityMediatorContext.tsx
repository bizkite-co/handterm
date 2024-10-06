// src/contexts/ActivityMediatorContext.tsx
import React, { createContext, useContext } from 'react';
import { useActivityMediatorReturn } from '../hooks/useActivityMediator';

const ActivityMediatorContext = createContext<useActivityMediatorReturn |
    null>(null);

export const useActivityMediatorContext = () => {
    const context = useContext(ActivityMediatorContext);
    if (!context) {
        throw new Error('useActivityMediatorContext must be used within an ActivityMediatorProvider');
   }
    return context;
};

interface ActivityMediatorProviderProps {
    children: React.ReactNode;
    value: useActivityMediatorReturn;
}

export const ActivityMediatorProvider: React.FC<ActivityMediatorProviderProps> = ({children, value }) => {
    return (
        <ActivityMediatorContext.Provider value={value}>
            {children}
        </ActivityMediatorContext.Provider>
    );
};