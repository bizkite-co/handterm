import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState, useMemo } from 'react';
import { useComputed } from '@preact/signals-react';
import { Game, type IGameHandle } from '../game/Game';
import { useActivityMediator } from '../hooks/useActivityMediator';
import MonacoTerminal from './MonacoTerminal'; // Changed to default import
import { useWPMCalculator } from '../hooks/useWPMCaculator';
import { isShowVideoSignal, activitySignal, userNameSignal } from '../signals/appSignals';
import { setGamePhrase } from '../signals/gameSignals';
import { tutorialSignal } from '../signals/tutorialSignals';
import {
  type GamePhrase,
  type IHandTermWrapperProps,
  type TreeItem,
  ActivityType,
  StorageKeys,
  type IHandTermWrapperMethods,
  type ITerminalAdapter
} from '@handterm/types';
import { createLogger, LogLevel } from '../utils/Logger';
// Removed: import { navigate } from '../utils/navigationUtils';
import WebCam from '../utils/WebCam';
import GamePhrases from '../utils/GamePhrases';

import { Chord } from './Chord';
import { IntroText } from './IntroText';
import { KeyIndicator } from './KeyIndicator';
import MonacoCore from './MonacoCore';
import NextCharsDisplay, { type NextCharsDisplayHandle } from './NextCharsDisplay';
import { PromptHeader } from './PromptHeader';
import { TutorialManager } from './TutorialManager';
// Removed: import { useMonacoTerminal } from '../hooks/useMonacoTerminal';
import { isInLoginProcessSignal, isInSignUpProcessSignal, isInVerifyProcessSignal } from '../signals/appSignals';

const logger = createLogger({
  prefix: 'HandTermWrapper',
  level: LogLevel.WARN
});

const getTimestamp = (date: Date): string => date.toTimeString().split(' ')[0] ?? '';

