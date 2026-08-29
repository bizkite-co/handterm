import { render, act, screen } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useRef } from 'react';
import { useMonacoTerminal } from './useMonacoTerminal';
import { commandLineSignal, setCommandLine } from '../signals/commandLineSignals';
import { gamePhraseSignal } from '../signals/gameSignals';
import { type GamePhrase } from '@handterm/types';
import NextCharsDisplay from '../components/NextCharsDisplay';

vi.mock('monaco-vim', () => ({
  default: {
    initVimMode: vi.fn().mockReturnValue({
      dispose: vi.fn()
    })
  }
}));

vi.mock('monaco-editor/esm/vs/editor/editor.api', () => ({
  editor: {
    createModel: vi.fn(() => ({})),
    create: vi.fn(),
  },
  KeyCode: {},
  EditorOption: { fontInfo: 49 },
}));

// Keep the terminal hook focused on adapter behavior: mock the downstream
// command/typing hooks so only the terminal adapter itself is under test.
vi.mock('./useCommand', () => ({
  useCommand: () => ({
    handleCommand: vi.fn(() => Promise.resolve()),
    commandHistory: [],
    commandHistoryIndex: -1,
    setCommandHistoryIndex: vi.fn(),
    commandHistoryFilter: null,
  }),
}));

vi.mock('./useWPMCaculator', () => ({
  useWPMCalculator: () => ({
    addKeystroke: vi.fn(),
    getWPMs: () => ({ wpmAverage: 0, charWpms: [] }),
    clearKeystrokes: vi.fn(),
  }),
}));

vi.mock('./useCharacterHandler', () => ({
  useCharacterHandler: () => ({
    handleCharacter: vi.fn(),
  }),
}));

vi.mock('../components/Timer', () => ({ default: () => null }));
vi.mock('../components/ErrorDisplay', () => ({ default: () => null }));

interface MockModel {
  _value: string;
  getValue: () => string;
  setValue: (value: string) => void;
  getLanguageId: () => string;
  getLineCount: () => number;
  getLineContent: () => string;
  getLineMaxColumn: () => number;
}

interface PressedFunction {
  browserEvent: { key: string; length: number };
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  keyCode: number;
  preventDefault: () => void;
  stopPropagation: () => void;
}

function createEditorMock(model: MockModel, keyDownHandlers: ((e: PressedFunction) => void)[]) {
  const editor = {
    getModel: vi.fn(() => model),
    setModel: vi.fn(),
    setPosition: vi.fn(),
    revealLine: vi.fn(),
    focus: vi.fn(),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: model._value.length + 1 })),
    onKeyDown: vi.fn((handler: (e: PressedFunction) => void) => {
      keyDownHandlers.push(handler);
      return { dispose: vi.fn() };
    }),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    onMouseDown: vi.fn(() => ({ dispose: vi.fn() })),
    getContainerDomNode: vi.fn(() => ({ clientHeight: 200, clientWidth: 400 })),
    getOption: vi.fn(() => ({ lineHeight: 19, typicalHalfwidthCharacterWidth: 8 })),
    getLineContent: vi.fn(),
  };
  return editor;
}

const adapterRef = { current: null as ReturnType<typeof useMonacoTerminal> | null };
const keyDownHandlers: ((e: PressedFunction) => void)[] = [];

const model = {
  _value: '',
  getValue: () => model._value,
  setValue: (value: string) => {
    model._value = value;
  },
  getLanguageId: () => 'plaintext',
  getLineCount: () => 1,
  getLineContent: () => model._value,
  getLineMaxColumn: () => model._value.length + 1,
};

function pressKey(key: string) {
  const handler = keyDownHandlers[0];
  const event: PressedFunction = {
    browserEvent: { key, length: 1 },
    ctrlKey: false,
    metaKey: false,
    altKey: false,
    keyCode: 0,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  handler(event);
}

const firstPhrase: GamePhrase = {
  key: 'first-eight',
  displayAs: 'Game',
  value: 'all sad lads ask dad; alas fads fall',
  tutorialGroup: 'single-click',
};

function FullGameHarness() {
  const modeRef = useRef<string>('insert');
  const vimInstanceRef = useRef<{ dispose: () => void } | null>(null);
  adapterRef.current = useMonacoTerminal(createEditorMock(model, keyDownHandlers) as never, modeRef, vimInstanceRef);
  return (
    <NextCharsDisplay isInPhraseMode={true} onPhraseSuccess={vi.fn()} onError={vi.fn()} />
  );
}

function assertAdapter() {
  expect(adapterRef.current).not.toBeNull();
  return adapterRef.current as ReturnType<typeof useMonacoTerminal>;
}

describe('useMonacoTerminal level-transition reset contract', () => {
  beforeEach(() => {
    model._value = '';
    commandLineSignal.value = '';
    gamePhraseSignal.value = null;
    adapterRef.current = null;
    keyDownHandlers.length = 0;
  });

  test('clear() empties the model but leaves the command line stale', () => {
    render(<FullGameHarness />);
    const adapter = assertAdapter();
    setCommandLine('first-eight');

    adapter.clear();

    expect(model._value).toBe('');
    // This is the bug the old level-completion path hit: the previous phrase
    // is still in the signal, so the next level's keystrokes get prepended to it.
    expect(commandLineSignal.value).toBe('first-eight');
  });

  test('resetPrompt() restores the "> " prompt AND clears the command line', () => {
    render(<FullGameHarness />);
    const adapter = assertAdapter();
    setCommandLine('first-eight');

    adapter.resetPrompt();

    expect(model._value).toBe('> ');
    expect(commandLineSignal.value).toBe('');
  });

  test('real keystrokes shrink nextChars after a level transition', async () => {
    await act(async () => {
      gamePhraseSignal.value = firstPhrase;
    });
    render(<FullGameHarness />);
    const adapter = assertAdapter();

    // During the level the command line grows and nextChars shrinks
    await act(async () => {
      pressKey('a');
    });
    expect(commandLineSignal.value).toBe('a');
    expect(screen.getByText('ll sad lads ask dad; alas fads fall')).toBeInTheDocument();
    expect(screen.queryByText('all sad lads ask dad; alas fads fall')).not.toBeInTheDocument();

    await act(async () => {
      pressKey('l');
    });
    expect(commandLineSignal.value).toBe('al');
    expect(screen.getByText('l sad lads ask dad; alas fads fall')).toBeInTheDocument();

    // Level transition: reset the prompt AND the command line, so the next
    // level starts typing cleanly (this is what handlePhraseSuccess does).
    await act(async () => {
      adapter.resetPrompt();
    });
    expect(commandLineSignal.value).toBe('');
    expect(model._value).toBe('> ');

    // After the transition the SAME keystrokes must shrink the new phrase.
    // At real typing speed each key event flushes React effects before the
    // next keystroke, so each key is fired and flushed individually.
    await act(async () => {
      pressKey('a');
    });
    expect(commandLineSignal.value).toBe('a');
    expect(screen.getByText('ll sad lads ask dad; alas fads fall')).toBeInTheDocument();

    await act(async () => {
      pressKey('l');
    });
    expect(commandLineSignal.value).toBe('al');
    expect(screen.getByText('l sad lads ask dad; alas fads fall')).toBeInTheDocument();
  });
});