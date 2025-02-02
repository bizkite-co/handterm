import { useComputed, useSignalEffect } from '@preact/signals-react';
import {
  useState,
  useRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useMemo,
  forwardRef,
} from 'react';

import { commandLineSignal } from 'src/signals/commandLineSignals';
import { setCompletedGamePhrase } from 'src/signals/gameSignals';
import { type GamePhrase } from '@handterm/types/Types';
import * as GamePhrases from 'src/utils/GamePhrases';
import { parseLocation } from 'src/utils/navigationUtils';

import { TerminalCssClasses } from '../types/TerminalTypes';
import { Phrase } from '../utils/Phrase';

import ErrorDisplay from './ErrorDisplay';
import Timer, { type TimerHandle } from './Timer';
import { createSafeCaller, isNullOrEmptyString } from 'src/utils/typeSafetyUtils';

export interface INextCharsDisplayProps {
    isInPhraseMode: boolean;
    onPhraseSuccess: (phrase: GamePhrase | null) => void;
    onError: (error: number | undefined) => void;
}

export interface NextCharsDisplayHandle {
    resetTimer: () => void;
    cancelTimer: () => void;
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
    const safeTimerCaller = createSafeCaller(timerRef);
    const wpmRef = useRef<HTMLSpanElement>(null);
    const commandLine = useComputed(() => commandLineSignal.value);

    // Memoize location parsing to prevent unnecessary re-renders
    const currentLocation = useMemo(() => parseLocation(), []);

    const getFirstNonMatchingChar = useCallback((stringBeingTested: string): number => {
        if (isNullOrEmptyString(_phrase.value)) return 0;
        const sourcePhrase = _phrase.value;
        const sourcePhraseString = sourcePhrase.join('');
        if (stringBeingTested === sourcePhraseString) return sourcePhraseString.length;
        if (isNullOrEmptyString(stringBeingTested)) {
            return 0;
        }
        let result = 0;
        for (let i = 0; i < stringBeingTested.length; i++) {
            if (typeof sourcePhrase === 'string' && stringBeingTested[i] !== sourcePhrase[i]) {
                return i;
            }
            result++;
        }
        return result;
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

    const handleSuccess = useCallback(() => {
        setMismatchedChar('');
        setMismatchedIsVisible(false);
        setNextChars('');
        if (
            _gamePhrase !== null &&
            _gamePhrase !== undefined &&
            _gamePhrase.key !== null &&
            _gamePhrase.key !== undefined
        ) {
            setCompletedGamePhrase(_gamePhrase.key);
        }
        onPhraseSuccess(_gamePhrase);
    }, [_gamePhrase, onPhraseSuccess]);

    const stopTimer = useCallback(() => {
        safeTimerCaller('stop');
    }, [safeTimerCaller]);

    const startOrContinueTimer = useCallback(() => {
        safeTimerCaller('start');
    }, [safeTimerCaller]);

    const resetTimer = useCallback(() => {
        safeTimerCaller('reset');
    }, [safeTimerCaller]);

    const cancelTimer = useCallback(() => {
        safeTimerCaller('reset');
        if (nextCharsRef.current !== null && nextCharsRef.current !== undefined) {
            nextCharsRef.current.innerText = _phrase.value.join('');
        }
    }, [_phrase.value, safeTimerCaller]);

    const handleCommandLineChange = useCallback((stringBeingTested: string) => {
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
            return;
        }

        if (stringBeingTested === _phrase.value.join('').trim().substring(0, stringBeingTested.length)) {
            hideError();
        } else {
            const firstNonMatchingChar = getFirstNonMatchingChar(stringBeingTested);
            const mismatchedChar = _phrase.value[firstNonMatchingChar];
            setMismatchedIsVisible(true);
            setMismatchedChar(mismatchedChar ?? null); // Provide default value of null
            showError(mismatchedChar ?? '', firstNonMatchingChar); // Provide default value of empty string
        }

        if (stringBeingTested.trim() === _phrase.value.join('').trim()) {
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
        cancelTimer
    }), [resetTimer, cancelTimer]);

    // Optimize useEffect to only run when content key changes
    useEffect(() => {
        const { activityKey, contentKey } = currentLocation;
        if (activityKey === null || activityKey === undefined ||isNullOrEmptyString(contentKey)) return;

        const foundPhrase = GamePhrases.default.getGamePhraseByKey(contentKey);
        if (foundPhrase === null || foundPhrase === undefined) return;

        // Prevent unnecessary state updates
        setGamePhrase(prevPhrase =>
            prevPhrase?.key === foundPhrase.key ? prevPhrase : foundPhrase
        );
        //TODO: Check if we can use the Chord.tsx here.
        //INFO: This is the only place the Phrase.ts is still used.
        setPhrase(new Phrase(foundPhrase.value.split('')));
        setNextChars(foundPhrase.value);
    }, [currentLocation, currentLocation.contentKey]);

    // Optimize signal effect to prevent unnecessary re-renders
    useSignalEffect(() => {
        const commandLineValue = commandLine.value;
        handleCommandLineChange(commandLineValue);
    });

    return (
        (currentLocation !== null && currentLocation !== undefined && !isNullOrEmptyString(currentLocation.contentKey) &&
            <div
                id={TerminalCssClasses.NextChars}
                hidden={!isInPhraseMode}
            >
                {_mismatchedChar !== null && _mismatchedChar !== '' && _mismatchedIsVisible && (
                    <ErrorDisplay
                        isVisible={_mismatchedIsVisible}
                        mismatchedChar={_mismatchedChar ?? ''}
                    />
                )}
                <Timer ref={timerRef} />
                <div id={TerminalCssClasses.NextCharsRate} ref={nextCharsRateRef}></div>
                <span id={TerminalCssClasses.WPM} ref={wpmRef}></span>
                <pre id={TerminalCssClasses.NextChars} ref={nextCharsRef}>
                    {_nextChars}
                </pre>
            </div>
        )
    );
});

NextCharsDisplay.displayName = 'NextCharsDisplay';

export default NextCharsDisplay;
