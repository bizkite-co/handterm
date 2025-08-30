import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { useComputed } from '@preact/signals-react';
import { Game, type IGameHandle } from '../game/Game';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { isShowVideoSignal, activitySignal } from '../signals/appSignals'; // Import activitySignal
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
import { parseLocation, navigate } from '../utils/navigationUtils';
import WebCam from '../utils/WebCam';
import GamePhrases from '../utils/GamePhrases'; // Import GamePhrases
import { useLocation } from 'react-router-dom'; // Import useLocation

import { Chord } from './Chord';
import MonacoCore from './MonacoCore';
import NextCharsDisplay, { type NextCharsDisplayHandle } from './NextCharsDisplay';
import { PromptHeader } from './PromptHeader';
import { TutorialManager } from './TutorialManager';
// Removed activitySignal import
// import { activitySignal } from '../signals/appSignals'; // Import activitySignal

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.DEBUG
});

const getTimestamp = (date: Date): string => date.toTimeString().split(' ')[0] ?? '';

const HandTermWrapper = forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  const { xtermRef, writeToTerminal, resetPrompt, fitAddon, instance } = useTerminal(); // Destructure instance
  const targetWPM = 10;
  const wpmCalculator = useWPMCalculator();
  const gameHandleRef = useRef<IGameHandle>(null);
  const nextCharsDisplayRef = useRef<NextCharsDisplayHandle>(null);
  const activityMediator = useActivityMediator();
  const location = useLocation(); // Get location from react-router-dom

  const [domain] = useState('handterm.com');
  const initialCanvasHeight = localStorage.getItem('canvasHeight')?.trim() ?? '100';
  const [canvasHeight] = useState<number>(() => parseInt(initialCanvasHeight, 10));
  const [lastTypedCharacter] = useState<string | null>(null);
  const [, setErrorCharIndex] = useState<number | undefined>(undefined);
  const [githubUsername] = useState<string | null>(null);
  const [userName] = useState<string | null>(null);
  const commandTime = useComputed(() => commandTimeSignal.value);
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);

  // NEW: Directly use activitySignal value
  const currentActivityValue = activitySignal.value;
  logger.debug(`HandTermWrapper rendering with activity: ${currentActivityValue}`);
  // END NEW


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
    // Removed redundant resetPrompt() call
  }, [nextCharsDisplayRef, gameHandleRef]);

  const handlePhraseSuccess = useCallback((phrase: GamePhrase | null) => {
    if (phrase === null) return;

    const key = phrase.key?.trim() ?? '';
    const value = phrase.value?.trim() ?? '';
    if (key === '' || value === '') {
      return;
    }
    logger.debug('handlePhraseSuccess called with phrase:', key, 'Activity:', currentActivityValue); // Use derived activity
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
    resetPrompt(); // Add resetPrompt here to ensure it's called once
  }, [wpmCalculator, activityMediator, handlePhraseComplete, gameHandleRef, targetWPM, resetPrompt, currentActivityValue]); // Add derived activity to dependencies

  useEffect(() => {
    if (currentActivityValue === ActivityType.TREE) { // Use derived activity
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
  }, [currentActivityValue]); // Depend on derived activity

  // NEW EFFECT: Handle terminal fitting and focusing when instance and addon are ready and activity is NORMAL
  useEffect(() => {
    const isTerminalRelevantActivity = currentActivityValue === ActivityType.NORMAL;

    logger.debug('Terminal Ready Effect triggered', {
       activity: currentActivityValue,
       instanceExists: !!instance,
       fitAddonExists: !!fitAddon.current
    });

    if (isTerminalRelevantActivity && instance && fitAddon.current) {
      const terminalElement = instance.element;
      const containerElement = document.getElementById('prompt-and-terminal');

      logger.debug('Terminal Ready Effect: Checking element presence and visibility', {
         terminalElement: !!terminalElement,
         containerElement: !!containerElement,
         containerContains: containerElement ? document.body.contains(containerElement) : false,
         containerOffsetParent: containerElement ? containerElement.offsetParent !== null : false
      });


      if (terminalElement && containerElement && document.body.contains(containerElement) && containerElement.offsetParent !== null) {
        logger.debug('Terminal Ready Effect: Attempting fit and focus for NORMAL activity with delay');
        // Add a small delay to allow the DOM to update and render the terminal
        setTimeout(() => {
          try {
            fitAddon.current.fit();
            instance.focus();
            // Add logging for dimensions after fit
            logger.debug('Terminal Ready Effect: Fit and focus completed successfully after delay.', {
                containerWidth: containerElement.offsetWidth,
                containerHeight: containerElement.offsetHeight,
                terminalCols: instance.cols,
                terminalRows: instance.rows
            });
          } catch (error) {
            logger.error('Terminal Ready Effect Error after delay', { error });
          }
        }, 50); // 50ms delay
      } else {
         logger.debug('Terminal Ready Effect: Skipping fit/focus, elements not attached or visible.');
      }
    } else if (!isTerminalRelevantActivity && instance && fitAddon.current) {
       // If not terminal activity, just ensure fit is attempted if needed (e.g., window resize)
       // This might still be necessary if the container size changes while the terminal is hidden
       logger.debug('Terminal Ready Effect: Attempting fit for non-terminal activity');
       try {
          fitAddon.current.fit();
       } catch (error) {
          logger.error('Terminal Fit Error in non-terminal activity', { error });
       }
    } else {
       logger.debug('Terminal Ready Effect: Skipping fit/focus, instance, fitAddon missing, or not NORMAL activity', {
          instanceExists: !!instance,
          fitAddonExists: !!fitAddon.current,
          activity: currentActivityValue
       });
    }

  }, [currentActivityValue, instance, fitAddon]); // Depend on derived activity and other refs/instances
  // END NEW EFFECT

  // Existing effect for resize observer (kept separate as it depends only on instance and fitAddon)
  useEffect(() => {
    logger.debug('Resize Observer Effect triggered', {
       instanceExists: !!instance,
       fitAddonExists: !!fitAddon.current
    });
    const resizeObserver = new ResizeObserver(() => {
        logger.debug('ResizeObserver callback triggered');
        if (instance && fitAddon.current) {
            logger.debug('ResizeObserver: Fitting terminal');
            try {
                fitAddon.current.fit();
            } catch (error) {
                logger.error('ResizeObserver Fit Error', { error });
            }
        } else {
           logger.debug('ResizeObserver: Skipping fit, instance or fitAddon missing', {
              instanceExists: !!instance,
              fitAddonExists: !!fitAddon.current
           });
        }
    });

    const containerElementForObserver = document.getElementById('prompt-and-terminal');
    logger.debug('Resize Observer Effect: Checking for container element', {
       containerElement: !!containerElementForObserver
    });
    if (containerElementForObserver) {
        resizeObserver.observe(containerElementForObserver);
        logger.debug('Resize Observer Effect: Observing container element.');
    } else {
       logger.debug('Resize Observer Effect: Skipping observation, container element not found.');
    }

    return () => {
        logger.debug('Resize Observer Effect cleanup');
        resizeObserver.disconnect();
    };
  }, [instance, fitAddon]);


  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    writeOutput: writeToTerminal,
    prompt: () => { },
    saveCommandResponseHistory: () => '',
    focusTerminal: () => {
      const term = instance; // Use instance
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
  }), [writeToTerminal, instance, activityMediator]); // Use instance in dependencies

  useEffect(() => {
    logger.debug('Window setNextTutorial effect triggered.');
    window.setNextTutorial = (tutorialKey: string | null) => {
      const tutorial = tutorialKey ? GamePhrases.getGamePhraseByKey(tutorialKey) : null;
      tutorialSignal.value = tutorial;
    };
    window.ActivityType = ActivityType;
  }, []);

  const getStoredContent = useCallback((): string => {
    logger.debug('getStoredContent called.');
    const content = localStorage.getItem(StorageKeys.editContent);
    if (content == null) {
       logger.debug('getStoredContent: No content found in localStorage.');
       return '';
    }
    try {
      const parsed = JSON.parse(content);
      logger.debug('getStoredContent: Content parsed successfully.');
      return parsed ?? '';
    } catch (error) {
      logger.error('Failed to parse edit content:', error);
      return '';
    }
  }, []);

  // Define toggleVideoCallback using useCallback
  const toggleVideoCallback = useCallback(() => {
    logger.debug('toggleVideoCallback called.');
    isShowVideoSignal.value = !isShowVideoSignal.value;
    return isShowVideoSignal.value;
  }, []); // No dependencies needed if it only uses signals

  // Memoize the editor component with stable dependencies
  const editorComponent = useMemo(() => {
    logger.debug("Memoizing MonacoCore (Editor) component instance");
    return (
      <MonacoCore
        key={ActivityType.EDIT} // Use a constant key
        value={getStoredContent()}
        language="markdown"
        toggleVideo={toggleVideoCallback} // Pass the stable callback
      />
    );
    // Dependencies are stable callbacks/values
  }, [getStoredContent, toggleVideoCallback]);

  // NEW: Test-specific flag to force editor rendering
  const forceEditActivity = (window as any).__FORCE_EDIT_ACTIVITY__ === true;
  logger.debug(`HandTermWrapper rendering with activity: ${currentActivityValue}, forceEditActivity: ${forceEditActivity}`);
  // END NEW

  return (
    <div id='handterm-wrapper' data-testid='handterm-wrapper'>
      {currentActivityValue === ActivityType.GAME && (
        <Game
          ref={gameHandleRef}
          canvasHeight={canvasHeight}
          canvasWidth={props.terminalWidth}
        />
      )}
      {currentActivityValue === ActivityType.GAME && (
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
      {currentActivityValue === ActivityType.TUTORIAL && tutorialSignal.value != null && (
        <TutorialManager
          tutorial={tutorialSignal.value}
        />
      )}

      {/* ENHANCED: Terminal Visibility Logic - Always render, control with visibility */}
      <div
        id="prompt-and-terminal"
        style={{
          visibility: (currentActivityValue !== ActivityType.EDIT && currentActivityValue !== ActivityType.TREE && !forceEditActivity) ? 'visible' : 'hidden',
          height: '100%',
          width: '100%'
        }}
      >
        <PromptHeader
          username={userName ?? 'guest'}
          domain={domain ?? 'handterm.com'}
          githubUsername={githubUsername}
          timestamp={getTimestamp(commandTime.value)}
        />
        <div
          ref={xtermRef}
          id="xtermRef"
          style={{
            height: '100%',
            width: '100%',
          }}
        />
      </div>
      {/* END ENHANCED */}

      {/* Render editor only when activity is EDIT or forceEditActivity is true */}
      {(currentActivityValue === ActivityType.EDIT || forceEditActivity) &&
        ((() => { logger.debug("Rendering Memoized MonacoCore (Editor)"); return true; })()) &&
        editorComponent // Use the memoized component
      }
      {/* Render tree view only when activity is TREE */}
      {currentActivityValue === ActivityType.TREE && treeItems.length > 0 &&
        ((() => { logger.debug("Rendering MonacoCore (Tree)"); return true; })()) &&
        <MonacoCore
          key={ActivityType.TREE} // Use a constant key
          value="" // Tree view doesn't need initial value from storage
          language="plaintext"
          // No toggleVideo needed for tree view? If needed, add the callback
        />
      }
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
