// TutorialManager.tsx                                                                         
import React from 'react';
import { Achievement } from '../types/Types';
import { Chord } from './Chord';

interface TutorialManagerProps {
    isInTutorial: boolean;
    achievement: Achievement;
}

export const TutorialManager: React.FC<TutorialManagerProps> = ({ 
    isInTutorial,
    achievement,
}) => {
    if (!isInTutorial) {
        return null;
    }
    return (
        <div className="tutorial-component">
            <pre className="tutorial-prompt">{achievement.prompt}</pre>
            <div className="chord-display-container">
                {achievement.phrase.map((character, index) => (
                    <Chord key={index} displayChar={character} />
                ))}
            </div>
        </div>
    );
};
