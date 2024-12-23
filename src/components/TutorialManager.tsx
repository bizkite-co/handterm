import { type Tutorial } from '../types/Types';

import { Chord } from './Chord';

interface TutorialManagerProps {
  tutorial: Tutorial;
}

export const TutorialManager = ({
  tutorial,
}: TutorialManagerProps): JSX.Element => {
  return (
    tutorial && (
      <div className="tutorial-component" data-testid="tutorial-component">
        <pre className="tutorial-prompt">{tutorial.prompt}</pre>
        <div className="chord-display-container">
          {tutorial.display && (
            <Chord key={tutorial.phrase} displayChar={tutorial.display} />
          )}
          {!tutorial.display &&
            tutorial.phrase.split('').map((character: string, index: number) => (
              <Chord key={`${index}-${character}`} displayChar={character} />
            ))}
        </div>
      </div>
    )
  );
};

TutorialManager.displayName = 'TutorialManager';