const HandTermWrapper = forwardRef<IHandTermWrapperMethods, IHandTermWrapperProps>((props, forwardedRef) => {
  // Removed: const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [terminalAdapter, setTerminalAdapter] = useState<ITerminalAdapter | null>(null); // State to hold the terminal adapter
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
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem(StorageKeys.hasVisited));
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const isAuthProcess = useComputed(() => isInLoginProcessSignal.value || isInSignUpProcessSignal.value || isInVerifyProcessSignal.value);
  const displayUserName = useComputed(() => userNameSignal.value ?? 'guest');
  const [currentTimestamp, setCurrentTimestamp] = useState(() => getTimestamp(new Date()));

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(getTimestamp(new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Mark user as visited so IntroText only shows on first visit
  useEffect(() => {
    if (showIntro) {
      localStorage.setItem(StorageKeys.hasVisited, 'true');
    }
  }, []);

  const activity = useComputed(() => activitySignal.value);
  const currentActivityValue = activity.value;
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
      if (game === null) {
        logger.debug('isGameHandle: gameHandleRef.current is null');
      }
      return game !== null;
    }
  }, [nextCharsDisplayRef, gameHandleRef]);

  const handlePhraseSuccess = useCallback((phrase: GamePhrase | null) => {
    if (phrase === null) return;

    const key = phrase.key?.trim() ?? '';
    const value = phrase.value?.trim() ?? '';
    if (key === '' || value === '') {
      return;
    }
    logger.debug('handlePhraseSuccess called with phrase:', key, 'Activity:', currentActivityValue);
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
      if (game === null) {
        logger.debug('isGameHandle: gameHandleRef.current is null');
      }
      return game !== null;
    }
    handlePhraseComplete();
    terminalAdapter?.clear(); // Use optional chaining
  }, [wpmCalculator, activityMediator, handlePhraseComplete, gameHandleRef, targetWPM, terminalAdapter, currentActivityValue]);

  useEffect(() => {
    if (currentActivityValue === ActivityType.TREE) {
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
  }, [currentActivityValue]);

  useEffect(() => {
    const isTerminalRelevantActivity = currentActivityValue === ActivityType.NORMAL;

    if (isTerminalRelevantActivity) {
      setTimeout(() => {
        try {
          terminalAdapter?.focus(); // Use optional chaining
        } catch (error) {
          logger.error('Terminal focus error', { error });
        }
      }, 50);
    }
  }, [currentActivityValue, terminalAdapter]);

  const handlePhraseErrorState = useCallback((errorIndex: number | undefined) => {
    setErrorCharIndex(errorIndex);
  }, []);

  useImperativeHandle(forwardedRef, () => ({
    writeOutput: (output: string) => {
      terminalAdapter?.write(output); // Use optional chaining
      setShowIntro(false);
    },
    prompt: () => { },
    saveCommandResponseHistory: () => '',
    focusTerminal: () => terminalAdapter?.focus(), // Use optional chaining
    handleCharacter: () => { },
    refreshComponent: () => { },
    setHeroSummersaultAction: () => { },
    setEditMode: () => { },
    handleEditSave: () => { },
    activityMediator: activityMediator,
  }), [terminalAdapter, activityMediator]);

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

  const toggleVideoCallback = useCallback(() => {
    logger.debug('toggleVideoCallback called.');
    isShowVideoSignal.value = !isShowVideoSignal.value;
    return isShowVideoSignal.value;
  }, []);

  const handleTerminalEnter = useCallback((value: string) => {
    logger.debug(`Terminal received enter with value: ${value}`);
    // Here you would process the command, e.g., send it to a backend or a command handler
    // For now, just write it back to the terminal as an example
    terminalAdapter?.write(`You typed: ${value}\n`);
  }, [terminalAdapter]);

  const editorComponent = useMemo(() => {
    logger.debug("Memoizing MonacoCore (Editor) component instance");
    return (
      <MonacoCore
        key={ActivityType.EDIT}
        value={getStoredContent()}
        language="markdown"
        toggleVideo={toggleVideoCallback}
        mode="editor" // Explicitly set mode
        auth={props.auth}
      />
    );
  }, [getStoredContent, toggleVideoCallback]);

  const treeEditorComponent = useMemo(() => {
    logger.debug("Memoizing MonacoCore (Tree) component instance");
    return (
      <MonacoCore
        key={ActivityType.TREE}
        value=""
        language="plaintext"
        mode="editor" // Tree view is also an editor mode
      />
    );
  }, []);

  const forceEditActivity = window.__FORCE_EDIT_ACTIVITY__ === true;
  logger.debug(`HandTermWrapper rendering with activity: ${currentActivityValue}, forceEditActivity: ${forceEditActivity}`);

  return (
    <div id='handterm-wrapper' data-testid='handterm-wrapper'>
      {showIntro && <IntroText />}
      {currentActivityValue === ActivityType.GAME && (
        <Game
          ref={gameHandleRef}
          canvasHeight={canvasHeight}
          canvasWidth={props.terminalWidth}
        />
      )}
      {currentActivityValue === ActivityType.GAME && (
        <>
          <NextCharsDisplay
            ref={nextCharsDisplayRef}
            isInPhraseMode={true}
            onPhraseSuccess={handlePhraseSuccess}
            onError={handlePhraseErrorState}
          />
          <KeyIndicator keyType="enter" />
          <KeyIndicator keyType="backspace" />
        </>
      )}
      {lastTypedCharacter !== null && (
        <Chord displayChar={lastTypedCharacter} />
      )}
      {currentActivityValue === ActivityType.TUTORIAL && tutorialSignal.value != null && (
        <TutorialManager
          tutorial={tutorialSignal.value}
        />
      )}

      <div
        id="prompt-and-terminal"
        style={{
          display: (currentActivityValue !== ActivityType.EDIT && currentActivityValue !== ActivityType.TREE && !forceEditActivity) ? 'block' : 'none',
          height: '100%',
          width: '100%'
        }}
      >
        {!isAuthProcess.value && (
          <PromptHeader
            username={displayUserName.value}
            domain={domain ?? 'handterm.com'}
            githubUsername={githubUsername}
            timestamp={currentTimestamp}
          />
        )}
        <MonacoTerminal onTerminalReady={setTerminalAdapter} onEnter={handleTerminalEnter} />
      </div>

      {(currentActivityValue === ActivityType.EDIT || forceEditActivity) &&
        editorComponent
      }
      {currentActivityValue === ActivityType.TREE && treeItems.length > 0 &&
        treeEditorComponent
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
