// TutorialManager.tsx                                                                         
import React, { memo } from 'react';
import { Tutorial } from '../types/Types';
import { Chord } from './Chord';

interface TutorialManagerProps {
    isInTutorial: boolean;
    achievement: Tutorial | null;
}

export const TutorialManager: React.FC<TutorialManagerProps> = memo(({ 
    isInTutorial,
    achievement,
}) => {
    if (!isInTutorial) {
        return null;
    }
    return (achievement &&
        <div className="tutorial-component">
            <pre className="tutorial-prompt">{achievement.prompt}</pre>
            <div className="chord-display-container">
                {achievement.phrase.map((character, index) => (
                    <Chord key={index} displayChar={character} />
                ))}
            </div>
        </div>
    );
});
