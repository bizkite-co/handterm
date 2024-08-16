import { TerminalCssClasses } from "../types/TerminalTypes.js";

import React, { useState, useEffect, useRef, useImperativeHandle } from 'react';
import Timer from './Timer'; // Import the React component
import ErrorDisplay from "./ErrorDisplay";
import { Phrase } from "../utils/Phrase.js";

export interface NextCharsDisplayProps {
    commandLine: string;
    isInPhraseMode: boolean;
    newPhrase: string;
    onPhraseSuccess: (phrase: string) => void;
    onError: (error: number | undefined) => void;
}


export interface NextCharsDisplayHandle {
    resetTimer: () => void;
    cancelTimer: () => void;
}

const NextCharsDisplay = React.forwardRef<NextCharsDisplayHandle, NextCharsDisplayProps>(({
    commandLine,
    isInPhraseMode,
    newPhrase,
    onPhraseSuccess,
    onError
}, ref) => {
    useImperativeHandle(ref, () => ({
        resetTimer,
        cancelTimer
    }));

    const [mismatchedChar, setMismatchedChar] = useState<string | null>(null);
    const [mismatchedIsVisible, setMismatchedIsVisible] = useState(false);
    const [nextChars, setNextChars] = useState(newPhrase);
    const [phrase, setPhrase] = useState(new Phrase(newPhrase.split('')));

    const nextCharsRef = useRef<HTMLPreElement>(null);
    const nextCharsRateRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<any>(null);
    const wpmRef = useRef<HTMLSpanElement>(null);

    const nextCharsLength = 60;

    useEffect(() => {
        if (isInPhraseMode) {
            setPhrase(new Phrase(newPhrase.split('')));
        }
    }, [isInPhraseMode, newPhrase]);

    useEffect(() => {
        const nextChars = getNextCharacters(commandLine);
        setNextChars(nextChars);
        handleCommandLineChange(commandLine);
    }, [commandLine]);

    const handleCommandLineChange = (newCommandLine: string) => {
        testInput(newCommandLine);
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
        onPhraseSuccess(phrase.value.join(''));
    };

    const stopTimer = () => {
        if (timerRef.current) {
            timerRef.current.stop();
        }
    };

    const startTimer = () => {
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
        if (nextCharsRef.current) nextCharsRef.current.innerText = phrase.value.join('');
    };


    const getNextCharacters = (stringBeingTested: string): string => {
        const nextIndex = getFirstNonMatchingChar(stringBeingTested);
        const nextChars = phrase.value.join('').substring(nextIndex, nextIndex + nextCharsLength);
        return nextChars || stringBeingTested.substring(nextIndex, nextIndex + nextCharsLength);
    };

    const setNext = (testPhrase: string): HTMLElement | null => {
        const nextIndex = getFirstNonMatchingChar(testPhrase);
        if (nextIndex < 0) {
            return null;
        }

        if (nextIndex > phrase.value.length - 1) {
            return null;
        }

        setNextChars(getNextCharacters(testPhrase));

        const nextChordHTML = phrase.chordsHTML[nextIndex] as HTMLElement;

        return nextChordHTML;
    };


    const testInput = (stringBeingTested: string) => {
        startTimer();

        const nextChordHTML = setNext(stringBeingTested);
        if (nextChordHTML) {
            nextChordHTML.classList.remove("error");
        }

        if (stringBeingTested.length === 0) {
            cancelTimer();
            return;
        }

        if (stringBeingTested === phrase.value.join('').trim().substring(0, stringBeingTested.length)) {
            hideError();
        } else {
            const firstNonMatchingChar = getFirstNonMatchingChar(stringBeingTested);
            const mismatchedChar = phrase.value[firstNonMatchingChar];
            setMismatchedIsVisible(true);
            setMismatchedChar(mismatchedChar);
            showError(mismatchedChar, firstNonMatchingChar);
        }

        if (stringBeingTested.trim() === phrase.value.join('').trim()) {
            stopTimer();
            handleSuccess();
            return;
        }
    };

    const getFirstNonMatchingChar = (stringBeingTested: string): number => {
        if (!phrase.value) return 0;
        const sourcePhrase = phrase.value;
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

    return (
        <div
            id="next-chars" 
            hidden={!isInPhraseMode} 
        >
            {mismatchedChar && (
                <ErrorDisplay
                    isVisible={mismatchedIsVisible}
                    mismatchedChar={mismatchedChar}
                />
            )}
            <Timer ref={timerRef} />
            <div id={TerminalCssClasses.NextCharsRate || 'next-chars-rate'} ref={nextCharsRateRef}></div>
            <span id={TerminalCssClasses.WPM || 'wpm'} ref={wpmRef}></span>
            <pre id={TerminalCssClasses.NextChars || 'next-chars'} ref={nextCharsRef}>
                {nextChars}
            </pre>
        </div>
    );
});

export default NextCharsDisplay;
