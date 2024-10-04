import React, { useEffect, useRef, useState, useCallback } from 'react';
import { IWPMCalculator, WPMCalculator } from '../utils/WPMCalculator';
import { getNextTutorial, loadTutorials, resetTutorial } from '../utils/tutorialUtils';
import { ActivityType, Tutorial } from '../types/Types';
import { useActivityMediator, IActivityMediatorProps } from '../hooks/useActivityMediator';
import { useCommandHistory } from '../hooks/useCommandHistory';
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
import { IUseCommandHandlerProps, useCommandHandler } from '../hooks/useCommandHandler';

export interface IHandTermWrapperProps {
  // Define the interface for your HandexTerm logic
  terminalWidth: number;
  auth: IAuthProps;
  onOutputUpdate: (output: React.ReactNode) => void;
  adapterRef: React.RefObject<any>;
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
  writeOutput: (output: React.ReactNode) => void;
  prompt: () => void;
  terminalReset: () => void;
  saveCommandResponseHistory: (command: string, response: string, status: number) => string;
  focusTerminal: () => void;
  handleCommand: (cmd: string) => Promise<any>; // Adjust the return type as needed
  handleCharacter: (character: string) => void;
  toggleVideo: () => boolean;
  refreshComponent: () => void;
  setHeroSummersaultAction: () => void;
  // Add other methods as needed
}

export const HandTermWrapper = React.forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, ref) => {
   const targetWPM = 10;
   const wpmCalculator: IWPMCalculator = new WPMCalculator();
   const mutableRef = React.useRef<IHandTermWrapperMethods | null>(null);
   const gameHandleRef = useRef<IGameHandle>(null);
   const nextCharsDisplayRef: React.RefObject<NextCharsDisplayHandle> = React.createRef();
   const timestamp = new Date().toTimeString().split(' ')[0];
   const zombie4StartPosition = { leftX: -70, topY: 0 };

   const { addToCommandHistory } = useCommandHistory(loadTutorials());
   const [domain] = useState<string>('handterm.com');
   const [currentPhrase] = useState<GamePhrase | null>(null);
   const [currentTutorial] = useState<Tutorial | null>(getNextTutorial());
   const [currentActivity, setCurrentActivity] = useState<ActivityType>(ActivityType.NORMAL);
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
   }, []);

   // Function to reset tutorial and refresh HandTerm
   const onResetTutorial = useCallback(() => {
     if (ref && 'current' in ref && ref.current) {
       resetTutorial();
       ref.current.refreshComponent(); // Call the new method to force a re-render
     }
   }, [ref]);

   const startGame = useCallback(() => {
     console.log("startGame called:", gameHandleRef);
     if (gameHandleRef.current) gameHandleRef.current.startGame();
   }, []);

   const activityMediatorProps: IActivityMediatorProps = {
     resetTutorial: onResetTutorial,
     currentTutorial: getNextTutorial(),
     currentActivity,
     setCurrentActivity,
     startGame,
   }

   // Initialize activityMediator with the appropriate initial values
   const activityMediator = useActivityMediator(activityMediatorProps);

   const writeToTerminal = useCallback((output: React.ReactNode) => {
     if (mutableRef.current) {
       mutableRef.current.writeOutput(output);
     }
   }, []);

   const commandHandlerProps: IUseCommandHandlerProps = {
     handTermRef: mutableRef,
     auth: props.auth,
     setIsLoggedIn,
     updateUserName,
     writeOutput: writeToTerminal,
     setEditContent,
     setEditFilePath,
     setEditFileExtension,
     setTargetWPM: () => {}, // Implement this if needed
     handleFocusEditor,
     activityMediator,
     setCurrentActivity,
   };

   const { handleCommand } = useCommandHandler(commandHandlerProps);

   const handleCommandExecuted = useCallback((command: string) => {
     handleCommand(command);
     addToCommandHistory(command);
     // Any other logic you need after command execution
   }, [handleCommand, addToCommandHistory]);

   const { xtermRef, commandLine, writeToTerminal: xtermWrite, resetPrompt } = useTerminal({
     wpmCalculator,
     onCommandExecuted: handleCommandExecuted
   });


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

  const writeOutputInternal = useCallback((output: string) => {
    addToCommandHistory(output);
    props.onOutputUpdate(output);
  }, [addToCommandHistory, props]);

  const prompt = useCallback(() => {
    terminalMethods.prompt();
  }, [terminalMethods]);

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
        writeOutputInternal(`GitHub authentication successful. Welcome, ${githubUsername}!`);
        setGithubAuthHandled(true);
        setGithubUsername(githubUsername);
      }
    }
  }, [githubAuthHandled, writeOutputInternal]);

  // Determine the initial achievement and activity type
  const initializeActivity = useCallback(() => {
    const newActivity = activityMediator.determineActivityState();
    if (newActivity !== currentActivity) {
      setCurrentActivity(newActivity);
    }
    if (terminalMethods.getTerminalSize) {
      const size = terminalMethods.getTerminalSize();
      if (size) {
        setTerminalSize(size);
      }
    }
    terminalMethods.scrollBottom();
  }, [activityMediator, currentActivity, setCurrentActivity, terminalMethods, setTerminalSize]);

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
    //   console.log("Switched from Game back to Tutorial:", ActivityType[resultActivityType], nextPhrase);
    // }
    activityMediator.gameHandleRef.current?.levelUp();
    handlePhraseComplete();
    props.adapterRef.current?.terminalReset();
    props.adapterRef.current?.prompt();
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
      {currentTutorial && (
        <TutorialManager
          isInTutorial={currentActivity === ActivityType.TUTORIAL}
          achievement={currentTutorial}
        />)}
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
