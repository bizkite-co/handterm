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
import { getFileContent } from '../utils/apiClient';

const logger = createLogger('HandTermWrapper', LogLevel.DEBUG);

interface TreeItem {
  path: string;
  type: string;
}

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
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);

  const { parseLocation, updateLocation } = useReactiveLocation();
  const currentActivity = parseLocation().activityKey;

  // Load tree items when entering tree view mode
  useEffect(() => {
    if (currentActivity === ActivityType.TREE) {
      console.log('Loading tree items in TREE mode');
      const storedItems = localStorage.getItem('github_tree_items');
      console.log('Stored items:', storedItems);
      if (storedItems) {
        try {
          const items = JSON.parse(storedItems);
          console.log('Parsed items:', items);
          if (Array.isArray(items) && items.length > 0) {
            setTreeItems(items);
          } else {
            console.error('Tree items array is empty or invalid');
          }
        } catch (error) {
          console.error('Error parsing tree items:', error);
        }
      } else {
        console.error('No tree items found in localStorage');
      }
    }
  }, [currentActivity]);

  const handleFileSelect = useCallback(async (path: string) => {
    try {
      // Get the current repository from localStorage (set by GitHubCommand)
      const currentRepo = localStorage.getItem('current_github_repo');
      if (!currentRepo) {
        console.error('No repository selected');
        return;
      }

      console.log('Fetching file content:', { repo: currentRepo, path });
      const response = await getFileContent(props.auth, currentRepo, path);
      console.log('File content response:', response);

      if (response.status === 200 && response.data) {
        // Content is already decoded by the lambda
        localStorage.setItem('edit-content', response.data.content);
        updateLocation({
          activityKey: ActivityType.EDIT,
          contentKey: null,
          groupKey: null
        });
      } else {
        console.error('Failed to fetch file content:', response.error);
      }
    } catch (error) {
      console.error('Failed to fetch file content:', error);
      // Stay in tree view mode on error
      return;
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

      {/* Always show terminal unless in EDIT or TREE mode */}
      {currentActivity !== ActivityType.EDIT && currentActivity !== ActivityType.TREE && (
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

      {currentActivity === ActivityType.EDIT && (
        <MonacoEditor
          initialValue={localStorage.getItem('edit-content') || ''}
          language="markdown"
          onClose={handleEditorClose}
        />
      )}
      {currentActivity === ActivityType.TREE && treeItems.length > 0 && (
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
