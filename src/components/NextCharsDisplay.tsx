import { TerminalCssClasses } from "../types/TerminalTypes";

import React, { useState, useRef, useImperativeHandle } from 'react';
import Timer, { TimerHandle } from './Timer';
import ErrorDisplay from "./ErrorDisplay";
import { Phrase } from "../utils/Phrase";
import { commandLineSignal } from "src/signals/commandLineSignals";
import { useComputed, useSignalEffect } from "@preact/signals-react";
import { gamePhraseSignal, setCompletedGamePhrase } from "src/signals/gameSignals";
import { GamePhrase } from "src/types/Types";
import { useReactiveLocation } from "src/hooks/useReactiveLocation";
import * as GamePhrases from "src/utils/GamePhrases";

export interface INextCharsDisplayProps {
    isInPhraseMode: boolean;
    onPhraseSuccess: (phrase: GamePhrase | null) => void;
    onError: (error: number | undefined) => void;
}

export interface NextCharsDisplayHandle {
    resetTimer: () => void;
    cancelTimer: () => void;
}

const NextCharsDisplay = React.forwardRef<NextCharsDisplayHandle, INextCharsDisplayProps>(({
    isInPhraseMode,
    onPhraseSuccess,
    onError
}, ref) => {
    useImperativeHandle(ref, () => ({
        resetTimer,
        cancelTimer
    }));

    const [_mismatchedChar, setMismatchedChar] = useState<string | null>(null);
    const [_mismatchedIsVisible, setMismatchedIsVisible] = useState(false);
    const [_nextChars, setNextChars] = useState<string>('');
    const [_phrase, setPhrase] = useState<Phrase>(new Phrase(['']));
    const [_gamePhrase, setGamePhrase] = useState<GamePhrase | null>(null);

    const nextCharsRef = useRef<HTMLPreElement>(null);
    const nextCharsRateRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<TimerHandle>(null);
    const wpmRef = useRef<HTMLSpanElement>(null);
    const commandLine = useComputed(() => commandLineSignal.value);
    const { parseLocation } = useReactiveLocation();

    React.useEffect(() => {
        if (!parseLocation().activityKey || !parseLocation().contentKey) return;
        const foundPhrase = GamePhrases.default.getGamePhraseByKey(parseLocation().contentKey ?? '');
        if (!foundPhrase) return;
        setGamePhrase(foundPhrase);
        setPhrase(new Phrase(foundPhrase.value.split('')));
        setNextChars(foundPhrase.value);
    }, [window.location.pathname]);

    useSignalEffect(() => {
        // every time the command line changes.
        handleCommandLineChange(commandLine.value);
    });

    const handleCommandLineChange = (stringBeingTested: string) => {
        startOrContinueTimer();

        const nextIndex = getFirstNonMatchingChar(stringBeingTested);
        if (nextIndex < 0) {
            return null;
        }

        if (nextIndex > _phrase.value.length) {
            return null;
        }

        const nextChordHTML = _phrase.chordsHTML[nextIndex] as HTMLElement | undefined;

        if (nextChordHTML) {
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
            setMismatchedChar(mismatchedChar);
            showError(mismatchedChar, firstNonMatchingChar);
        }

        if (stringBeingTested.trim() === _phrase.value.join('').trim()) {
            stopTimer();
            handleSuccess();
            return;
        }

        const nextCharactersString = getNextCharacters(stringBeingTested);
        // TODO: figure out a better way to handle initial value.
        setNextChars(nextCharactersString);
    };

    const getNextCharacters = (stringBeingTested: string): string => {
        const nextIndex = getFirstNonMatchingChar(stringBeingTested);
        const result = _phrase.value.join('').substring(nextIndex);
        return result;
    };

    const getFirstNonMatchingChar = (stringBeingTested: string): number => {
        if (!_phrase.value) return 0;
        const sourcePhrase = _phrase.value;
        const sourcePhraseString = sourcePhrase.join('');
        if (stringBeingTested === sourcePhraseString) return sourcePhraseString.length;
        if (!stringBeingTested || stringBeingTested.length === 0) {
            return 0;
        }
        let result = 0;
        for (let i = 0; i < stringBeingTested.length; i++) {
            if (stringBeingTested[i] !== sourcePhrase[i]) {
                return i;
            }
            result++;
        }
        return result;
    };

    const showError = (char: string, charIndex: number) => {
        setMismatchedChar(char);
        setMismatchedIsVisible(true);
        onError(charIndex);
    };

    const hideError = () => {
        setMismatchedChar(null);
        setMismatchedIsVisible(false);
        onError(undefined);
    };

    const handleSuccess = () => {
        setMismatchedChar('');
        setMismatchedIsVisible(false);
        setNextChars('');
        if (_gamePhrase && _gamePhrase.key) setCompletedGamePhrase(_gamePhrase.key)
        onPhraseSuccess(_gamePhrase);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            timerRef.current.stop();
        }
    };

    const startOrContinueTimer = () => {
        if (timerRef.current) {
            timerRef.current.start();
        }
    };

    const resetTimer = () => {
        if (timerRef.current) {
            timerRef.current.reset();
        }
    };

    const cancelTimer = () => {
        if (timerRef.current) {
            timerRef.current.reset();
        }
        if (nextCharsRef.current) nextCharsRef.current.innerText = _phrase.value.join('');
    };

    return (
        (parseLocation().contentKey &&
            <div
                id={TerminalCssClasses.NextChars}
                hidden={!isInPhraseMode}
            >
                {_mismatchedChar && _mismatchedIsVisible && (
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

export default NextCharsDisplay;
