import { useComputed, useSignalEffect } from '@preact/signals-react';
import {
    useState,
    useRef,
    useImperativeHandle,
    useCallback,
    forwardRef,
} from 'react';

import { commandLineSignal } from 'src/signals/commandLineSignals';
import { gamePhraseSignal, setCompletedGamePhrase } from 'src/signals/gameSignals';
import { type GamePhrase } from '@handterm/types';
import { TerminalCssClasses } from '@handterm/types';

import { Phrase } from '../utils/Phrase';

import ErrorDisplay from './ErrorDisplay';
import Timer, { type TimerHandle } from './Timer';
import { isNullOrEmptyString } from 'src/utils/typeSafetyUtils';

export interface INextCharsDisplayProps {
    isInPhraseMode: boolean;
    onPhraseSuccess: (phrase: GamePhrase | null) => void;
    onError: (error: number | undefined) => void;
}

export interface NextCharsDisplayHandle {
    resetTimer: () => void;
    cancelTimer: () => void;
    /** Drop the current phrase from state and the DOM so it cannot flash back. */
    clearPhrase: () => void;
}

const NextCharsDisplay = forwardRef<NextCharsDisplayHandle, INextCharsDisplayProps>(({
    isInPhraseMode,
    onPhraseSuccess,
    onError
}, ref) => {
    const [_mismatchedChar, setMismatchedChar] = useState<string | null>(null);
    const [_mismatchedIsVisible, setMismatchedIsVisible] = useState(false);
    const [_nextChars, setNextChars] = useState<string>('');
    const [_phrase, setPhrase] = useState<Phrase>(new Phrase(['']));
    const [_gamePhrase, setGamePhrase] = useState<GamePhrase | null>(null);

    const nextCharsRef = useRef<HTMLPreElement>(null);
    const nextCharsRateRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<TimerHandle>(null);

    // Create a specialized caller for timerRef

    const wpmRef = useRef<HTMLSpanElement>(null);
    const commandLine = useComputed(() => commandLineSignal.value);

    // The mediator sets gamePhraseSignal on every level transition, so it is
    // the source of truth here (the URL key can change without a re-render).
    const gamePhrase = useComputed(() => gamePhraseSignal.value);

    const getFirstNonMatchingChar = useCallback((stringBeingTested: string): number => {
        if (isNullOrEmptyString(_phrase.value)) return 0;
        const sourcePhrase = _phrase.value;
        const sourcePhraseString = sourcePhrase.join('');
        if (stringBeingTested === sourcePhraseString) return sourcePhraseString.length;
        if (isNullOrEmptyString(stringBeingTested)) {
            return 0;
        }
        // sourcePhrase is a character ARRAY, so the mismatch check must compare
        // the typed character against sourcePhrase[i] directly. (A `typeof
        // sourcePhrase === 'string'` guard here would never fire and would make
        // this always return the typed length — the "moves along with junk" bug.)
        for (let i = 0; i < stringBeingTested.length; i++) {
            if (stringBeingTested[i] !== sourcePhrase[i]) {
                return i;
            }
        }
        return stringBeingTested.length;
    }, [_phrase.value]);

    const getNextCharacters = useCallback((stringBeingTested: string): string => {
        const nextIndex = getFirstNonMatchingChar(stringBeingTested);
        const result = _phrase.value.join('').substring(nextIndex);
        return result;
    }, [_phrase.value, getFirstNonMatchingChar]);

    const showError = useCallback((char: string, charIndex: number) => {
        setMismatchedChar(char);
        setMismatchedIsVisible(true);
        onError(charIndex);
    }, [onError]);

    const hideError = useCallback(() => {
        setMismatchedChar(null);
        setMismatchedIsVisible(false);
        onError(undefined);
    }, [onError]);

    const clearPhraseState = useCallback(() => {
        setMismatchedChar('');
        setMismatchedIsVisible(false);
        setNextChars('');
        setPhrase(new Phrase(['']));
        setGamePhrase(null);
        if (nextCharsRef.current !== null && nextCharsRef.current !== undefined) {
            nextCharsRef.current.innerText = '';
        }
    }, []);

    const handleSuccess = useCallback(() => {
        const completed = _gamePhrase;
        clearPhraseState();
        if (
            completed !== null &&
            completed !== undefined &&
            completed.key !== null &&
            completed.key !== undefined
        ) {
            setCompletedGamePhrase(completed.key);
        }
        onPhraseSuccess(completed);
    }, [_gamePhrase, onPhraseSuccess, clearPhraseState]);

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            timerRef.current.stop();
        }
    }, []);

    const startOrContinueTimer = useCallback(() => {
        if (timerRef.current) {
            timerRef.current.start();
        }
    }, []);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            timerRef.current.reset();
        }
    }, []);

    const cancelTimer = useCallback(() => {
        if (timerRef.current) {
            timerRef.current.reset();
        }
    }, []);

    const handleCommandLineChange = useCallback((stringBeingTested: string) => {
        const phraseText = _phrase.value.join('');
        if (phraseText.trim() === '') {
            return;
        }

        startOrContinueTimer();

        const nextIndex = getFirstNonMatchingChar(stringBeingTested);
        if (nextIndex < 0 || nextIndex > _phrase.value.length) {
            return null;
        }

        const nextChordHTML = _phrase.chordsHTML[nextIndex];

        if (nextChordHTML !== null && nextChordHTML !== undefined) {
            nextChordHTML.classList.remove("error");
        }

        if (stringBeingTested.length === 0) {
            cancelTimer();
            setNextChars(phraseText);
            return;
        }

        if (stringBeingTested === phraseText.trim().substring(0, stringBeingTested.length)) {
            hideError();
        } else {
            const firstNonMatchingChar = getFirstNonMatchingChar(stringBeingTested);
            const mismatchedChar = _phrase.value[firstNonMatchingChar];
            setMismatchedIsVisible(true);
            setMismatchedChar(mismatchedChar ?? null); // Provide default value of null
            showError(mismatchedChar ?? '', firstNonMatchingChar); // Provide default value of empty string
        }

        if (stringBeingTested.trim() === phraseText.trim()) {
            stopTimer();
            handleSuccess();
            return;
        }

        const nextCharactersString = getNextCharacters(stringBeingTested);
        setNextChars(nextCharactersString);
        return;
    }, [
        startOrContinueTimer,
        getFirstNonMatchingChar,
        _phrase.value,
        _phrase.chordsHTML,
        cancelTimer,
        hideError,
        showError,
        stopTimer,
        handleSuccess,
        getNextCharacters
    ]);

    useImperativeHandle(ref, () => ({
        resetTimer,
        cancelTimer,
        clearPhrase: clearPhraseState,
    }), [resetTimer, cancelTimer, clearPhraseState]);

    // Load the current phrase whenever the game phrase signal changes.
    // useSignalEffect re-runs when the signal's VALUE changes (a stable
    // useComputed object as a useEffect dep would only fire once).
    useSignalEffect(() => {
        const foundPhrase = gamePhraseSignal.value;
        if (foundPhrase === null || foundPhrase === undefined || isNullOrEmptyString(foundPhrase.value) || foundPhrase.displayAs !== 'Game') {
            setGamePhrase(null);
            setPhrase(new Phrase(['']));
            setNextChars('');
            return;
        }

        // Prevent unnecessary state updates
        setGamePhrase(prevPhrase =>
            prevPhrase?.key === foundPhrase.key ? prevPhrase : foundPhrase
        );
        //TODO: Check if we can use the Chord.tsx here.
        //INFO: This is the only place the Phrase.ts is still used.
        setPhrase(new Phrase(foundPhrase.value.split('')));
        setNextChars(foundPhrase.value);
    });

    // Optimize signal effect to prevent unnecessary re-renders
    useSignalEffect(() => {
        const commandLineValue = commandLine.value;
        handleCommandLineChange(commandLineValue);
    });

    return (
        (gamePhrase.value !== null && gamePhrase.value !== undefined &&
            <div
                id={TerminalCssClasses.nextChars}
                hidden={!isInPhraseMode}
            >
                {_mismatchedChar !== null && _mismatchedChar !== '' && _mismatchedIsVisible && (
                    <ErrorDisplay
                        isVisible={_mismatchedIsVisible}
                        mismatchedChar={_mismatchedChar ?? ''}
                    />
                )}
                <Timer ref={timerRef} />
                <div id={TerminalCssClasses.nextCharsRate} ref={nextCharsRateRef}></div>
                <span id={TerminalCssClasses.wpm} ref={wpmRef}></span>
                <pre id={TerminalCssClasses.nextChars} ref={nextCharsRef}>
                    {_nextChars}
                </pre>
            </div>
        )
    );
});

NextCharsDisplay.displayName = 'NextCharsDisplay';

export default NextCharsDisplay;
