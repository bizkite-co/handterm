import { memo } from 'react';
import { type GamePhrase } from '../types/Types';
import { Chord } from './Chord';

interface TutorialManagerProps {
  tutorial: GamePhrase | null;
}

export const TutorialManager = memo(({
  tutorial,
}: TutorialManagerProps): JSX.Element => {
  if (tutorial == null) {
    return <div id="tutorial-component" className="tutorial-component" data-testid="tutorial-component" />;
  }

  return (
    <div id="tutorial-component" className="tutorial-component" data-testid="tutorial-component">
      <pre className="tutorial-prompt">{tutorial.value}</pre>
      <div className="chord-display-container">
        {tutorial.key.split('').map((character: string, index: number) => (
          <Chord key={`char-${index}-${character}`} displayChar={character} />
          ))}
      </div>
    </div>
  );
});

TutorialManager.displayName = 'TutorialManager';
