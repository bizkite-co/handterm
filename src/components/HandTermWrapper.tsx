import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, ReactNode } from 'react';
import { ActivityType, Tutorial } from '../types/Types';
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
  terminalReset: () => void;
  prompt: () => void;
  appendTempPassword: (password: string) => void;
  scrollBottom: () => void;
}
export interface IHandTermWrapperMethods {
  writeOutput: (output: string) => void;
  prompt: () => void;
  terminalReset: () => void;
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
  const { currentActivity } = useActivityMediatorContext();
  const { xtermRef, commandLine, writeToTerminal, resetPrompt } = useTerminal();

  const { getNextTutorial, resetTutorial, currentTutorial } = useTutorial();

  const targetWPM = 10;
  const wpmCalculator = useWPMCalculator();
  const gameHandleRef = useRef<IGameHandle>(null);
  const nextCharsDisplayRef: React.RefObject<NextCharsDisplayHandle> = React.createRef();
  const timestamp = new Date().toTimeString().split(' ')[0];
  const zombie4StartPosition = { leftX: -70, topY: 0 };

  const [domain] = useState<string>('handterm.com');
  const [currentPhrase] = useState<GamePhrase | null>(null);
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

  // Create a mutable ref that will always have a current value
  const internalRef = useRef<IHandTermWrapperMethods>({
    writeOutput: () => { },
    prompt: () => { },
    terminalReset: () => { },
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

  // Function to reset tutorial and refresh HandTerm
  const onResetTutorial = useCallback(() => {
    resetTutorial();
    internalRef.current.refreshComponent(); // Call the new method to force a re-render
  }, [internalRef]);

  const startGame = useCallback(() => {
    console.log("startGame called:", gameHandleRef);
    if (gameHandleRef.current) gameHandleRef.current.startGame();
  }, []);

  const activityMediatorProps: IActivityMediatorProps = {
    currentTutorial: getNextTutorial(),
    currentActivity,
    startGame,
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
      terminalReset: resetPrompt,
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
    terminalReset: () => { },
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

  const { } = usePhraseHandler({
    currentActivity: activityMediator.currentActivity,
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
  }, [activityMediator, currentActivity, terminalMethods, setTerminalSize]);

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

    activityMediator.gameHandleRef.current?.completeGame();
    // TODO: Find if there's a tutorialGroupPhrase that matches the current phrase value.

    // const successPhrase = tutorialGroupPhrase ?? GamePhrases.getGamePhraseByValue(phrase.value.join(''));
    // if (successPhrase) {
    //   const { resultActivityType, nextPhrase } = props.activityMediator.checkGameProgress(successPhrase);
    // }
    activityMediator.gameHandleRef.current?.levelUp();
    handlePhraseComplete();
  }

  const handlePhraseComplete = () => {
    localStorage.setItem('currentCommand', '');
    if (nextCharsDisplayRef.current && nextCharsDisplayRef.current.cancelTimer) {
      nextCharsDisplayRef.current.cancelTimer();
    }
    gameHandleRef.current?.completeGame();
    terminalMethods.terminalReset();
  }

  return (
    <>
      {currentActivity === ActivityType.GAME && (<Game
        ref={gameHandleRef}
        canvasHeight={canvasHeight}
        canvasWidth={props.terminalWidth}
        isInGameMode={true}
        heroActionType={activityMediator.heroAction}
        zombie4ActionType={activityMediator.zombie4Action}
        onSetHeroAction={activityMediator.setHeroAction}
        onSetZombie4Action={activityMediator.setZombie4Action}
        zombie4StartPosition={zombie4StartPosition}
      />
      )}
      {currentPhrase && (
        <NextCharsDisplay
          ref={nextCharsDisplayRef}
          commandLine={commandLine}
          isInPhraseMode={currentActivity === ActivityType.GAME}
          newPhrase={currentPhrase.value}
          onPhraseSuccess={handlePhraseSuccess}
          onError={handlePhraseErrorState}
        />
      )}
      {lastTypedCharacter && (
        <Chord displayChar={lastTypedCharacter} />
      )}
      {activityMediator.currentActivity === ActivityType.TUTORIAL && getNextTutorial() && (
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
