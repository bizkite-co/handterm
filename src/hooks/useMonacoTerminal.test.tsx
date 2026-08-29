import { render } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { useRef } from 'react';
import { useMonacoTerminal } from './useMonacoTerminal';
import { commandLineSignal, setCommandLine } from '../signals/commandLineSignals';

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
    KeyCode: {},
    EditorOption: { fontInfo: 49 },
  }
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

interface MockModel {
  _value: string;
  getValue: () => string;
  setValue: (value: string) => void;
  getLanguageId: () => string;
  getLineCount: () => number;
  getLineContent: () => string;
  getLineMaxColumn: () => number;
}

function createEditorMock(model: MockModel) {
  const editor = {
    getModel: vi.fn(() => model),
    setModel: vi.fn(),
    setPosition: vi.fn(),
    revealLine: vi.fn(),
    focus: vi.fn(),
    getPosition: vi.fn(() => ({ lineNumber: 1, column: model._value.length + 1 })),
    onKeyDown: vi.fn(() => ({ dispose: vi.fn() })),
    onDidChangeCursorPosition: vi.fn(() => ({ dispose: vi.fn() })),
    onMouseDown: vi.fn(() => ({ dispose: vi.fn() })),
    getContainerDomNode: vi.fn(() => ({ clientHeight: 200, clientWidth: 400 })),
    getOption: vi.fn(() => ({ lineHeight: 19, typicalHalfwidthCharacterWidth: 8 })),
    getLineContent: vi.fn(),
  };
  return editor;
}

const adapterRef = { current: null as ReturnType<typeof useMonacoTerminal> | null };

function Harness() {
  const modeRef = useRef<string>('insert');
  const vimInstanceRef = useRef<{ dispose: () => void } | null>(null);
  adapterRef.current = useMonacoTerminal(createEditorMock(model) as never, modeRef, vimInstanceRef);
  return null;
}

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

function assertAdapter() {
  expect(adapterRef.current).not.toBeNull();
  return adapterRef.current as ReturnType<typeof useMonacoTerminal>;
}

describe('useMonacoTerminal level-transition reset contract', () => {
  beforeEach(() => {
    model._value = '';
    commandLineSignal.value = '';
    adapterRef.current = null;
  });

  test('clear() empties the model but leaves the command line stale', () => {
    render(<Harness />);
    const adapter = assertAdapter();
    setCommandLine('first-eight');

    adapter.clear();

    expect(model._value).toBe('');
    // This is the bug the old level-completion path hit: the previous phrase
    // is still in the signal, so the next level's keystrokes get prepended to it.
    expect(commandLineSignal.value).toBe('first-eight');
  });

  test('resetPrompt() restores the "> " prompt AND clears the command line', () => {
    render(<Harness />);
    const adapter = assertAdapter();
    setCommandLine('first-eight');

    adapter.resetPrompt();

    expect(model._value).toBe('> ');
    expect(commandLineSignal.value).toBe('');
  });
});