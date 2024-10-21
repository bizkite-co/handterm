// TutorialManager.tsx                                                                         
import React, { memo } from 'react';
import { Tutorial, Tutorials } from '../types/Types';
import { Chord } from './Chord';
import { getNextTutorial } from 'src/signals/tutorialSignals';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { useTutorial } from 'src/hooks/useTutorials';


export const TutorialManager: React.FC = memo(() => {
    const {parseLocation} = useReactiveLocation();
    const phraseKey = parseLocation().phraseKey
    const tutorial = Tutorials.find(t => t.phrase === phraseKey?.replace('_r', '\r'));
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
