import { type Tutorial } from '../types/Types';

import { Chord } from './Chord';
import './TutorialManager.css';

interface TutorialManagerProps {
  tutorial: Tutorial | null;
}

export const TutorialManager = ({
  tutorial,
}: TutorialManagerProps): JSX.Element => {
  if (!tutorial) {
    return <div className="tutorial-component" data-testid="tutorial-component" />;
  }

  return (
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
  );
};

TutorialManager.displayName = 'TutorialManager';
