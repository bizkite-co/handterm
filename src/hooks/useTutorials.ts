// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";

const completedTutorialsKey = "completed-tutorials";

export const useTutorial = () => {
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);

    const getCompletedTutorials = useCallback((): string[] => {
        const storedAchievements = localStorage.getItem(completedTutorialsKey);
        return storedAchievements ? JSON.parse(storedAchievements) : [];
    }, []);

    const saveTutorial = useCallback((achievementPhrase: string) => {
        const updatedAchievements = [...completedTutorials, achievementPhrase];
        setCompletedTutorials(updatedAchievements);
        localStorage.setItem(completedTutorialsKey, JSON.stringify(updatedAchievements));
    }, [completedTutorials]);

    const getNextTutorial = useCallback((): Tutorial | null => {
        const nextAchievement = Tutorials
            .find(a => !completedTutorials.some(ua => ua === a.phrase.join('')));
        return nextAchievement || null;
    }, [completedTutorials]);

    const unlockTutorial = useCallback((command: string): boolean => {
        if (!currentTutorial) return false;
        if (command === '') command = 'Return (ENTER)';
        if (currentTutorial.phrase.join('') === command) {
            saveTutorial(command);
            setCurrentTutorial(getNextTutorial());
            return true;
        }
        return false;
    }, [currentTutorial, saveTutorial, getNextTutorial]);

    const resetTutorial = useCallback(() => {
        localStorage.removeItem(completedTutorialsKey);
        setCompletedTutorials([]);
        setCurrentTutorial(Tutorials[0]);
    }, []);

    useEffect(() => {
        const loadedTutorials = getCompletedTutorials();
        setCompletedTutorials(loadedTutorials);
        setCurrentTutorial(getNextTutorial());
    }, []);

    return {
        currentTutorial,
        unlockTutorial,
        resetTutorial,
        getCompletedTutorials,
        getNextTutorial,
        saveTutorial
    };
};