// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";

const completedTutorialsKey = "completed-tutorials";

export const useTutorial = () => {
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);

    const loadTutorials = useCallback((): string[] => {
        const storedAchievements = localStorage.getItem(completedTutorialsKey);
        return storedAchievements ? JSON.parse(storedAchievements) : [];
    }, []);

    const getNextTutorial = useCallback((): Tutorial | null => {
        const completedTuts = getCompletedTutorials();
        const nextAchievement = Tutorials
            .find(a => !completedTuts.some(ua => ua === a.phrase.join('')));
        return nextAchievement || null;
    }, [completedTutorials]);

    const getCompletedTutorials = useCallback((): string[] => {
        const storedAchievements = localStorage.getItem(completedTutorialsKey);
        return storedAchievements ? JSON.parse(storedAchievements) : [];
    }, []);

    const saveTutorial = useCallback((achievementId: string) => {
        setCompletedTutorials(prev => {
            if (!prev.includes(achievementId)) {
                const updatedAchievements = [...prev, achievementId];
                localStorage.setItem(completedTutorialsKey, JSON.stringify(updatedAchievements));
                return updatedAchievements;
            }
            return prev;
        });
    }, []);

    const unlockTutorial = useCallback((command: string): boolean => {
        let nextTutorial = getNextTutorial();
        if (!nextTutorial) return false;
        if (command === '\r') command = 'Return (ENTER)';
        if (nextTutorial.phrase.join('') === command) {
            const updatedCompletedTutorials = [...completedTutorials, nextTutorial.phrase.join('')];
            setCompletedTutorials(updatedCompletedTutorials);
            localStorage.setItem(completedTutorialsKey, JSON.stringify(updatedCompletedTutorials));
            
            // Update nextTutorial
            nextTutorial = getNextTutorial();
            setCurrentTutorial(nextTutorial);
            return true;
        }
        return false;
    }, [currentTutorial, saveTutorial]);

    const resetTutorial = useCallback(() => {
        localStorage.removeItem(completedTutorialsKey);
        setCompletedTutorials([]);
        const firstTutorial = Tutorials[0];
        setCurrentTutorial(firstTutorial);
        return firstTutorial;
    }, []);

    useEffect(() => {
        const loadedTutorials = loadTutorials();
        setCompletedTutorials(loadedTutorials);
    }, [loadTutorials]);

    useEffect(() => {
        const nextTutorial = getNextTutorial();
        setCurrentTutorial(nextTutorial);
    }, [completedTutorials, getNextTutorial]);

    return {
        currentTutorial,
        unlockTutorial,
        resetTutorial,
        completedTutorials,
        getCurrentTutorial: () => currentTutorial,
        getNextTutorial
    };
};