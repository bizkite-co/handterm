import { Chord, spaceDisplayChar, ChordRow, createCharTime, CharTime } from "./types/Types.js";
import { createElement } from "./utils/dom.js";
import { TerminalCssClasses } from "./terminal/TerminalTypes.js";
import { createHTMLElementFromHTML } from "./utils/dom.js";
import { WPMCalculator } from "./terminal/WPMCalculator.js";

import React, { createRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client'; // Import createRoot
import Timer from './Timer.js'; // Import the React component
import { allChords } from "./allChords.js";
import ErrorDisplay from "./ErrorDisplay";
import Phrases from './Phrases';
import { Phrase } from "./Phrase";

interface NextCharsDisplayProps {
    commandLine: string;
    onTimerStatusChange: (isActive: boolean) => void;
    isInPhraseMode: boolean;
    onNewPhrase: (phrase: string) => void;
    onPhraseSuccess: (phrase: string, wpm: number) => void;
}
interface NextCharsDisplayState {
    isActive: boolean;
    mismatchedChar: string;
    mismatchedCharCode: string;
    mismatchedIsVisible: boolean;
    nextChars: string;
    nextCharsIsVisible: boolean;
    phrase: Phrase;
}

export class NextCharsDisplay extends React.Component<NextCharsDisplayProps, NextCharsDisplayState> {


    private _nextChars: HTMLElement;
    private _nextCharsRate: HTMLDivElement;

    private _chordImageHolder: HTMLElement;
    private _svgCharacter: HTMLElement;
    private _testArea: HTMLTextAreaElement;
    private _timerRoot: HTMLElement | null = null;
    private _timerRef: React.RefObject<any>;
    private timerComponentRoot: Root | null = null
    private voiceSynth: SpeechSynthesis;
    private _charTimeArray: CharTime[] = [];
    private _charTimes: HTMLElement;
    private _wpm: HTMLSpanElement;
    private _centiSecond: number = 0;
    public isTestMode: boolean;

    state = {
        mismatchedChar: '',
        mismatchedCharCode: '',
        mismatchedIsVisible: false,
        nextChars: 'Next Chars',
        nextCharsIsVisible: false,
        isActive: false,
        phrase: new Phrase(''),
    }

    private _errorDisplayRef: React.RefObject<any>;
    private _nextCharsLength: number = 60;

    constructor(props: NextCharsDisplayProps) {
        super(props);
        this._errorDisplayRef = createRef();
        this.voiceSynth = window.speechSynthesis as SpeechSynthesis;
        this._nextChars = document.getElementById(TerminalCssClasses.NextChars) as HTMLElement;
        this._nextCharsRate = document.getElementById(TerminalCssClasses.NextCharsRate) as HTMLDivElement;
        this._wpm = createElement('div', TerminalCssClasses.WPM) as HTMLSpanElement;
        this._charTimes = createElement('div', TerminalCssClasses.CharTimes);
        this._chordImageHolder = document.querySelector(`#${TerminalCssClasses.ChordImageHolder}`) as HTMLElement;
        this._svgCharacter = createElement('img', TerminalCssClasses.SvgCharacter);
        this._testArea = (document.getElementById(TerminalCssClasses.TestArea) as HTMLTextAreaElement);
        this.isTestMode = localStorage.getItem('testMode') == 'true';
        this._timerRef = createRef();
        // this._timer = new Timer();
    }

    componentDidMount() {
        this.mountTimer();
        if(this.props.isInPhraseMode) {
            this.setNewPhrase();
        }
    }

    componentDidUpdate(prevProps: NextCharsDisplayProps) {
        if (this.props.isInPhraseMode !== prevProps.isInPhraseMode) {
            if (this.props.isInPhraseMode) {
                this.setNewPhrase();
            }
        }
        // Check if the commandLine prop has changed
        if (this.props.commandLine !== prevProps.commandLine) {
            // Handle the new commandLine prop, for example by setting state
            this.setState({ nextChars: this.getNextCharacters(this.props.commandLine) });

            // Or perform any other actions necessary to respond to the change
            this.handleCommandLineChange(this.props.commandLine);
        }
    }

    handleCommandLineChange(newCommandLine: string) {
        // TODO: Logic to handle the change in commandLine
        this.testInput(newCommandLine);
    }
    

    setNewPhrase = (phraseName?: string) => {
        const newPhrase = phraseName && Phrases.getPhrase(phraseName) ? Phrases.getPhrase(phraseName) : Phrases.getRandomPhrase();
        this.setState({ phrase: new Phrase(newPhrase), nextChars: this.getNextCharacters(newPhrase), nextCharsIsVisible: true });
        // this.props.onNewPhrase(newPhrase); 
    }

    showError = (char: string, charCode: string) => {
        this.setState({
            mismatchedChar: char,
            mismatchedCharCode: charCode,
            mismatchedIsVisible: true
            
        })
        // Call showError on the ErrorDisplay ref
        if (this._errorDisplayRef.current) this._errorDisplayRef.current.showError();
    };

    hideError = () => {
        this.setState({
            mismatchedChar: '',
            mismatchedCharCode: '',
            mismatchedIsVisible: false
        })
        // Call hideError on the ErrorDisplay ref
        if (this._errorDisplayRef.current) this._errorDisplayRef.current.hideError();
    };

    handleSuccess = () => {
        // Call hideError on the ErrorDisplay ref
        this._errorDisplayRef.current.hideError();
    };

    mountTimer() {
        this._timerRoot = document.getElementById('timer-root');
        if (this._timerRoot) {
            if (!this.timerComponentRoot) {
                this.timerComponentRoot = createRoot(this._timerRoot); // Create a root
            }
            this.timerComponentRoot.render(<Timer ref={this._timerRef} />); // Render the Timer component with the ref
        }
    }

    stopTimer() {
        if (this._timerRef.current) {
            this._timerRef.current.stop();
        }
    }
    startTImer() {
        if (this._timerRef.current) {
            this._timerRef.current.start();
        }
    }
    resetTimer() {
        if (this._timerRef.current) {
            this._timerRef.current.reset();
        }
    }

    cancelTimer = () => {
        if (this._timerRef.current) {
            this._timerRef.current.reset();
        }
        if (this._nextChars) this._nextChars.innerText = this.state.phrase.value;
        if (this._testArea) {
            this._testArea.style.border = "2px solid lightgray";
            this._testArea.disabled = false;
            this._testArea.value = '';
            this._testArea.focus();
        }
    }

    set wpm(wpm: HTMLSpanElement) {
        this._wpm = wpm;
    }
    get phrase(): Phrase {
        return this.state.phrase;
    }
    public get nextChars(): HTMLElement {
        return this._nextChars;
    }
    public get nextCharsRate(): HTMLElement {
        return this._nextCharsRate;
    }

    reset(): void {
        this.state.phrase = new Phrase('');
        this.setNext('');
        this._nextChars.hidden = true;
    }

    set phrase(phrase: HTMLInputElement) {
        this.state.phrase = new Phrase(phrase.value);
    }

    setNextCharsDisplay(stringBeingTested: string): void {
        this.setState({ nextChars: this.getNextCharacters(stringBeingTested) });
    }

    getNextCharacters(stringBeingTested: string): string {
        const nextIndex = this.getFirstNonMatchingChar(stringBeingTested);
        const nextChars = this.state.phrase.value.substring(nextIndex, nextIndex + this._nextCharsLength);
        return nextChars || stringBeingTested.substring(nextIndex, nextIndex + this._nextCharsLength);
    }

    /**
     * Calculates the words per minute (WPM) based on the text typed in the test area.
     *
     * @return {string} The calculated words per minute as a string with two decimal places.
     */
    getWpm(): string {
        if (!this._testArea) return "0";
        if (this._testArea.value.length < 2) {
            return "0";
        }

        const words = this._testArea.value.length / 5;
        const result = (words / (this._centiSecond / 100 / 60) + 0.000001).toFixed(2);
        return result;
    }

    private setNext = (testPhrase: string): HTMLElement | null => {
        // TODO: figure out why setNextCharsDisplay is also calling getFirstNonMatchingChar and see if we can do it all at once.
        const nextIndex = this.getFirstNonMatchingChar(testPhrase);
        if (nextIndex < 0) {
            return null;
        }
        // Remove the outstanding class from the previous chord.

        if (nextIndex > this.state.phrase.value.length - 1) {
            return null;
        }

        this.setNextCharsDisplay(testPhrase);

        const nextChordHTML = this.state.phrase.chordsHTML[nextIndex] as HTMLElement;

        if (nextChordHTML) {
            nextChordHTML.classList.add("next");
            if (this._chordImageHolder) this._chordImageHolder.replaceChildren(nextChordHTML);
        }

        // Set the next character in the SVG element
        if (this._svgCharacter && nextChordHTML) {
            const nameAttribute = nextChordHTML.getAttribute("name");
            if (nameAttribute) {
                this._svgCharacter.innerHTML = nameAttribute
                    .replace("Space", spaceDisplayChar)
                    .replace("tab", "↹");
            }
        }
        if (this._svgCharacter && !this.isTestMode) {
            this._svgCharacter.hidden = false;
        }
        this._wpm.innerText = this.getWpm();
        return nextChordHTML;
    };

    cancel = () => {
        if (this._testArea) {
            this._testArea.value = '';
            this._testArea.focus();
            this._testArea.style.border = "";
        }
        this._charTimeArray = [];
        if (this.wpm) this.wpm.innerText = '0';
        if (this._charTimes) this._charTimes.innerHTML = '';
        // clear error class from all chords
        this.setNext('');
    }

    testInput = (stringBeingTested: string) => {
        
        this.startTImer();

        const nextChordHTML = this.setNext(stringBeingTested);
        if (nextChordHTML) {
            nextChordHTML.classList.remove("error");
        }

        // TODO: de-overlap this and comparePhrase
        if (stringBeingTested.length === 0) {
            // stop timer
            if (this._testArea) this._testArea.style.border = "";
            const chordImageHolderChild = this._chordImageHolder?.firstChild as HTMLImageElement;
            if (chordImageHolderChild) chordImageHolderChild.hidden = true;
            this.cancelTimer();
            return;
        }

        if (stringBeingTested
            == this.state.phrase.value
                .trim().substring(0, stringBeingTested.length)
        ) {
            // if (this._testArea) this._testArea.style.border = "4px solid #FFF3";
            this.hideError();
            // TODO: This should update the actual display
            // TODO: Make sure why nextChars is already updated here and remove this if condition or update it.
            // this.state.nextChars = this.getNextCharacters(inputString, this.state.phrase.value);
        }
        else {
            // #MISMATCHED
            if (this._errorDisplayRef.current) {
                const firstNonMatchingChar = this.getFirstNonMatchingChar(stringBeingTested);
                const mismatchedChar = this.state.phrase.value[firstNonMatchingChar];
                const mismatchedCharCode: string = this.state.phrase.chords[firstNonMatchingChar].chordCode;
                console.log('Showing error');
                this.setState({ 
                    mismatchedIsVisible: true,
                    mismatchedChar, 
                    mismatchedCharCode 
                });
                this.showError(mismatchedChar, mismatchedCharCode);
            } else {
                console.log('NextCharsDisplay.testInput #MISMATCHED errorDisplayRef.current is null');
            }

            // const chordImageHolderChild = this._chordImageHolder?.firstChild as HTMLImageElement;
            // if (chordImageHolderChild) chordImageHolderChild.hidden = false;
        }

        if (stringBeingTested.trim() == this.state.phrase.value.trim()) {
            // SUCCESS 
            // SHOW completion indication
            // this._timer.setSvg('stop');
            this.stopTimer();
            this.setState(
                { 
                    isActive: false, 
                    mismatchedChar: '', 
                    mismatchedCharCode: '', 
                    mismatchedIsVisible: false, 
                    nextChars: '',
                });
            let charTimeList = "";
            this._charTimeArray.forEach((x: CharTime) => {
                charTimeList += `<li>${x.char.replace(' ', spaceDisplayChar)}: ${x.duration}</li>`;
            });

            if (this._charTimes) this._charTimes.innerHTML = charTimeList;
            localStorage
                .setItem(
                    `charTimerSession_${(new Date).toISOString()}`,
                    JSON.stringify(this._charTimeArray)
                );
            // this._timer.success();
            return;
        }
        // this._timer.start();
    }

    private getFirstNonMatchingChar = (stringBeingTested: string): number => {
        if (!this.state.phrase.value) return 0;
        const sourcePhrase = this.state.phrase.value;
        if (stringBeingTested.length == 0) {
            return 0;
        }
        var result = 0;
        for (let i = 0; i < stringBeingTested.length; i++) {
            if (stringBeingTested[i] !== sourcePhrase[i]) {
                return i;
            }
            result++;
        };
        return result;
    };

    sayText = (e: KeyboardEvent) => {
        const eventTarget = e.target as HTMLInputElement;
        // Get the input element value
        if (!eventTarget || !eventTarget.value) return;
        let text = eventTarget.value;
        // Get the key that was pressed
        const char = e.key;
        // If no key was pressed, return
        if (!char) return;
        // If the speechSynthesis object is not defined, return
        if (!this.voiceSynth) {
            this.voiceSynth = window.speechSynthesis;
        }
        // If speaking, cancel the speech
        if (this.voiceSynth.speaking) {
            this.voiceSynth.cancel();
        }
        // If the key is a-z or 0-9, use that as the text
        if (char?.match(/^[a-z0-9]$/i)) {
            text = char;
        }
        // If the key is Backspace, say "delete"
        else if (char == "Backspace") {
            text = "delete";
        }
        // If the key is Enter, say the text
        else if (char == "Enter") {
            text = text;
        }
        // If the key is not one of the above, get the last word in the text
        else {
            const textSplit = text.trim().split(' ');
            text = textSplit[textSplit.length - 1];
        }
        // Create a new speech utterance
        var utterThis = new SpeechSynthesisUtterance(text);
        // Set the pitch and rate
        utterThis.pitch = 1;
        utterThis.rate = 0.7;
        // Speak the text
        this.voiceSynth.speak(utterThis);
    }

    render() {
        return (
            <div hidden={!this.props.isInPhraseMode}>
                {/* ...other components */}
                <ErrorDisplay
                    isVisible={this.state.mismatchedIsVisible}
                    ref={this._errorDisplayRef}
                    svgCharacter={this._svgCharacter}
                    chordImageHolder={this._chordImageHolder}
                    mismatchedChar={this.state.mismatchedChar}
                    mismatchedCharCode={this.state.mismatchedCharCode}
                />
                <Timer
                    ref={this._timerRef}
                />
                <pre id={TerminalCssClasses.NextChars}>
                    {this.state.nextChars}
                </pre>
            </div>
        );
    }
}

export default NextCharsDisplay;