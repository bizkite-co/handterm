import React, { useEffect, useRef, useState, useCallback, useImperativeHandle } from 'react';
import { ActivityType, OutputElement, GamePhrase } from '../types/Types';
import { useActivityMediator } from 'src/hooks/useActivityMediator';
import Game, { IGameHandle } from '../game/Game';
import { IAuthProps } from '../hooks/useAuth';
import NextCharsDisplay, { NextCharsDisplayHandle } from './NextCharsDisplay';
import { TutorialManager } from './TutorialManager';
import { Chord } from './Chord';
import { Prompt } from './Prompt';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { activitySignal, isShowVideoSignal } from 'src/signals/appSignals';
import {
  setGamePhrase,
} from 'src/signals/gameSignals';
import { useComputed } from '@preact/signals-react';
import MonacoEditor from './MonacoEditor';
import WebCam from 'src/utils/WebCam';
import { createLogger, LogLevel } from 'src/utils/Logger';
import { commandTimeSignal } from 'src/signals/commandLineSignals';
import { getFileContent } from '../utils/apiClient';
import { navigate, parseLocation } from 'src/utils/navigationUtils';
import { tutorialSignal } from 'src/signals/tutorialSignals';

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.DEBUG
});

interface TreeItem {
  path: string;
  type: 'file' | 'directory';
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
  const [lastTypedCharacter] = useState<string | null>(null);
  const [, setErrorCharIndex] = useState<number | undefined>(undefined);
  const [githubUsername] = useState<string | null>(null);
  const [userName] = useState<string | null>(null);
  const commandTime = useComputed(() => commandTimeSignal.value);
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [, setCurrentFile] = useState<string | null>(null);

  const currentActivity = parseLocation().activityKey;

  // Declare handlePhraseComplete with all its dependencies
  const handlePhraseComplete = useCallback(() => {
    localStorage.setItem('currentCommand', '');
    setGamePhrase(null);
    if (nextCharsDisplayRef.current && nextCharsDisplayRef.current.cancelTimer) {
      nextCharsDisplayRef.current.cancelTimer();
    }
    gameHandleRef.current?.completeGame();
    resetPrompt();
  }, [nextCharsDisplayRef, gameHandleRef, resetPrompt]);

  // Then use it in handlePhraseSuccess
  const handlePhraseSuccess = useCallback((phrase: GamePhrase | null) => {
    if (!phrase) return;
    logger.debug(`handlePhraseSuccess called with phrase:`, phrase.key, "Activity:", ActivityType[activitySignal.value]);
    const wpms = wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > targetWPM) {
      activityMediator.checkGameProgress(phrase);
    }

    gameHandleRef.current?.completeGame();
    gameHandleRef.current?.levelUp();
    handlePhraseComplete();
  }, [wpmCalculator, activityMediator, handlePhraseComplete, gameHandleRef, targetWPM]);

  // Load tree items when entering tree view mode
  useEffect(() => {
    if (currentActivity === ActivityType.TREE) {
      logger.info('Loading tree items in TREE mode');
      const storedItems = localStorage.getItem('github_tree_items');
      logger.debug('Stored items:', storedItems);
      if (storedItems) {
        try {
          const items = JSON.parse(storedItems);
          logger.debug('Parsed items:', items);
          if (Array.isArray(items) && items.length > 0) {
            setTreeItems(items);
          } else {
            logger.error('Tree items array is empty or invalid');
          }
        } catch (error) {
          logger.error('Error parsing tree items:', error);
        }
      } else {
        logger.error('No tree items found in localStorage');
      }
    }
  }, [currentActivity]);

  // Reset terminal when returning to normal mode
  useEffect(() => {
    if (currentActivity === ActivityType.NORMAL) {
      logger.info('Resetting terminal in NORMAL mode');
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
      resetPrompt();
    }
  }, [currentActivity, xtermRef, resetPrompt]);

  const handleFileSelect = useCallback(async (path: string) => {
    try {
      // Get the current repository from localStorage (set by GitHubCommand)
      const currentRepo = localStorage.getItem('current_github_repo');
      if (!currentRepo) {
        logger.error('No repository selected');
        return;
      }

      logger.info('Fetching file content:', { repo: currentRepo, path });
      const response = await getFileContent(props.auth, currentRepo, path);
      logger.debug('File content response:', response);

      if (response.status === 200 && response.data) {
        // Store content and file path
        localStorage.setItem('edit-content', response.data.content);
        setCurrentFile(path);

        // Update location with file path
        navigate({
          activityKey: ActivityType.EDIT,
          contentKey: `${currentRepo}/${path}`,
          groupKey: null
        });
      } else {
        logger.error('Failed to fetch file content:', response.error);
      }
    } catch (error) {
      logger.error('Failed to fetch file content:', error);
      // Stay in tree view mode on error
      return;
    }
  }, [props.auth, navigate]);

  const handleEditorClose = useCallback((): void => {
    logger.info('Closing editor, returning to NORMAL mode');
    // Clear stored content and file path
    localStorage.removeItem('edit-content');
    setCurrentFile(null);
    // Return to normal mode
    navigate({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null
    });
  }, [navigate]);

  const handleTreeClose = useCallback((): void => {
    logger.info('Closing tree view, returning to NORMAL mode');
    // Clear tree items
    setTreeItems([]);
    localStorage.removeItem('github_tree_items');
    // Return to normal mode
    navigate({
      activityKey: ActivityType.NORMAL,
      contentKey: null,
      groupKey: null
    });
  }, [navigate]);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

  // Initialize component methods
  useImperativeHandle(forwardedRef, () => ({
    writeOutput: writeToTerminal,
    prompt: () => { },
    saveCommandResponseHistory: () => '',
    focusTerminal: () => {
      if (xtermRef.current) {
        xtermRef.current.focus();
      }
    },
    handleCharacter: () => { },
    refreshComponent: () => { },
    setHeroSummersaultAction: () => { },
    setEditMode: () => { },
    handleEditSave: () => { },
  }), [writeToTerminal, xtermRef]);

  return (
    <div id='handterm-wrapper'>
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
        <div id="prompt-and-terminal">
          <Prompt
            username={userName || 'guest'}
            domain={domain || 'handterm.com'}
            githubUsername={githubUsername}
            timestamp={getTimestamp(commandTime.value)}
          />
          <div
            ref={xtermRef}
            id="xtermRef"
          />
        </div>
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
          onClose={handleTreeClose}
        />
      )}
      {isShowVideoSignal.value && (
        <WebCam
          setOn={isShowVideoSignal.value}
        />
      )}
    </div>
  );
});

export default HandTermWrapper;
