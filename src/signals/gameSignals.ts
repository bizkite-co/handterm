
// gameSignals.ts
import { signal, computed } from "@preact/signals-react";
import { setActivity } from "src/signals/appSignals";
import { ActionType } from "src/game/types/ActionTypes";
import { ActivityType, GamePhrase, Phrases } from "src/types/Types";
import { createPersistentSignal } from "src/utils/signalPersistence";

export const startGameSignal = signal<string | undefined>(undefined);
export const gamePhraseSignal = signal<GamePhrase | null>(null);
export const gameInitSignal = signal<boolean>(false);
export const isInGameModeSignal = signal<boolean>(false);
export const currentGamePhraseSignal = signal<GamePhrase | null>(null);
export const gameLevelSignal = signal<number | null>(null);
export const heroActionSignal = signal<ActionType>('Idle');
export const zombie4ActionSignal = signal<ActionType>('Walk');

const completedGamePhrasesKey = 'completed-game-phrases';

export const setHeroAction = (action: ActionType) => {
  heroActionSignal.value = action;
};

export const setZombie4Action = (action: ActionType) => {
  zombie4ActionSignal.value = action;
};

export const setGameLevel = (level: number) => {
  gameLevelSignal.value = level;
};

const { signal: completedGamePhrasesSignal, update: updateCompletedGamePhrases } = createPersistentSignal({
  key: completedGamePhrasesKey,
  signal: signal<Set<string>>(new Set()),
  serialize: (value) => JSON.stringify([...value]),
  deserialize: (value) => new Set(JSON.parse(value)),
});

export { completedGamePhrasesSignal };

export const setCompletedGamePhrase = (gamePhraseId:string) => {
  updateCompletedGamePhrases(prev => prev.add(gamePhraseId))
}

export const getIncompletePhrasesByTutorialGroup = (tutorialGroup: string):GamePhrase[] => {
  const phrasesInGroup = Phrases.filter(p => p.tutorialGroup === tutorialGroup);
  const incompletePhrasesInGroup = phrasesInGroup
    .filter(pig => !Array.from(completedGamePhrasesSignal.value).includes(pig.key) ) 
  const result = incompletePhrasesInGroup;

  return result;
}

export const setNextGamePhrase = ():boolean => {
  // get next tutoral that is not in completed tutorials.
  const nextTutorial = Phrases
    .find(t => !completedGamePhrasesSignal.value.has(t.key));
  if(nextTutorial){
    gamePhraseSignal.value = nextTutorial;
    return true;
  }
  else{
    gamePhraseSignal.value = null;
    return false;
  }
};

export const initializeGame = (tutorialGroup?: string) => {
  setActivity(ActivityType.GAME);
  gameInitSignal.value = true;
  isInGameModeSignal.value = true;
  if (tutorialGroup) {
    const tutorialGroupGamePhrase = getIncompletePhrasesByTutorialGroup(tutorialGroup);
    if (tutorialGroupGamePhrase.length > 0) {
      gamePhraseSignal.value = tutorialGroupGamePhrase[0];
    }
  };
};

export const setGamePhrase = (phrase: GamePhrase | null) => {
  gamePhraseSignal.value = phrase;
};

// Load initial state
const loadInitialState = () => {
  const storedTutorials = localStorage.getItem(completedGamePhrasesKey);
  if (storedTutorials) {
    completedGamePhrasesSignal.value = new Set(JSON.parse(storedTutorials));
  }
  setNextGamePhrase();
};

loadInitialState();