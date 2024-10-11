import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, ReactNode } from 'react';
import { ActivityType, OutputElement, Tutorial } from '../types/Types';
import { useActivityMediator, IActivityMediatorProps, IActivityMediatorReturn } from 'src/hooks/useActivityMediator';
import Game, { IGameHandle } from '../game/Game';
import { IAuthProps } from '../lib/useAuth';
import { usePhraseHandler } from '../hooks/usePhraseHandler';
import GamePhrases, { GamePhrase } from '../utils/GamePhrases';
import NextCharsDisplay, { NextCharsDisplayHandle } from './NextCharsDisplay';
import { TutorialManager } from './TutorialManager';
import { Chord } from './Chord';
import { Phrase } from '../utils/Phrase';
import { Prompt } from './Prompt';
import { LogKeys } from '../types/TerminalTypes';
import { useResizeCanvasAndFont } from '../hooks/useResizeCanvasAndFont';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { useAppContext } from '../contexts/AppContext';
import { useCommand } from '../hooks/useCommand';
import { useActivityMediatorContext } from 'src/contexts/ActivityMediatorContext';
import { useTutorial } from 'src/hooks/useTutorials';
import {
  activitySignal,
  heroActionSignal,
  zombie4ActionSignal,
  currentPhraseSignal,
  gameLevelSignal,
  setHeroAction,
  setZombie4Action,
  setCurrentPhrase,
  tutorialGroupSignal,
  setGameLevel,
  gameInitSignal
} from '../signals/activitySignals';
import { useComputed } from '@preact/signals-react';


export interface IHandTermWrapperProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: IAuthProps;
  onOutputUpdate: (output: OutputElement) => void;
}

export interface XtermMethods {
  focusTerminal: () => void;
  terminalWrite: (data: string) => void;
  getCurrentCommand: () => string;
  getTerminalSize: () => { width: number; height: number } | undefined;
  prompt: () => void;
  appendTempPassword: (password: string) => void;
  scrollBottom: () => void;
}
export interface IHandTermWrapperMethods {
  writeOutput: (output: string) => void;
  prompt: () => void;
  saveCommandResponseHistory: (command: string, response: string, status: number) => string;
  focusTerminal: () => void;
  handleCharacter: (character: string) => void;
  toggleVideo: () => boolean;
  refreshComponent: () => void;
  setHeroSummersaultAction: () => void;
  setEditMode: (isEditMode: boolean) => void;
  handleEditSave: (content: string) => void;
  // Add other methods as needed
}

