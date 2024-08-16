import React from 'react';
import { Achievement } from '../types/Types';

interface UnlockAchievementProps {
    achievementPhrase: string;
    nextAchievement: Achievement | null;
    unlockedAchievements: string[];
    setState: (state: any) => void;
}

const UnlockAchievement: React.FC<UnlockAchievementProps> = ({ achievementPhrase, nextAchievement, unlockedAchievements, setState }) => {
    if (nextAchievement?.phrase.join('') === achievementPhrase) {
        const updatedAchievements = [...unlockedAchievements, achievementPhrase];
        setState((prevState: any) => ({
            ...prevState,
            unlockedAchievements: updatedAchievements,
            nextAchievement: getNextTutorialAchievement(),
            isInTutorial: getNextTutorialAchievement() ? true : false
        }));
    }
    return null;
};

export default UnlockAchievement;
