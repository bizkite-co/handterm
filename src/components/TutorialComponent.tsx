import React from 'react';
import { Chord } from "./Chord";
import { Achievement } from "../types/Types";

export interface ITutorialComponentProps {
    achievement: Achievement;
    isInTutorial: boolean;
}

export const TutorialComponent: React.FC<ITutorialComponentProps> = ({ achievement, isInTutorial }) => {
    if (!Array.isArray(achievement.phrase)) 
        throw new Error('achievement is undefined');
    const characters: string[] = achievement.phrase;
    if (characters.length === 0) 
        throw new Error('achievement is undefined');
    
    return (
        <div
            className="tutorial-component"
            hidden={!isInTutorial}
        >
            <pre className="tutorial-prompt">{achievement.prompt}</pre>
            <div className="chord-display-container">
                {characters.map((character: string, index: number) => (
                    <Chord
                        key={index}
                        displayChar={character}
                    />
                ))}
            </div>
        </div>
    );
}
