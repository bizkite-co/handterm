import React from 'react';
import CommandOutput from '../components/CommandOutput';

interface ResetTutorialAchievementStateProps {
    cmd: string;
    resetTutorialAchievementState: () => void;
}

const ResetTutorialAchievementState: React.FC<ResetTutorialAchievementStateProps> =
    ({ cmd, resetTutorialAchievementState }) => {
        if (cmd === 'tut') {
            resetTutorialAchievementState();
            return <CommandOutput output="Tutorial achievement state reset" status={200} />
        }
        return null;
    };

export default ResetTutorialAchievementState;