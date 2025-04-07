import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { useComputed } from '@preact/signals-react';
import { Game, type IGameHandle } from '../game/Game';
import { useActivityMediator } from '../hooks/useActivityMediator';
import { useTerminal } from '../hooks/useTerminal';
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { isShowVideoSignal } from '../signals/appSignals';
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

import { Chord } from './Chord';
import MonacoCore from './MonacoCore';
import NextCharsDisplay, { type NextCharsDisplayHandle } from './NextCharsDisplay';
import { PromptHeader } from './PromptHeader';
import { TutorialManager } from './TutorialManager';
import { activitySignal } from '../signals/appSignals'; // Import activitySignal

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.DEBUG
});

const getTimestamp = (date: Date): string => date.toTimeString().split(' ')[0] ?? '';

const HandTermWrapper = forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  const { xtermRef, writeToTerminal, resetPrompt, fitAddon } = useTerminal();
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

  const currentActivityValue = activitySignal.value;
  logger.debug(`HandTermWrapper rendering with activity: ${currentActivityValue}`);

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
    resetPrompt(); // Add resetPrompt here to ensure it's called once
  }, [wpmCalculator, activityMediator, handlePhraseComplete, gameHandleRef, targetWPM, resetPrompt]);

  useEffect(() => {
    if (activitySignal.value === ActivityType.TREE) {
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
  }, [activitySignal.value]);

  // ENHANCED: Terminal Initialization and Visibility Logic
  useEffect(() => {
    const isTerminalRelevantActivity =
      currentActivityValue === ActivityType.NORMAL;

    if (isTerminalRelevantActivity) {
      logger.debug('Terminal Initialization: Preparing terminal for activity', {
        activity: currentActivityValue,
        xtermRefExists: !!xtermRef.current,
        fitAddonExists: !!fitAddon.current
      });

      const initializeTerminal = () => {
        const termContainer = document.getElementById('xtermRef');

        if (termContainer && xtermRef.current && fitAddon.current) {
          try {
            logger.debug('Terminal Initialization: Fitting and focusing');
            fitAddon.current.fit();
            xtermRef.current.focus();
          } catch (error) {
            logger.error('Terminal Initialization Error', { error });
          }
        } else {
          logger.warn('Terminal Initialization: Missing required elements', {
            termContainer: !!termContainer,
            xtermRef: !!xtermRef.current,
            fitAddon: !!fitAddon.current
          });
        }
      };

      // Use requestAnimationFrame for more reliable rendering
      requestAnimationFrame(initializeTerminal);
    }
  }, [currentActivityValue, xtermRef, fitAddon]);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

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

  useEffect(() => {
    window.setNextTutorial = (tutorialKey: string | null) => {
      const tutorial = tutorialKey ? GamePhrases.getGamePhraseByKey(tutorialKey) : null;
      tutorialSignal.value = tutorial;
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

  // Define toggleVideoCallback using useCallback
  const toggleVideoCallback = useCallback(() => {
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

  logger.debug(`Rendering check: Activity=${currentActivityValue}`);
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

      {/* ENHANCED: Terminal Visibility Logic */}
      {currentActivityValue !== ActivityType.EDIT && currentActivityValue !== ActivityType.TREE &&
        ((() => {
          logger.debug("Rendering Terminal Container");
          return true;
        })()) &&
        <div
          id="prompt-and-terminal"
          style={{
            display: 'block',
            visibility: 'visible',
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
              display: 'block',
              visibility: 'visible'
            }}
          />
        </div>
      }

      {/* Render editor only when activity is EDIT */}
      {currentActivityValue === ActivityType.EDIT &&
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
