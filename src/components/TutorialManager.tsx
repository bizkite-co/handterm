// TutorialManager.tsx                                                                         
import React, { memo } from 'react';
import { Tutorial } from '../types/Types';
import { Chord } from './Chord';

interface TutorialManagerProps {
    isInTutorial: boolean;
    tutorial: Tutorial | null;
}

export const TutorialManager: React.FC<TutorialManagerProps> = memo(({ 
    isInTutorial,
    tutorial,
}) => {
    if (!isInTutorial) {
        return null;
    }
    return (tutorial &&
        <div className="tutorial-component">
            <pre className="tutorial-prompt">{tutorial.prompt}</pre>
            <div className="chord-display-container">
                {tutorial.display &&
                    <Chord
                        key={tutorial.phrase}
                        displayChar={tutorial.display}
                    />
                }
                {!tutorial.display &&
                    tutorial.phrase.split('').map((character, index) => (
                        <Chord
                            key={index}
                            displayChar={character}
                        />
                    ))
                }
            </div>
        </div>
    );
});
