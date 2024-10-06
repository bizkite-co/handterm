// AppContext.tsx
import React, { createContext, useCallback, useContext, useState } from 'react';
import { ICommandResponse } from '../contexts/CommandContext';
import { ActivityType } from '../types/Types';
import { useActivityMediator, IActivityMediatorProps } from '../hooks/useActivityMediator';
import { commandTextToHTML } from 'src/utils/commandUtils';

interface AppContextType {
    commandHistory: string[];
    appendToOutput: (element: React.ReactNode) => void;
    executeCommand: (commandName: string, args?: string[], switches?: Record<string,
        boolean | string>) => ICommandResponse;
    setEditMode: (isEditMode: boolean) => void;
    handleEditSave: (content: string) => void;
    currentActivity: ActivityType;
    setCurrentActivity: React.Dispatch<React.SetStateAction<ActivityType>>;
    // ... other properties and methods
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
    const [editContent, setEditContent] = useState('');

    const handleEditSave = useCallback((content: string) => {
        // Implement the logic to save the edited content                          
        setEditContent(content);
        // You might want to perform additional actions here, such as:             
        // - Sending the content to a server                                       
        // - Updating other parts of your application state                        
        // - Triggering a re-render or state update in other components            
        console.log('Saving edited content:', content);
        // Example: if you need to execute a command after saving                  
        // executeCommand('save', [content]);                                      
    }, [/* add any dependencies */]);

    // Initialize activityMediator
    const activityMediatorProps: IActivityMediatorProps = {
        resetTutorial,
        setCurrentActivity,
        currentActivity,
        startGame,
    };

    const activityMediator = useActivityMediator(activityMediatorProps);

    const value: AppContextType = {
        commandHistory,
        appendToOutput: (element: React.ReactNode) => {
            // Implement appendToOutput logic
        },
        executeCommand: (commandName: string, args?: string[], switches?: Record<string, boolean | string>) => {
            // Implement executeCommand logic
            return {} as ICommandResponse; // Replace with actual implementation
        },
        setEditMode: (isEditMode: boolean) => {
            const handTerm = handTermRef.current;
            if (handTerm && handTerm.setEditMode) {
                handTerm.setEditMode(isEditMode);
            }
        },
        handleEditSave,
        currentActivity,
        setCurrentActivity,
        // ... other methods and properties
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};