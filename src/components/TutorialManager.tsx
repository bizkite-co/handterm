import { memo, useState } from 'react';
import { useSignalEffect } from '@preact/signals-react';
import { type GamePhrase } from '../types/Types';
import { Chord } from './Chord';
import { commandLineSignal } from 'src/signals/commandLineSignals';

interface TutorialManagerProps {
  tutorial: GamePhrase | null;
  onTutorialComplete?: (key: string) => void;
}

// Mirror the game's semantics: characters are removed from the chord
// display as they are correctly typed (prefix match), so the tutorial
// behaves like game play.
export const getFirstNonMatchingChar = (source: string, typed: string): number => {
  if (!typed) return 0;
  if (typed === source) return source.length;
  for (let i = 0; i < typed.length; i++) {
    if (typed[i] !== source[i]) return i;
  }
  return typed.length;
};

export const TutorialManager = memo(({
  tutorial,
  onTutorialComplete,
}: TutorialManagerProps): JSX.Element => {
  const [_commandLine, setCommandLine] = useState<string>(commandLineSignal.value);

  useSignalEffect(() => {
    const nextCommandLine = commandLineSignal.value;
    setCommandLine(nextCommandLine);
    // Auto-advance when the key sequence is fully typed, like game play (no
    // ENTER needed). The \r tutorial is exempt: its target key IS the ENTER
    // key, so it still requires pressing ENTER. Runs in the same effect as
    // the shrink so the completion check is atomic with the signal update.
    if (tutorial == null || tutorial.key == null || tutorial.key === ''
      || tutorial.key === '\r' || nextCommandLine !== tutorial.key) {
      return;
    }
    onTutorialComplete?.(tutorial.key);
  });

  if (tutorial == null) {
    return <div id="tutorial-component" className="tutorial-component" data-testid="tutorial-component" />;
  }

  const firstNonMatchingChar = getFirstNonMatchingChar(tutorial.key, _commandLine);
  const remainingKey = tutorial.key.substring(firstNonMatchingChar);

  return (
    <div id="tutorial-component" className="tutorial-component" data-testid="tutorial-component">
      <pre className="tutorial-prompt">{tutorial.value}</pre>
      <div className="chord-display-container" data-testid="tutorial-chords">
        {remainingKey.split('').map((character: string, index: number) => (
          <Chord key={`char-${firstNonMatchingChar + index}-${character}`} displayChar={character} />
          ))}
      </div>
    </div>
  );
});

TutorialManager.displayName = 'TutorialManager';
