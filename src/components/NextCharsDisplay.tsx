import { TerminalCssClasses } from "../types/TerminalTypes.js";

import React, { createRef } from 'react';
import Timer from './Timer.js'; // Import the React component
import ErrorDisplay from "./ErrorDisplay";
import { Phrase } from "../utils/Phrase.js";

interface NextCharsDisplayProps {
    commandLine: string;
    onTimerStatusChange: (isActive: boolean) => void;
    isInPhraseMode: boolean;
    newPhrase: string;
    onPhraseSuccess: (phrase: string) => void;
}
interface NextCharsDisplayState {
    isActive: boolean;
    mismatchedChar: string | null;
    mismatchedIsVisible: boolean;
    nextChars: string;
    nextCharsIsVisible: boolean;
    phrase: Phrase;
}

export class NextCharsDisplay extends React.Component<NextCharsDisplayProps, NextCharsDisplayState> {

    private _nextCharsRef: React.RefObject<HTMLPreElement>;
    private _nextCharsRateRef: React.RefObject<HTMLDivElement>;

    private _timerRef: React.RefObject<any>;
    private voiceSynth: SpeechSynthesis;
    private _wpmRef: React.RefObject<HTMLSpanElement>;
    public isTestMode: boolean;


    private _errorDisplayRef: React.RefObject<any>;
    private _nextCharsLength: number = 60;

    constructor(props: NextCharsDisplayProps) {
        super(props);
        this._errorDisplayRef = createRef<HTMLDivElement>();
        this.voiceSynth = window.speechSynthesis as SpeechSynthesis;
        this._nextCharsRef = React.createRef<HTMLPreElement>();
        this._nextCharsRateRef = React.createRef<HTMLDivElement>();
        this._wpmRef = React.createRef();
        this.isTestMode = localStorage.getItem('testMode') == 'true';
        this._timerRef = createRef();
        this.state = {
            mismatchedChar: null,
            mismatchedIsVisible: false,
            nextChars: this.props.newPhrase,
            nextCharsIsVisible: false,
            isActive: false,
            phrase: new Phrase(this.props.newPhrase.split('')),
        }
    }

    componentDidMount() {
        if (this.props.isInPhraseMode) {
            this.setState({
                phrase: new Phrase(this.props.newPhrase.split(''))
            })
        }
    }

    componentDidUpdate(prevProps: NextCharsDisplayProps) {
        if (this.props.newPhrase !== prevProps.newPhrase) {
            if (this.props.isInPhraseMode) {
                this.setState({
                    phrase: new Phrase(this.props.newPhrase.split('')),
                    nextChars: this.props.newPhrase
                })
            }
        }
        // Check if the commandLine prop has changed
        if (this.props.commandLine !== prevProps.commandLine) {
            // Handle the new commandLine prop, for example by setting state
            const nextChars = this.getNextCharacters(this.props.commandLine);

            this.setState({ nextChars: nextChars });

            // Or perform any other actions necessary to respond to the change
            this.handleCommandLineChange(this.props.commandLine);
        }
    }

    handleCommandLineChange(newCommandLine: string) {
        this.testInput(newCommandLine);
    }


    showError = (char: string) => {
        this.setState({
            mismatchedChar: char,
            mismatchedIsVisible: true

        })
        // Call showError on the ErrorDisplay ref
        if (this._errorDisplayRef.current) this._errorDisplayRef.current.showError();
    };

    hideError = () => {
        this.setState({
            mismatchedChar: null,
            mismatchedIsVisible: false
        })
        // Call hideError on the ErrorDisplay ref
        // if (this._errorDisplayRef.current) this._errorDisplayRef.current.hideError();
    };

