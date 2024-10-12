// src/hooks/useTutorial.ts
import { useState, useCallback, useEffect } from 'react';
import { Tutorial, Tutorials } from "../types/Types";

const completedTutorialsKey = "completed-tutorials";

export const useTutorial = () => {
    const [completedTutorials, setCompletedTutorials] = useState<string[]>([]);
    const [currentTutorial, setCurrentTutorial] = useState<Tutorial | null>(null);


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

    const getIncompleteTutorials = useCallback((): Tutorial[] => {
        const completedTutorials = getCompletedTutorials();

        const incomplete = Tutorials.filter(tut => !completedTutorials.includes(tut.phrase.join('')));
        return incomplete;
    }, [])

    const getTutorialsInGroup = (groupName:string) => {
        const result = Tutorials.filter(t => t.tutorialGroup === groupName);
        return result;
    }

    const getIncompleteTutorialsInGroup = (groupName:string) => {
        const incompleteTutorials = new Set(getIncompleteTutorials());
        const tutorialsInGroup = new Set(getTutorialsInGroup(groupName));

        const result = tutorialsInGroup.intersection(incompleteTutorials);
        return Array.from(result);
    }

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
    }, [currentTutorial]);

    const resetTutorial = useCallback(() => {
        localStorage.removeItem(completedTutorialsKey);
        setCompletedTutorials([]);
        const firstTutorial = Tutorials[0];
        setCurrentTutorial(firstTutorial);
        return firstTutorial;
    }, []);

    useEffect(() => {
        const nextTutorial = getNextTutorial();
        setCurrentTutorial(nextTutorial);
    }, [completedTutorials, getNextTutorial]);

    return {
        currentTutorial,
        saveTutorial,
        unlockTutorial,
        resetTutorial,
        completedTutorials,
        getCurrentTutorial: () => currentTutorial,
        getNextTutorial,
        getIncompleteTutorials,
        getTutorialsInGroup,
        getIncompleteTutorialsInGroup
    };
};