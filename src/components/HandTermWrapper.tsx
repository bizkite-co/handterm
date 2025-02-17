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
import {
  type GamePhrase,
  type IHandTermWrapperProps,
  type TreeItem,
  ActivityType,
  StorageKeys,
  type IHandTermWrapperMethods
} from '@handterm/types';
import { createLogger, LogLevel } from '../utils/Logger';
import { parseLocation } from '../utils/navigationUtils';
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
        activitySignal.value = activity;
      }
    };

    window.addEventListener('locationchange', handleLocationChange);
    return () => window.removeEventListener('locationchange', handleLocationChange);
  }, []);

  useEffect(() => {

    // When tutorial signal changes to null, check if we should transition to GAME
    if (tutorialSignal.value === null) {
      // Only transition if we're currently in TUTORIAL mode
      if (currentActivity === ActivityType.TUTORIAL) {
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

      try {
        const items = JSON.parse(storedItems) as TreeItem[];
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
      const term = xtermRef.current;
      if (term !== null && typeof term.focus === 'function') {
        term.focus();
      }
      resetPrompt();
    }
  }, [currentActivity, xtermRef, resetPrompt]);

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
    activitySignal.value = activity;
  };
  window.setNextTutorial = (tutorial: string | null) => {
    tutorialSignal.value = tutorial as unknown as GamePhrase | null;
  };
  window.ActivityType = ActivityType;
}, []);

const getStoredContent = useCallback((): string => {
  const content = localStorage.getItem(StorageKeys.editContent);
  if (content == null) return '';
  try {
    const parsed = JSON.parse(content);
    return parsed ?? '';
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
        toggleVideo={() => {
          isShowVideoSignal.value = !isShowVideoSignal.value;
          return isShowVideoSignal.value;
        }}
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

export { HandTermWrapper };
