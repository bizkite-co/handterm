// TutorialManager.tsx                                                                         
import React, { useState, useEffect } from 'react';
import { Achievement } from '../types/Types';
import { getNextTutorialAchievement, saveAchievements, loadTutorialAchievements } from
    '../utils/achievementUtils';
import { Chord } from './Chord';

interface TutorialManagerProps {
    isInTutorial: boolean;
    onAchievementUnlock: (achievement: Achievement | null) => void;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ isInTutorial,
    onAchievementUnlock }) => {
    const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null);
    const [unlockedAchievements, setUnlockedAchievements] =
        useState<string[]>(loadTutorialAchievements());

    useEffect(() => {
        if (isInTutorial && !currentAchievement) {
            const nextAchievement = getNextTutorialAchievement();
            setCurrentAchievement(nextAchievement);
            onAchievementUnlock(nextAchievement);
        }
    }, [isInTutorial, currentAchievement, onAchievementUnlock]);

    const unlockAchievement = (achievementPhrase: string) => {
        if (currentAchievement?.phrase.join('') === achievementPhrase) {
            const updatedAchievements = [...unlockedAchievements, achievementPhrase];
            setUnlockedAchievements(updatedAchievements);
            saveAchievements(achievementPhrase);

            const nextAchievement = getNextTutorialAchievement();
            setCurrentAchievement(nextAchievement);
            onAchievementUnlock(nextAchievement);
        }
    };

    if (!isInTutorial || !currentAchievement) {
        return null;
    }

    return (
        <div className="tutorial-component">
            <pre className="tutorial-prompt">{currentAchievement.prompt}</pre>
            <div className="chord-display-container">
                {currentAchievement.phrase.map((character, index) => (
                    <Chord key={index} displayChar={character} />
                ))}
            </div>
        </div>
    );
};

export { unlockAchievement };       