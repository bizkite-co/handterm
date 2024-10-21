import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, ReactNode } from 'react';
import { ActivityType, OutputElement, GamePhrase } from '../types/Types';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
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
import { activitySignal, isEditModeSignal, isInTutorialModeSignal, isShowVideoSignal } from 'src/signals/appSignals';
import {
  setGamePhrase,
  isInGameModeSignal,
} from 'src/signals/gameSignals'
import { commandLineSignal, commandSignal, commandTimeSignal } from 'src/signals/commandLineSignals';
import { useComputed, useSignalEffect } from '@preact/signals-react';
import { getNextTutorial, setNextTutorial, tutorialSignal } from 'src/signals/tutorialSignals';
import MonacoEditor from './MonacoEditor';
import WebCam from 'src/utils/WebCam';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { createLogger, LogLevel } from 'src/utils/Logger';
import { parse } from 'path';

const logger = createLogger('useReactiveLocation', LogLevel.DEBUG);

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
  const [, setTerminalSize] = useState<{ width: number; height: number } | undefined>();
  const [githubAuthHandled, setGithubAuthHandled] = useState<boolean>(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const activity = useComputed(() => activitySignal.value);
  const isGameInitialized = useComputed(() => isInGameModeSignal.value);
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
  const {parseLocation} = useReactiveLocation();

  useEffect(() => {
    if (isGameInitialized && gameHandleRef.current) {
      // TODOO: This is half-implemented URL path state
      gameHandleRef.current.startGame();
      // gameInit.value = false;
    }
  }, [isGameInitialized, gameHandleRef])

  // Initialize activityMediator with the appropriate initial values
  const activityMediator = useActivityMediator();

  // Expose methods via ref
  useImperativeHandle(internalRef, () => {
    const methods: IHandTermWrapperMethods = {
      writeOutput: writeToTerminal,
      prompt: () => {
        // Implement prompt logic
      },
      saveCommandResponseHistory: () => {
        // Implement saveCommandResponseHistory logic
        return ''; // Return appropriate string
      },
      handleCharacter: () => {
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
    console.log(`handlePhraseSuccess called with phrase:`, phrase.key, "Activity:", ActivityType[activitySignal.value]);
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
      {(parseLocation().activityKey === ActivityType.GAME)
        && (
          <Game
            ref={gameHandleRef}
            canvasHeight={canvasHeight}
            canvasWidth={props.terminalWidth}
          />
        )}
      {parseLocation().activityKey === ActivityType.GAME
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
      {parseLocation().activityKey === ActivityType.TUTORIAL &&
        <TutorialManager
        />
      }
      <Prompt
        username={userName || 'guest'}
        domain={domain || 'handterm.com'}
        githubUsername={githubUsername}
        timestamp={getTimestamp(commandTime.value)}
      />
      {!isEditModeSignal.value &&
        <div ref={xtermRef} />
      }
      {parseLocation().activityKey === ActivityType.EDIT && (
        <MonacoEditor
          initialValue={editContent}
          language={editLanguage}
          onChange={(value) => handleEditChange(value || '')}
          onSave={handleEditSave}
          onClose={handleEditorClose}
        />
      )}
      {isShowVideoSignal.value && (
        <WebCam
          setOn={isShowVideoSignal.value}
        />
      )}
    </>
  );
});
