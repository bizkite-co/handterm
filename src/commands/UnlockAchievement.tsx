import React from 'react';
import { Achievement } from '../types/Types';
import { getNextTutorialAchievement, saveAchievements } from '../utils/achievementUtils';

interface UnlockAchievementProps {
    achievementPhrase: string;
    nextAchievement: Achievement | null;
    unlockedAchievements: string[];
    setState: (state: any) => void;
}

const UnlockAchievement: React.FC<UnlockAchievementProps> = ({
    achievementPhrase, nextAchievement, unlockedAchievements, setState
}) => {
    if (achievementPhrase === '') achievementPhrase = 'Return (ENTER)';
    if (
        nextAchievement?.phrase.join('') === achievementPhrase
    ) {

        const updatedAchievements = [
            ...unlockedAchievements,
            achievementPhrase
        ];
        saveAchievements(achievementPhrase);
        const nextTutorialAchievement = getNextTutorialAchievement();
        setState((prevState: any) => ({
            ...prevState,
            unlockedAchievements: updatedAchievements,
            nextAchievement: nextTutorialAchievement,
            isInTutorial: nextTutorialAchievement ? true : false
        }));
    }
    return null;
};

export default UnlockAchievement;
