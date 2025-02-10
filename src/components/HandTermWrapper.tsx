import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useComputed } from '@preact/signals-react';
import { Game, type IGameHandle } from '../game/Game';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { activitySignal, isShowVideoSignal } from '../signals/appSignals';
import { commandTimeSignal } from '../signals/commandLineSignals';
import { setGamePhrase } from '../signals/gameSignals';
import { tutorialSignal } from '../signals/tutorialSignals';
import type { GamePhrase, IHandTermWrapperProps, TreeItem } from '@handterm/types';
import { ActivityType, StorageKeys } from '@handterm/types';
import { getRepoContent } from '../utils/apiClient';
import { createLogger, LogLevel } from '../utils/Logger';
import { navigate, parseLocation } from '../utils/navigationUtils';
import WebCam from '../utils/WebCam';

import { Chord } from './Chord';
import MonacoCore from './MonacoCore';
import NextCharsDisplay, { type NextCharsDisplayHandle } from './NextCharsDisplay';
import { Prompt } from './Prompt';
import { TutorialManager } from './TutorialManager';

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.DEBUG
});

const getTimestamp = (date: Date): string => date.toTimeString().split(' ')[0] ?? '';

type ActivityMediatorType = ReturnType<typeof useActivityMediator>;

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
      logger.debug('Activity signal changed:', {
        from: currentActivity,
        to: activitySignal.value,
        tutorialState: tutorialSignal.value,
        isTutorialComplete: tutorialSignal.value === null
      });
      setCurrentActivity(activitySignal.value);

      // Log when transitioning from TUTORIAL to GAME
      if (currentActivity === ActivityType.TUTORIAL && activitySignal.value === ActivityType.GAME) {
        logger.debug('Transitioning from TUTORIAL to GAME', {
          tutorialSignal: tutorialSignal.value,
          activitySignal: activitySignal.value
        });
      }
    };

    // Initial sync
    updateActivity();

    // Subscribe to signal changes
    const unsubscribe = activitySignal.subscribe(updateActivity);

    return () => {
      unsubscribe();
    };
  }, [currentActivity]);

  // Handle location change events
  useEffect(() => {
    const handleLocationChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      const activity = customEvent.detail?.activity;
      if (activity) {
        logger.debug('Location change event:', {
          activity,
          currentActivity: activitySignal.value
        });
        activitySignal.value = activity;
      }
    };

    window.addEventListener('locationchange', handleLocationChange);
    return () => window.removeEventListener('locationchange', handleLocationChange);
  }, []);

  useEffect(() => {
    logger.debug('Current activity:', {
      activity: currentActivity,
      tutorialState: tutorialSignal.value,
      isTutorialComplete: tutorialSignal.value === null
    });
  }, [currentActivity]);

  useEffect(() => {
    logger.debug('Tutorial signal:', {
      current: tutorialSignal.value,
      completed: localStorage.getItem('completed-tutorials'),
      state: localStorage.getItem('tutorial-state')
    });

    // When tutorial signal changes to null, check if we should transition to GAME
    if (tutorialSignal.value === null) {
      logger.debug('Tutorial completed, checking for game transition', {
        currentActivity,
        activitySignal: activitySignal.value
      });

      // Only transition if we're currently in TUTORIAL mode
      if (currentActivity === ActivityType.TUTORIAL) {
        logger.debug('Transitioning from TUTORIAL to GAME');
        activitySignal.value = ActivityType.GAME;
      }
    }
  }, [currentActivity]);

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
    logger.debug('handlePhraseSuccess called with phrase:', key, 'Activity:', activitySignal.value);
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
      const response = await getRepoContent(props.auth, currentRepo, path);
      logger.debug('File content response:', response);

      if (response !== null && response.status === 200 && response.data !== undefined) {
        // Store content and file path
        localStorage.setItem(StorageKeys.editContent, response.data.content);
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
    activityMediator: activityMediator,
  }), [writeToTerminal, xtermRef, activityMediator]);

    // Initialize window methods
    useEffect(() => {
    window.setActivity = (activity: ActivityType) => {
      logger.debug('Setting activity:', activity);
      activitySignal.value = activity;
    };
    window.setNextTutorial = (tutorial: string | null) => {
      logger.debug('Setting tutorial:', tutorial);
      tutorialSignal.value = tutorial as unknown as GamePhrase | null;
    };
    window.ActivityType = ActivityType;
  }, []);

  // TODO: This is suppoed to exist and be used somewhere.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleFileSelectWrapper = useCallback((path: string) => {
    void handleFileSelect(path);
  }, [handleFileSelect]);

  const getStoredContent = useCallback((): string => {
    const content = localStorage.getItem(StorageKeys.editContent);
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      return parsed.content ?? '';
    } catch (error) {
      logger.error('Failed to parse edit content:', error);
      return '';
    }
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
        <MonacoCore
          key={currentActivity}
          value={getStoredContent()}
          language="markdown"
        />
      )}
      {currentActivity === ActivityType.TREE && treeItems.length > 0 && (
        <MonacoCore
          key={currentActivity}
          value=""
          language="plaintext"
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

export interface IHandTermWrapperMethods {
    writeOutput: (output: string) => void;
    prompt: () => void;
    saveCommandResponseHistory: (history: string) => string;
    focusTerminal: () => void;
    handleCharacter: (char: string) => void;
    refreshComponent: () => void;
    setHeroSummersaultAction: (summersault: boolean) => void;
    setEditMode: (editMode: boolean) => void;
    handleEditSave: () => void;
    activityMediator: ActivityMediatorType;
}

export type { IHandTermWrapperProps };
export { HandTermWrapper };
