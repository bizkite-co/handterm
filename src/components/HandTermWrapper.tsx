import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { ActivityType, OutputElement, GamePhrase } from '../types/Types';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import Game, { IGameHandle } from '../game/Game';
import { IAuthProps } from '../hooks/useAuth';
import NextCharsDisplay, { NextCharsDisplayHandle } from './NextCharsDisplay';
import { TutorialManager } from './TutorialManager';
import { Chord } from './Chord';
import { Prompt } from './Prompt';
import { useResizeCanvasAndFont } from '../hooks/useResizeCanvasAndFont';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { activitySignal, isEditModeSignal, isShowVideoSignal } from 'src/signals/appSignals';
import {
  setGamePhrase,
  isInGameModeSignal,
} from 'src/signals/gameSignals';
import { useComputed } from '@preact/signals-react';
import MonacoEditor from './MonacoEditor';
import WebCam from 'src/utils/WebCam';
import { useReactiveLocation } from 'src/hooks/useReactiveLocation';
import { createLogger, LogLevel } from 'src/utils/Logger';
import { commandTimeSignal } from 'src/signals/commandLineSignals';
import axios from 'axios';
import ENDPOINTS from '../shared/endpoints.json';

const logger = createLogger('HandTermWrapper', LogLevel.DEBUG);

export interface IHandTermWrapperProps {
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
  const activityMediator = useActivityMediator();

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
  const [tempUserName, setTempUserName] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [treeItems, setTreeItems] = useState<Array<{ path: string; type: string }>>([]);

  const { parseLocation, updateLocation } = useReactiveLocation();

  useEffect(() => {
    // Load tree items from localStorage when in tree view mode
    if (parseLocation().activityKey === ActivityType.TREE) {
      const storedItems = localStorage.getItem('github_tree_items');
      if (storedItems) {
        setTreeItems(JSON.parse(storedItems));
      }
    }
  }, [parseLocation().activityKey]);

  const handleFileSelect = useCallback(async (path: string) => {
    try {
      // Get the current repository from localStorage (set by GitHubCommand)
      const currentRepo = localStorage.getItem('current_github_repo');
      if (!currentRepo) {
        console.error('No repository selected');
        return;
      }

      // Get auth token
      const authResponse = await props.auth.validateAndRefreshToken();
      if (!authResponse || authResponse.status !== 200 || !authResponse.data) {
        console.error('Authentication failed');
        return;
      }

      // Fetch file content
      const response = await axios.get(`${ENDPOINTS.api.BaseUrl}/github/file`, {
        headers: {
          'Authorization': `Bearer ${authResponse.data.AccessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          repo: currentRepo,
          path: path
        }
      });

      if (response.data && response.data.content) {
        // Store content and switch to edit mode
        localStorage.setItem('edit-content', response.data.content);
        updateLocation({
          activityKey: ActivityType.EDIT,
          contentKey: null,
          groupKey: null
        });
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
    }
  }, [props.auth, updateLocation]);

  const handleEditorClose = useCallback((): void => {
    updateLocation({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null
    });
  }, [updateLocation]);

  const handlePhraseSuccess = useCallback((phrase: GamePhrase | null) => {
    if (!phrase) return;
    console.log(`handlePhraseSuccess called with phrase:`, phrase.key, "Activity:", ActivityType[activitySignal.value]);
    const wpms = wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > targetWPM) {
      activityMediator.checkGameProgress(phrase);
    }

    gameHandleRef.current?.completeGame();
    gameHandleRef.current?.levelUp();
    handlePhraseComplete();
  }, [wpmCalculator, activityMediator]);

  const handlePhraseComplete = useCallback(() => {
    localStorage.setItem('currentCommand', '');
    setGamePhrase(null);
    if (nextCharsDisplayRef.current && nextCharsDisplayRef.current.cancelTimer) {
      nextCharsDisplayRef.current.cancelTimer();
    }
    gameHandleRef.current?.completeGame();
    resetPrompt();
  }, [resetPrompt]);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

  // Initialize component methods
  useImperativeHandle(forwardedRef, () => ({
    writeOutput: writeToTerminal,
    prompt: () => {},
    saveCommandResponseHistory: () => '',
    focusTerminal: () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    },
    handleCharacter: () => {},
    toggleVideo: () => false,
    refreshComponent: () => {},
    setHeroSummersaultAction: () => {},
    setEditMode: () => {},
    handleEditSave: () => {},
  }), [writeToTerminal, xtermRef]);

  return (
    <>
      {(parseLocation().activityKey === ActivityType.GAME) && (
        <Game
          ref={gameHandleRef}
          canvasHeight={canvasHeight}
          canvasWidth={props.terminalWidth}
        />
      )}
      {parseLocation().activityKey === ActivityType.GAME && (
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
      {parseLocation().activityKey === ActivityType.TUTORIAL && (
        <TutorialManager />
      )}

      {parseLocation().activityKey !== ActivityType.EDIT &&
       parseLocation().activityKey !== ActivityType.TREE && (
        <>
          <Prompt
            username={userName || 'guest'}
            domain={domain || 'handterm.com'}
            githubUsername={githubUsername}
            timestamp={getTimestamp(commandTime.value)}
          />
          <div ref={xtermRef} />
        </>
      )}
      {parseLocation().activityKey === ActivityType.EDIT && (
        <MonacoEditor
          initialValue={localStorage.getItem('edit-content') || ''}
          language="markdown"
          onClose={handleEditorClose}
        />
      )}
      {parseLocation().activityKey === ActivityType.TREE && (
        <MonacoEditor
          initialValue=""
          language="plaintext"
          isTreeView={true}
          treeItems={treeItems}
          onFileSelect={handleFileSelect}
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
