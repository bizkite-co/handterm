import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useComputed } from '@preact/signals-react';

import { Game, type IGameHandle } from '../game/Game';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { type IAuthProps } from '../hooks/useAuth';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { activitySignal, isShowVideoSignal } from '../signals/appSignals';
import { commandTimeSignal } from '../signals/commandLineSignals';
import { setGamePhrase } from '../signals/gameSignals';
import { tutorialSignal } from '../signals/tutorialSignals';
import { ActivityType, type GamePhrase, type OutputElement } from '../types/Types';
import { getFileContent } from '../utils/apiClient';
import { createLogger, LogLevel } from '../utils/Logger';
import { navigate, parseLocation } from '../utils/navigationUtils';
import WebCam from '../utils/WebCam';

import { Chord } from './Chord';
import { MonacoEditor } from './MonacoEditor';
import NextCharsDisplay, { type NextCharsDisplayHandle } from './NextCharsDisplay';
import { Prompt } from './Prompt';
import { TutorialManager } from './TutorialManager';

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.DEBUG
});

interface TreeItem {
  path: string;
  type: 'file' | 'directory';
}

interface IHandTermWrapperProps {
  terminalWidth: number;
  auth: IAuthProps;
  onOutputUpdate: (output: OutputElement) => void;
}

interface XtermMethods {
  focusTerminal: () => void;
  terminalWrite: (data: string) => void;
  getCurrentCommand: () => string;
  getTerminalSize: () => { width: number; height: number } | undefined;
  prompt: () => void;
  scrollBottom: () => void;
}

interface IHandTermWrapperMethods {
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

const getTimestamp = (date: Date): string => date.toTimeString().split(' ')[0] ?? '';

const HandTermWrapper = forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  const { xtermRef, writeToTerminal, resetPrompt } = useTerminal();
  const targetWPM = 10;
  const wpmCalculator = useWPMCalculator();
  const gameHandleRef = useRef<IGameHandle>(null);
  const nextCharsDisplayRef = useRef<NextCharsDisplayHandle>(null);
  const activityMediator = useActivityMediator();

  const [domain] = useState('handterm.com');
  const initialCanvasHeight = localStorage.getItem('canvasHeight')?.trim() ?? '100';
  const [canvasHeight] = useState<number>(() => parseInt(initialCanvasHeight, 10));
  const [lastTypedCharacter] = useState<string | null>(null);
  const [, setErrorCharIndex] = useState<number | undefined>(undefined);
  const [githubUsername] = useState<string | null>(null);
  const [userName] = useState<string | null>(null);
  const commandTime = useComputed(() => commandTimeSignal.value);
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [, setCurrentFile] = useState<string | null>(null);

  const [currentActivity, setCurrentActivity] = useState(parseLocation().activityKey);

  // Update activity state when activitySignal changes
  useEffect(() => {
    const updateActivity = () => {
      logger.debug('Activity signal changed:', ActivityType[activitySignal.value]);
      setCurrentActivity(activitySignal.value);
    };

    // Initial sync
    updateActivity();

    // Subscribe to signal changes
    const unsubscribe = activitySignal.subscribe(updateActivity);

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    logger.debug('Current activity:', ActivityType[currentActivity]);
  }, [currentActivity]);

  useEffect(() => {
    logger.debug('Tutorial signal:', tutorialSignal.value);
  }, [tutorialSignal.value]);

  // Declare handlePhraseComplete with all its dependencies
  const handlePhraseComplete = useCallback(() => {
    localStorage.setItem('currentCommand', '');
    setGamePhrase(null);
    const timer = nextCharsDisplayRef.current?.cancelTimer;
    if (typeof timer === 'function') {
      timer();
    }
    const game = gameHandleRef.current;
    if (isGameHandle(game)) {
      game.completeGame();
    }

    function isGameHandle(game: IGameHandle | null): game is IGameHandle {
      return game !== null;
    }
    resetPrompt();
  }, [nextCharsDisplayRef, gameHandleRef, resetPrompt]);

  // Then use it in handlePhraseSuccess
  const handlePhraseSuccess = useCallback((phrase: GamePhrase | null) => {
    if (phrase === null) return;

    const key = phrase.key?.trim() ?? '';
    const value = phrase.value?.trim() ?? '';
    if (key === '' || value === '') {
      return;
    }
    logger.debug('handlePhraseSuccess called with phrase:', key, 'Activity:', ActivityType[activitySignal.value]);
    const wpms = wpmCalculator.getWPMs();
    const wpmAverage = wpms.wpmAverage;

    if (wpmAverage > targetWPM) {
      activityMediator.checkGameProgress(phrase);
    }

    const game = gameHandleRef.current;
    if (isGameHandle(game)) {
      game.completeGame();
      game.levelUp();
    }

    function isGameHandle(game: IGameHandle | null): game is IGameHandle {
      return game !== null;
    }
    handlePhraseComplete();
  }, [wpmCalculator, activityMediator, handlePhraseComplete, gameHandleRef, targetWPM]);

