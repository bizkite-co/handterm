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

export default UnlockAchievement;