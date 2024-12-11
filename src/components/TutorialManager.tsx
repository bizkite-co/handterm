// TutorialManager.tsx
import React, { memo } from 'react';
import { Tutorial } from '../types/Types';
import { Chord } from './Chord';

export const TutorialManager: React.FC<{tutorial:Tutorial}> = memo(({tutorial}) => {
    return (tutorial &&
        <div className="tutorial-component" data-testid="tutorial-component">
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
