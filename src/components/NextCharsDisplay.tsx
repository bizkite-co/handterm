import { TerminalCssClasses } from "../types/TerminalTypes.js";

import React, { useState, useEffect, useRef } from 'react';
import Timer from './Timer.js'; // Import the React component
import ErrorDisplay from "./ErrorDisplay";
import { Phrase } from "../utils/Phrase.js";

interface NextCharsDisplayProps {
    commandLine: string;
    onTimerStatusChange: (isActive: boolean) => void;
    isInPhraseMode: boolean;
    newPhrase: string;
    onPhraseSuccess: (phrase: string) => void;
    onError: (error: number | undefined) => void;
}

interface NextCharsDisplayState {
    isActive: boolean;
    mismatchedChar: string | null;
    mismatchedIsVisible: boolean;
    nextChars: string;
    nextCharsIsVisible: boolean;
    phrase: Phrase;
}

const NextCharsDisplay = React.forwardRef<HTMLDivElement, NextCharsDisplayProps>(({
    commandLine,
    onTimerStatusChange,
    isInPhraseMode,
    newPhrase,
    onPhraseSuccess,
    onError
}, ref) => {
    const [isActive, setIsActive] = useState(false);
    const [mismatchedChar, setMismatchedChar] = useState<string | null>(null);
    const [mismatchedIsVisible, setMismatchedIsVisible] = useState(false);
    const [nextChars, setNextChars] = useState(newPhrase);
    const [phrase, setPhrase] = useState(new Phrase(newPhrase.split('')));

    const nextCharsRef = useRef<HTMLPreElement>(null);
    const nextCharsRateRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<any>(null);
    const voiceSynth = useRef<SpeechSynthesis>(window.speechSynthesis);
    const wpmRef = useRef<HTMLSpanElement>(null);
    const isTestMode = useRef(localStorage.getItem('testMode') === 'true');

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
        setIsActive(false);
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

    const reset = (): void => {
        setNext('');
        if (nextCharsRef.current) nextCharsRef.current.hidden = true;
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

    const cancel = () => {
        if (wpmRef.current) wpmRef.current.innerText = '0';
        setNext('');
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

    const sayText = (e: KeyboardEvent) => {
        const eventTarget = e.target as HTMLInputElement;
        if (!eventTarget || !eventTarget.value) return;
        let text = eventTarget.value;
        const char = e.key;
        if (!char) return;
        if (!voiceSynth.current) {
            voiceSynth.current = window.speechSynthesis;
        }
        if (voiceSynth.current.speaking) {
            voiceSynth.current.cancel();
        }
        if (char?.match(/^[a-z0-9]$/i)) {
            text = char;
        } else if (char === "Backspace") {
            text = "delete";
        } else if (char === "Enter") {
            text = text;
        } else {
            const textSplit = text.trim().split(' ');
            text = textSplit[textSplit.length - 1];
        }
        const utterThis = new SpeechSynthesisUtterance(text);
        utterThis.pitch = 1;
        utterThis.rate = 0.7;
        voiceSynth.current.speak(utterThis);
    };

    return (
        <div id="next-chars" hidden={!isInPhraseMode} ref={ref}>
            {mismatchedChar && (
                <ErrorDisplay
                    isVisible={mismatchedIsVisible}
                    mismatchedChar={mismatchedChar}
                />
            )}
            <Timer ref={timerRef} />
            <div id={TerminalCssClasses.NextCharsRate} ref={nextCharsRateRef}></div>
            <span id={TerminalCssClasses.WPM} ref={wpmRef}></span>
            <pre id={TerminalCssClasses.NextChars} ref={nextCharsRef}>
                {nextChars}
            </pre>
        </div>
    );
};

export default NextCharsDisplay;