export const HandTermWrapper = React.forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  const { xtermRef, commandLine, writeToTerminal, resetPrompt } = useTerminal();

  const { getNextTutorial, currentTutorial } = useTutorial();

  const targetWPM = 10;
  const wpmCalculator = useWPMCalculator();
  const gameHandleRef = useRef<IGameHandle>(null);
  const nextCharsDisplayRef: React.RefObject<NextCharsDisplayHandle> = React.createRef();
  const timestamp = new Date().toTimeString().split(' ')[0];
  const zombie4StartPosition = { leftX: -70, topY: 0 };

  const [domain] = useState<string>('handterm.com');
  const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
  const [canvasHeight] = useState(parseInt(initialCanvasHeight));
  const [lastTypedCharacter, setLastTypedCharacter] = useState<string | null>(null);
  const [, setErrorCharIndex] = useState<number | undefined>(undefined);
  const gamePhrasesAchieved = GamePhrases
    .getGamePhrasesAchieved()
    .map((phrase: { wpm: number; phraseName: string }) => phrase.phraseName);
  const [phrasesAchieved, setPhrasesAchieved] = useState<string[]>(gamePhrasesAchieved);
  const [phraseKey] = useState('');
  const [, setTerminalSize] = useState<{ width: number; height: number } | undefined>();
  const [githubAuthHandled, setGithubAuthHandled] = useState<boolean>(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isInSvgMode] = useState<boolean>(false);
  const [isInLoginProcess, setIsInLoginProcess] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [editContent, setEditContent] = useState('');
  const [editFilePath, setEditFilePath] = useState('_index');
  const [editFileExtension, setEditFileExtension] = useState('md');
  const [userName, setUserName] = useState<string | null>(null);
  const activity = useComputed(() => activitySignal.value);
  const isGameIntialized = useComputed(() => gameInitSignal.value);
  const tutorialGroup = useComputed(() => tutorialGroupSignal.value);
  const gameInit = useComputed(() => gameInitSignal.value);
  const currentPhrase = useComputed(() => currentPhraseSignal.value);

  // Create a mutable ref that will always have a current value
  const internalRef = useRef<IHandTermWrapperMethods>({
    writeOutput: () => { },
    prompt: () => { },
    saveCommandResponseHistory: () => '',
    handleCharacter: () => { },
    toggleVideo: () => false,
    refreshComponent: () => { },
    setHeroSummersaultAction: () => { },
    focusTerminal: () => { },
    setEditMode: () => { },
    handleEditSave: () => { },
  });

  // Use useImperativeHandle to update both refs
  useImperativeHandle(forwardedRef, () => internalRef.current);

  const updateUserName = useCallback(() => {
    const isLoggedIn = props.auth.isLoggedIn;
    if (isLoggedIn) {
      const userName = localStorage.getItem(LogKeys.Username);
      setUserName(userName || null);
    } else {
      setUserName(null);
    }
  }, [props.auth.isLoggedIn]);

  const handleFocusEditor = useCallback(() => {
    // Implement focus editor logic here
    // TODO: put the focus into the editor

  }, []);

  useEffect(() => {
    if (isGameIntialized.value && gameHandleRef.current) {
      const phrase
        = (tutorialGroup.value
          ? GamePhrases.getGamePhrasesByTutorialGroup(tutorialGroup.value)
          : GamePhrases.getGamePhrasesNotAchieved()[0]) as GamePhrase;
      setCurrentPhrase(phrase);
      gameHandleRef.current.startGame(tutorialGroup.value);
      // gameInit.value = false;
    }
  }, [isGameIntialized.value, gameHandleRef])

  const activityMediatorProps: IActivityMediatorProps = {
    currentTutorial: getNextTutorial(),
    currentActivity: activity.value,
  }

  // Initialize activityMediator with the appropriate initial values
  const activityMediator = useActivityMediator(activityMediatorProps);

  // Expose methods via ref
  useImperativeHandle(internalRef, () => {
    const methods: IHandTermWrapperMethods = {
      writeOutput: writeToTerminal,
      prompt: () => {
        // Implement prompt logic
      },
      saveCommandResponseHistory: (command: string, response: string, status: number) => {
        // Implement saveCommandResponseHistory logic
        return ''; // Return appropriate string
      },
      handleCharacter: (character: string) => {
        // Implement handleCharacter logic
      },
      toggleVideo: () => {
        // Implement toggleVideo logic
        return false; // Return appropriate boolean
      },
      refreshComponent: () => {
        // Implement refreshComponent logic
      },
      setHeroSummersaultAction: () => {
        // Implement setHeroSummersaultAction logic
      },
      focusTerminal: () => {
        if (xtermRef.current) {
          xtermRef.current.focus();
        }
      },
      setEditMode: () => { },
      handleEditSave: () => { },
    };

    return methods;
  }, [writeToTerminal, resetPrompt, xtermRef]); // Add other dependencies as needed

  // Add these state variables for XtermAdapter functions
  const [terminalMethods, setTerminalMethods] = useState<XtermMethods>(() => ({
    focusTerminal: () => { },
    terminalWrite: () => { },
    getCurrentCommand: () => '',
    getTerminalSize: () => undefined,
    prompt: () => { },
    appendTempPassword: () => { },
    scrollBottom: () => { },
  }));

  const {
    fontSize,
  } = useResizeCanvasAndFont();

  const savePhrasesAchieved = (phraseName: string, wpmAverage: number) => {
    const wpmPhraseName = Math.round(wpmAverage) + ':' + phraseName;
    const matchingPhrases = phrasesAchieved.filter(p => { return p.split(":")[1] === phraseKey });
    if (matchingPhrases.length > 0) return;
    setPhrasesAchieved(prevState => [...(prevState || []), wpmPhraseName])

    const storedPhrasesAchievedString: string = localStorage.getItem('phrasesAchieved') || '';
    const storedPhrasesAchieved: string[] = storedPhrasesAchievedString ? JSON.parse(storedPhrasesAchievedString) : [];
    const matchingStoredPhrases = storedPhrasesAchieved
      .filter((p: string) => { return p.split(":")[1] === phraseKey });
    if (matchingStoredPhrases.length > 0) return;
    storedPhrasesAchieved.push(wpmPhraseName);
    localStorage.setItem('phrasesAchieved', JSON.stringify(storedPhrasesAchieved));
  }

  // Why isn't this used?
  const { } = usePhraseHandler({
    currentActivity: activity.value,
  });

  const handleGitHubAuth = useCallback(() => {
    if (!githubAuthHandled) {
      const urlParams = new URLSearchParams(window.location.search);
      const githubAuth = urlParams.get('githubAuth');
      const githubUsername = urlParams.get('githubUsername');
      if (!githubUsername) return;
      if (githubAuth === 'success') {
        localStorage.setItem('githubUsername', githubUsername);
        window.history.replaceState({}, document.title, window.location.pathname);
        setGithubAuthHandled(true);
        setGithubUsername(githubUsername);
      }
    }
  }, [githubAuthHandled]);

  useEffect(() => {
    activityMediator.determineActivityState();
  }, [activityMediator]);

  // Determine the initial achievement and activity type
  const initializeActivity = useCallback(() => {
    if (terminalMethods.getTerminalSize) {
      const size = terminalMethods.getTerminalSize();
      if (size) {
        setTerminalSize(size);
      }
    }
    terminalMethods.scrollBottom();
  }, [activityMediator, terminalMethods, setTerminalSize]);

  useEffect(() => {
    initializeActivity();
  }, []);

  useEffect(() => {
    handleGitHubAuth();
  }, []);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    if (typeof setErrorCharIndex === 'function') {
      setErrorCharIndex(errorIndex);
    }
  }, [setErrorCharIndex]);

  const handlePhraseSuccess = (_phrase: Phrase) => {
    const wpms = wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > targetWPM) {
      savePhrasesAchieved(phraseKey, wpmAverage);
    }

    gameHandleRef.current?.completeGame();
    // TODO: Find if there's a tutorialGroupPhrase that matches the current phrase value.

    // const successPhrase = tutorialGroupPhrase ?? GamePhrases.getGamePhraseByValue(phrase.value.join(''));
    // if (successPhrase) {
    //   const { resultActivityType, nextPhrase } = props.activityMediator.checkGameProgress(successPhrase);
    // }
    gameHandleRef.current?.levelUp();
    handlePhraseComplete();
  }

  const handlePhraseComplete = () => {
    localStorage.setItem('currentCommand', '');
    setCurrentPhrase(null);
    if (nextCharsDisplayRef.current && nextCharsDisplayRef.current.cancelTimer) {
      nextCharsDisplayRef.current.cancelTimer();
    }
    gameHandleRef.current?.completeGame();
    resetPrompt();
  }

  return (
    <>
      {(activity.value === ActivityType.GAME) && (
        <Game
          ref={gameHandleRef}
          canvasHeight={canvasHeight}
          canvasWidth={props.terminalWidth}
          isInGameMode={true}
          zombie4StartPosition={zombie4StartPosition}
        />
      )}
      {currentPhrase?.value?.value && activity.value === ActivityType.GAME && (
        <NextCharsDisplay
          ref={nextCharsDisplayRef}
          commandLine={commandLine}
          isInPhraseMode={true}
          newPhrase={currentPhrase.value.value}
          onPhraseSuccess={handlePhraseSuccess}
          onError={handlePhraseErrorState}
        />
      )}
      {lastTypedCharacter && (
        <Chord displayChar={lastTypedCharacter} />
      )}
      {activity.value === ActivityType.TUTORIAL && getNextTutorial() && (
        <TutorialManager
          isInTutorial={true}
          achievement={getNextTutorial()}
        />
      )}
      <Prompt
        username={userName || 'guest'}
        domain={domain || 'handterm.com'}
        githubUsername={githubUsername}
        timestamp={timestamp}
      />
      <div ref={xtermRef} />
    </>
  );
});