    handleSuccess = () => {
        this.setState(
            {
                isActive: false,
                mismatchedChar: '',
                mismatchedIsVisible: false,
                nextChars: '',
            });
        // Call hideError on the ErrorDisplay ref
        if (this._errorDisplayRef.current) {
            this._errorDisplayRef.current.hideError();
        }
        else {
            console.error("ErrorDisplay ref not found");
        }
        this.props.onPhraseSuccess(this.state.phrase.value.join(''));
    };


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
        if (this._nextCharsRef.current) this._nextCharsRef.current.innerText = this.state.phrase.value.join('');
    }

    reset(): void {
        this.setNext('');
        if (this._nextCharsRef?.current) this._nextCharsRef.current.hidden = true;
    }

    public get nextChars(): HTMLElement | null {
        return this._nextCharsRef?.current;
    }

    set wpm(wpm: string) {
        if (this._wpmRef.current) this._wpmRef.current.innerText = wpm;
    }

    get phrase(): Phrase {
        return this.state.phrase;
    }

    public get nextCharsRate(): HTMLElement | null {
        return this._nextCharsRateRef.current;
    }


    set phrase(phrase: HTMLInputElement) {
        this.setState({ phrase: new Phrase(phrase.value.split('')) });
    }

    getNextCharacters(stringBeingTested: string): string {
        const nextIndex = this.getFirstNonMatchingChar(stringBeingTested);
        const nextChars = this.state.phrase.value.join('').substring(nextIndex, nextIndex + this._nextCharsLength);
        return nextChars || stringBeingTested.substring(nextIndex, nextIndex + this._nextCharsLength);
    }

    private setNext = (testPhrase: string): HTMLElement | null => {
        const nextIndex = this.getFirstNonMatchingChar(testPhrase);
        if (nextIndex < 0) {
            return null;
        }
        // Remove the outstanding class from the previous chord.

        if (nextIndex > this.state.phrase.value.length - 1) {
            return null;
        }

        this.setState({ nextChars: this.getNextCharacters(testPhrase) });

        const nextChordHTML = this.state.phrase.chordsHTML[nextIndex] as HTMLElement;

        // if (nextChordHTML) {
        //     nextChordHTML.classList.add("next");
        //     if (this._chordImageHolderRef.current) this._chordImageHolderRef.current.replaceChildren(nextChordHTML);
        // }

        // Set the next character in the SVG element
        // if (this._svgCharacter.current && nextChordHTML) {
        //     const nameAttribute = nextChordHTML.getAttribute("name");
        //     if (nameAttribute) {
        //         this._svgCharacter.current.innerHTML = nameAttribute
        //             .replace("Space", spaceDisplayChar)
        //             .replace("tab", "↹");
        //     }
        // }
        // if (this._svgCharacter.current && !this.isTestMode) {
        //     this._svgCharacter.current.hidden = false;
        // }
        return nextChordHTML;
    };

    cancel = () => {
        if (this.wpm) this.wpm = '0';
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
            // const chordImageHolderChild = this._chordImageHolderRef.current?.firstChild as HTMLImageElement;
            // if (chordImageHolderChild) chordImageHolderChild.hidden = true;
            this.cancelTimer();
            return;
        }

        if (stringBeingTested
            == this.state.phrase.value.join('')
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
            const firstNonMatchingChar = this.getFirstNonMatchingChar(stringBeingTested);
            const mismatchedChar = this.state.phrase.value[firstNonMatchingChar];
            // TODO: Fix lookup for ENTER, ESCAPE, BACKSPACE, TAB, DELETE, etc.
            // const mismatchedCharCode = this.state.phrase.chords.find(c => c.key == mismatchedChar)?.chordCode || '';
            this.setState({
                mismatchedIsVisible: true,
                mismatchedChar,
            });
            this.showError(mismatchedChar);

            // const chordImageHolderChild = this._chordImageHolder?.firstChild as HTMLImageElement;
            // if (chordImageHolderChild) chordImageHolderChild.hidden = false;
        }

        if (stringBeingTested.trim() == this.state.phrase.value.join('').trim()) {
            // SUCCESS 
            // SHOW completion indication
            this.stopTimer();
            this.handleSuccess();
            return;
        }
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
                {this.state.mismatchedChar
                    && <ErrorDisplay
                        isVisible={this.state.mismatchedIsVisible}
                        ref={this._errorDisplayRef}
                        mismatchedChar={this.state.mismatchedChar}
                    />
                }
                <Timer
                    ref={this._timerRef}
                />
                <div id={TerminalCssClasses.NextCharsRate} ref={this._nextCharsRateRef}></div>
                <span id={TerminalCssClasses.WPM} ref={this._wpmRef}></span>
                <pre id={TerminalCssClasses.NextChars} ref={this._nextCharsRef} >
                    {this.state.nextChars}
                </pre>
            </div>
        );
    }
}

export default NextCharsDisplay;