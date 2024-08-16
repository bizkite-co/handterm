import React from 'react';
import CommandOutput from '../components/CommandOutput';

interface UnlockAchievementProps {
    cmd: string;
    state: any;
    unlockAchievement: (achievementPhrase: string) => void;
}

const UnlockAchievement: React.FC<UnlockAchievementProps> = ({ cmd, state,
    unlockAchievement }) => {
    if (state.isInTutorial || cmd === 'tut') {
        if (cmd === '') cmd = 'Return (ENTER)';
        if (state.nextAchievement?.phrase.join('') === cmd) {
            unlockAchievement(cmd);
            return <CommandOutput output="Achievement unlocked" status={200} />;
        }
    }
    return null;
};

export default UnlockAchievement;import React from 'react';
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
