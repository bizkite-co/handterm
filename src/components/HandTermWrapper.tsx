import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, ReactNode } from 'react';
import { ActivityType, OutputElement, GamePhrase } from '../types/Types';
import { useActivityMediator, IActivityMediatorProps } from 'src/hooks/useActivityMediator';
import Game, { IGameHandle } from '../game/Game';
import { IAuthProps } from '../lib/useAuth';
import GamePhrases from '../utils/GamePhrases';
import NextCharsDisplay, { NextCharsDisplayHandle } from './NextCharsDisplay';
import { TutorialManager } from './TutorialManager';
import { Chord } from './Chord';
import { Prompt } from './Prompt';
import { LogKeys } from '../types/TerminalTypes';
import { useResizeCanvasAndFont } from '../hooks/useResizeCanvasAndFont';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { activitySignal } from 'src/signals/appSignals';
import {
  setGamePhrase,
  gameInitSignal,
  isInGameModeSignal,
} from 'src/signals/gameSignals'
import { commandLineSignal, commandSignal, commandTimeSignal } from 'src/signals/commandLineSignals';
import { useComputed } from '@preact/signals-react';
import { getNextTutorial, setNextTutorial, tutorialSignal } from 'src/signals/tutorialSignals';


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

const getTimestamp = (date: Date) => {
  return date.toTimeString().split(' ')[0];
}

export const HandTermWrapper = React.forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  const { xtermRef, writeToTerminal, resetPrompt } = useTerminal();
  const targetWPM = 10;
  const wpmCalculator = useWPMCalculator();
  const gameHandleRef = useRef<IGameHandle>(null);
  const nextCharsDisplayRef: React.RefObject<NextCharsDisplayHandle> = React.createRef();

  const [domain] = useState<string>('handterm.com');
  const initialCanvasHeight = localStorage.getItem('canvasHeight') || '100';
  const [canvasHeight] = useState(parseInt(initialCanvasHeight));
  const [lastTypedCharacter, setLastTypedCharacter] = useState<string | null>(null);
  const [, setErrorCharIndex] = useState<number | undefined>(undefined);
  const [phraseKey] = useState('');
  const [, setTerminalSize] = useState<{ width: number; height: number } | undefined>();
  const [githubAuthHandled, setGithubAuthHandled] = useState<boolean>(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [isInSvgMode] = useState<boolean>(false);
  const [editFilePath, setEditFilePath] = useState('_index');
  const [editFileExtension, setEditFileExtension] = useState('md');
  const [userName, setUserName] = useState<string | null>(null);
  const activity = useComputed(() => activitySignal.value);
  const isGameInitialized = useComputed(() => gameInitSignal.value);
  const tutorial = useComputed(() => tutorialSignal.value).value;
  const gameInit = useComputed(() => gameInitSignal.value);
  const commandTime = useComputed(() => commandTimeSignal.value);
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
    if (isGameInitialized.value && gameHandleRef.current) {

      let gamePhrases: GamePhrase[] = [];
      if (tutorial?.tutorialGroup) {
        gamePhrases = GamePhrases.getGamePhrasesByTutorialGroup(tutorial.tutorialGroup);
      }
      if (gamePhrases.length === 0) {
        gamePhrases = GamePhrases.getGamePhrasesNotAchieved();
      }
      if (gamePhrases.length === 0) return;
      setGamePhrase(gamePhrases[0]);
      gameHandleRef.current.startGame(tutorial?.tutorialGroup);
      // gameInit.value = false;
    }
  }, [isGameInitialized.value, gameHandleRef])

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
    setNextTutorial();
  }, []);

  useEffect(() => {
    handleGitHubAuth();
  }, []);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    if (typeof setErrorCharIndex === 'function') {
      setErrorCharIndex(errorIndex);
    }
  }, [setErrorCharIndex]);

  const handlePhraseSuccess = (phrase: GamePhrase | null) => {
    if (!phrase) return;
    const wpms = wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > targetWPM) {
      activityMediator.checkGameProgress(phrase);
    }

    gameHandleRef.current?.completeGame();
    // TODO: Set the next phrase.

    gameHandleRef.current?.levelUp();
    handlePhraseComplete();
  }

  const handlePhraseComplete = () => {
    localStorage.setItem('currentCommand', '');
    setGamePhrase(null);
    if (nextCharsDisplayRef.current && nextCharsDisplayRef.current.cancelTimer) {
      nextCharsDisplayRef.current.cancelTimer();
    }
    gameHandleRef.current?.completeGame();
    resetPrompt();
  }

  return (
    <>
      {(activity.value === ActivityType.GAME 
        && isInGameModeSignal.value)
        && (
          <Game
            ref={gameHandleRef}
            canvasHeight={canvasHeight}
            canvasWidth={props.terminalWidth}
          />
        )}
      {activity.value === ActivityType.GAME 
        && isInGameModeSignal.value 
        && (
        <NextCharsDisplay
          ref={nextCharsDisplayRef}
          isInPhraseMode={true}
          onPhraseSuccess={handlePhraseSuccess}
          onError={handlePhraseErrorState}
        />
      )}
      {lastTypedCharacter && (
        <Chord displayChar={lastTypedCharacter} />
      )}
      {activity.value === ActivityType.TUTORIAL && tutorialSignal.value && (
        <TutorialManager
          isInTutorial={true}
          tutorial={tutorialSignal.value}
        />
      )}
      <Prompt
        username={userName || 'guest'}
        domain={domain || 'handterm.com'}
        githubUsername={githubUsername}
        timestamp={getTimestamp(commandTime.value)}
      />
      <div ref={xtermRef} />
    </>
  );
});