  // Load tree items when entering tree view mode
  useEffect(() => {
    if (currentActivity === ActivityType.TREE) {
      logger.info('Loading tree items in TREE mode');
      const storedItems = localStorage.getItem('github_tree_items')?.trim() ?? '';
      if (storedItems === '') {
        logger.error('No tree items found in localStorage');
        return;
      }

      logger.debug('Stored items:', storedItems);
      try {
        const items = JSON.parse(storedItems) as TreeItem[];
        logger.debug('Parsed items:', items);
        if (Array.isArray(items) && items.length > 0) {
          setTreeItems(items);
        } else {
          logger.error('Tree items array is empty or invalid');
        }
      } catch (error) {
        logger.error('Error parsing tree items:', error);
      }
    }
  }, [currentActivity]);

  // Reset terminal when returning to normal mode
  useEffect(() => {
    if (currentActivity === ActivityType.NORMAL) {
      logger.info('Resetting terminal in NORMAL mode');
      const term = xtermRef.current;
      if (term !== null && typeof term.focus === 'function') {
        term.focus();
      }
      resetPrompt();
    }
  }, [currentActivity, xtermRef, resetPrompt]);

  const handleFileSelect = useCallback(async (path: string) => {
    try {
      // Get the current repository from localStorage (set by GitHubCommand)
      const currentRepo = localStorage.getItem('current_github_repo')?.trim() ?? '';
      if (currentRepo === '') {
        logger.error('No repository selected');
        return;
      }

      logger.info('Fetching file content:', { repo: currentRepo, path });
      const response = await getFileContent(props.auth, currentRepo, path);
      logger.debug('File content response:', response);

      if (response !== null && response.status === 200 && response.data !== undefined) {
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
        logger.error('Failed to fetch file content:', response?.error);
      }
    } catch (error) {
      logger.error('Failed to fetch file content:', error);
      // Stay in tree view mode on error
      return;
    }
  }, [props.auth]);

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
  }, []);

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
  }, []);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

  // Initialize component methods
  useImperativeHandle(forwardedRef, () => ({
    writeOutput: writeToTerminal,
    prompt: () => { },
    saveCommandResponseHistory: () => '',
    focusTerminal: () => {
      const term = xtermRef.current;
      if (term !== null && term !== undefined && typeof term.focus === 'function') {
        term.focus();
      }
    },
    handleCharacter: () => { },
    refreshComponent: () => { },
    setHeroSummersaultAction: () => { },
    setEditMode: () => { },
    handleEditSave: () => { },
  }), [writeToTerminal, xtermRef]);

  // Initialize window methods
  useEffect(() => {
    window.setActivity = (activity: ActivityType) => {
      logger.debug('Setting activity:', ActivityType[activity]);
      activitySignal.value = activity;
    };
    window.setNextTutorial = (tutorial: GamePhrase | null) => {
      logger.debug('Setting tutorial:', tutorial);
      tutorialSignal.value = tutorial;
    };
    window.ActivityType = ActivityType;
  }, []);

  const handleFileSelectWrapper = useCallback((path: string) => {
    void handleFileSelect(path);
  }, [handleFileSelect]);

  const getStoredContent = useCallback((): string => {
    const content = localStorage.getItem('edit-content');
    return content !== null ? content : '';
  }, []);

  return (
    <div id='handterm-wrapper'>
      {currentActivity === ActivityType.GAME && (
        <Game
          ref={gameHandleRef}
          canvasHeight={canvasHeight}
          canvasWidth={props.terminalWidth}
        />
      )}
      {currentActivity === ActivityType.GAME && (
        <NextCharsDisplay
          ref={nextCharsDisplayRef}
          isInPhraseMode={true}
          onPhraseSuccess={handlePhraseSuccess}
          onError={handlePhraseErrorState}
        />
      )}
      {lastTypedCharacter !== null && (
        <Chord displayChar={lastTypedCharacter} />
      )}
      {currentActivity === ActivityType.TUTORIAL && tutorialSignal.value != null && (
        <TutorialManager
          tutorial={tutorialSignal.value}
        />
      )}

      {/* Always show terminal unless in EDIT or TREE mode */}
      {currentActivity !== ActivityType.EDIT && currentActivity !== ActivityType.TREE && (
        <div id="prompt-and-terminal">
          <Prompt
            username={userName ?? 'guest'}
            domain={domain ?? 'handterm.com'}
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
          initialValue={getStoredContent()}
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
          onFileSelect={handleFileSelectWrapper}
          onClose={handleTreeClose}
        />
      )}
      {isShowVideoSignal.value !== null && (
        <WebCam
          setOn={isShowVideoSignal.value}
        />
      )}
    </div>
  );
});

HandTermWrapper.displayName = 'HandTermWrapper';

export type { IHandTermWrapperMethods, IHandTermWrapperProps, XtermMethods };
export { HandTermWrapper };
