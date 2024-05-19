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
import * as phrases from './phrases.json';
import { Phrase } from "./Phrase.js";

interface NextCharsDisplayProps {
    commandLine: string;
    onTimerStatusChange: (isActive: boolean) => void;
    isInPhraseMode: boolean;

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
    private _phrase = new Phrase('');

    private _wholePhraseChords: HTMLElement;
    private _chordImageHolder: HTMLElement;
    private _svgCharacter: HTMLElement;
    private _testMode: HTMLInputElement;
    private _testArea: HTMLTextAreaElement;
    private _nextChar: string = '';
    // private _timer: Timer;
    private _timerRoot: HTMLElement | null = null;
    private _timerRef: React.RefObject<any>;
    private timerComponentRoot: Root | null = null
    private _chordified: HTMLElement;
    private _allChordsList: HTMLElement;
    private _errorCount: HTMLElement;
    private _voiceMode: HTMLInputElement;
    private voiceSynth: SpeechSynthesis;
    private _lambdaUrl: string;
    private _prevCharTime: number = 0;
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

    constructor(props: NextCharsDisplayProps) {
        super(props);
        this._errorDisplayRef = createRef();
        const handleInputEvent = this.testInput.bind(this);
        // this._phrase = createElement('div', TerminalCssClasses.Phrase);
        this._lambdaUrl = 'https://l7c5uk7cutnfql5j4iunvx4fuq0yjfbs.lambda-url.us-east-1.on.aws/';
        this.voiceSynth = window.speechSynthesis as SpeechSynthesis;
        this._nextChars = document.getElementById(TerminalCssClasses.NextChars) as HTMLElement;
        this._nextCharsRate = document.getElementById(TerminalCssClasses.NextCharsRate) as HTMLDivElement;
        this._wpm = createElement('div', TerminalCssClasses.WPM) as HTMLSpanElement;
        this._charTimes = createElement('div', TerminalCssClasses.CharTimes);
        this._wholePhraseChords = createElement('div', TerminalCssClasses.WholePhraseChords);
        this._allChordsList = createElement('div', TerminalCssClasses.allChordsList);
        this._chordImageHolder = document.querySelector(`#${TerminalCssClasses.ChordImageHolder}`) as HTMLElement;
        this._svgCharacter = createElement('img', TerminalCssClasses.SvgCharacter);
        this._testMode = createElement('input', TerminalCssClasses.TestMode) as HTMLInputElement;
        this.attachTestMode();
        this._chordified = createElement('div', TerminalCssClasses.chordified);
        this._errorCount = document.getElementById(TerminalCssClasses.errorCount) as HTMLSpanElement;
        this._voiceMode = createElement('input', TerminalCssClasses.voiceMode) as HTMLInputElement;
        this._testArea = (document.getElementById(TerminalCssClasses.TestArea) as HTMLTextAreaElement);
        this.isTestMode = localStorage.getItem('testMode') == 'true';
        this._timerRef = createRef();
        // this._timer = new Timer();
        this.attachEventListeners();
    }

    componentDidMount() {
        this.mountTimer();
        if(this.props.isInPhraseMode) {
            this.setNewPhrase();
        }
    }

    componentDidUpdate(prevProps: NextCharsDisplayProps) {
        // Check if the commandLine prop has changed
        if (this.props.commandLine !== prevProps.commandLine) {
            // Handle the new commandLine prop, for example by setting state
            console.log('compenetDidUpdate', this.props.commandLine);
            this.setState({ phrase: new Phrase(this.props.commandLine) });

            // Or perform any other actions necessary to respond to the change
            this.handleCommandLineChange(this.props.commandLine);
        }
    }

    handleCommandLineChange(newCommandLine: string) {
        // TODO: Logic to handle the change in commandLine
        console.log('handleCommandLineChange', newCommandLine);
        this.testInput(newCommandLine);
    }

    setNewPhrase = () => {
        const newPhrase = this.getRandomPhrase();
        console.log('setNewPhrase', newPhrase);
        this.setState({ phrase: new Phrase(newPhrase) });
        this.updateDisplay(newPhrase);
    }

    getRandomPhrase(): string {
        const keys = Object.keys(phrases);
        if (keys.length === 0) return '';
        const randomKey = keys[Math.floor(Math.random() * keys.length)] as keyof typeof phrases;
        const result = phrases[randomKey];
        return result;
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
        if (this._nextChars) this._nextChars.innerText = this._phrase.value;
        if (this._testArea) {
            this._testArea.style.border = "2px solid lightgray";
            this._testArea.disabled = false;
            this._testArea.value = '';
            this._testArea.focus();
        }
    }

    findOrConstructPhrase(): HTMLInputElement {
        let result = document.getElementById(TerminalCssClasses.Phrase) as HTMLInputElement;
        if (!result) {
            console.log(`Phrase not found at document.getElementById('${TerminalCssClasses.Phrase}')`, document.getElementById(TerminalCssClasses.Phrase));
            result = createElement('input', TerminalCssClasses.Phrase)
        }
        return result;
    }

    attachEventListeners() {
        if (this._testArea) {
            this._testArea.addEventListener('keyup', (e: Event) => {
                if (this._voiceMode && this._voiceMode.checked) {
                    this.sayText(e as KeyboardEvent);
                }
            })
            this._testArea.addEventListener('input', (e: Event) => {
                this.testInput(this._testArea.value);
            });
        }
    }
    set wpm(wpm: HTMLSpanElement) {
        this._wpm = wpm;
    }
    get phrase(): Phrase {
        return this._phrase;
    }
    public get nextChars(): HTMLElement {
        return this._nextChars;
    }
    public get nextCharsRate(): HTMLElement {
        return this._nextCharsRate;
    }

    get chordified(): HTMLElement {
        return this._chordified;
    }

    set testMode(testMode: HTMLInputElement) {
        this._testMode = testMode;
        this._testMode.checked = localStorage.getItem('testMode') == 'true';
        this.isTestMode = this._testMode.checked;
        this.attachTestMode();
    }

    private attachTestMode() {
        this._testMode.addEventListener('change', e => {
            localStorage.setItem('testMode', this.isTestMode.valueOf().toString());
            this.getWpm();
        })
    }

    set testArea(testArea: HTMLTextAreaElement) {
        this._testArea = testArea;
        this._testArea.addEventListener('input', (e: Event) => {
            this.testInput(this._testArea.value);
        });
    }

    get testArea(): HTMLTextAreaElement {
        return this._testArea;
    }

    reset(): void {
        this._phrase = new Phrase('');
        this.setNext('');
        this._nextChars.hidden = true;
    }

    set phrase(phrase: HTMLInputElement) {
        this._phrase = new Phrase(phrase.value);
    }

    updateDisplay(testPhrase: string): void {
        console.log('updateDisplay', testPhrase);
        const nextIndex = this.getFirstNonMatchingChar(testPhrase);
        this.setNext(testPhrase);
        const nextChars = this._phrase.value.substring(nextIndex, nextIndex + 40);
    }

    getNextCharacters(testPhrase: string, fullPhrase: string): string {
        console.log('getNextCharacters', testPhrase, fullPhrase);
        const nextIndex = this.getFirstNonMatchingChar(testPhrase);
        const nextChars = fullPhrase.substring(nextIndex, nextIndex + 40);
        return nextChars;
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

    private formatNextChars(chars: string): string {
        let result = chars;
        // Format the characters as needed for display, e.g., replace spaces, add span for the next character, etc.
        // Return the formatted string to be set as innerHTML of the nextCharsElement
        return result;
    }

    public async chordify(): Promise<Array<ChordRow>> {
        const phrase = new Phrase(this._phrase.value);
        console.log('phrase', phrase);
        const chordRows: Array<ChordRow> = phrase.chords.map((chord: Chord) => { return { char: chord.key, chord: parseInt(chord.chordCode, 16), strokes: '' }; });
        this._wholePhraseChords.innerHTML = phrase.chordsHTML.join('');
        this.setNext('');
        // this._timer.setSvg('start');
        if (this._testArea) this._testArea.focus();
        // TODO: disable phrase elemeent
        // this._phrase.disabled = true;

        return chordRows;
    }

    resetChordify = () => {
        if (this._phrase) {
            // TODO: blank out the phrase input element.
            // this._phrase.value = '';
            // TODO: enable phrase elemeent
            // this._phrase.disabled = false;
        }
        if (this._wholePhraseChords) this._wholePhraseChords.innerHTML = '';
        if (this._allChordsList) this._allChordsList.hidden = true;
        if (this._testArea) {
            this._testArea.value = '';
            this._testArea.disabled = false;
        }
    };
    private setNext = (testPhrase: string): HTMLElement | null => {
        const nextIndex = this.getFirstNonMatchingChar(testPhrase);
        if (nextIndex < 0) {
            return null;
        }
        // Remove the outstanding class from the previous chord.
        Array
            .from(this._wholePhraseChords?.children ?? [])
            .forEach((chord, i) => {
                chord.classList.remove("next");
            });

        if (nextIndex > this._phrase.value.length - 1) {
            return null;
        }

        let nextCharacter = `<span class="nextCharacter">${this._phrase.value.substring(nextIndex, nextIndex + 1).replace(' ', '&nbsp;')}</span>`;

        this.updateDisplay(testPhrase);
        const nextChars = this._phrase.value.substring(nextIndex, nextIndex + 40);
        this._nextChars.innerHTML = this.formatNextChars(nextChars);

        const next = this._wholePhraseChords?.children[nextIndex] as HTMLElement;

        let inChord = Phrase.findChordHTML(nextChars[0]);

        if (inChord) {
            inChord.classList.add("next");
            if (this._chordImageHolder) this._chordImageHolder.replaceChildren(inChord);
        }

        if (this._svgCharacter && next) {
            const nameAttribute = next.getAttribute("name");
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
        return next;
    };

    cancel = () => {
        if (this._testArea) {
            this._testArea.value = '';
            this._testArea.focus();
            this._testArea.style.border = "";
        }
        this._charTimeArray = [];
        this._prevCharTime = 0;
        if (this.wpm) this.wpm.innerText = '0';
        if (this._charTimes) this._charTimes.innerHTML = '';
        // clear error class from all chords
        Array.from(this._wholePhraseChords.children)
            .forEach(
                (value: Element) => {
                    const chord = value as HTMLElement;
                    chord.classList.remove("error");
                }
            );
        this.setNext('');
    }

    testInput = (inputString: string) => {
        console.log("testInput", inputString);
        const currentChar = inputString.slice(-1); // Get the last character of the inputString
        const expectedChar = this._nextChar; // Expected character to be typed next
        this.startTImer();
        // Use WPM calculator here.
        if (currentChar === expectedChar) {
            const charTime = createCharTime(
                currentChar,
                Number(((this._centiSecond - this._prevCharTime) / 100).toFixed(2)),
                this._centiSecond / 100
            );
            this._charTimeArray.push(charTime);
        }

        const next = this.setNext(inputString);
        if (next) {
            next.classList.remove("error");
        }
        this._prevCharTime = this._centiSecond;

        // TODO: de-overlap this and comparePhrase
        if (inputString.length === 0) {
            // stop timer
            if (this._testArea) this._testArea.style.border = "";
            const chordImageHolderChild = this._chordImageHolder?.firstChild as HTMLImageElement;
            if (chordImageHolderChild) chordImageHolderChild.hidden = true;
            this.cancelTimer();
            return;
        }

        if (inputString
            == this._phrase.value
                .trim().substring(0, inputString.length)
        ) {
            if (this._testArea) this._testArea.style.border = "4px solid #FFF3";
            this.hideError();
            this._nextChars.textContent = this.getNextCharacters(inputString, this._phrase.value);
        }
        else {
            // #MISMATCHED
            // Alert mismatched text with red border.
            if (this._testArea) this._testArea.style.border = "4px solid red";
            next?.classList.add("error");
            console.log('NextCharsDisplay.testInput mismatch', this._errorDisplayRef);
            if (this._errorDisplayRef.current) {
                const mismatchedChar = this._phrase.value[this.getFirstNonMatchingChar(this._phrase.value)];
                const mismatchedCharCode: string = allChords.find((x: Chord) => x.key == mismatchedChar)?.chordCode ?? '';
                console.log('Showing error');
                this.setState({ mismatchedChar, mismatchedCharCode });
                // this.showError(mismatchedChar, mismatchedCharCode);
            } else {
                console.log('NextCharsDisplay.testInput #MISMATCHED errorDisplayRef.current is null');
            }

            // const chordImageHolderChild = this._chordImageHolder?.firstChild as HTMLImageElement;
            // if (chordImageHolderChild) chordImageHolderChild.hidden = false;
        }

        if (inputString.trim() == this._phrase.value.trim()) {
            // SUCCESS 
            // SHOW completion indication
            // this._timer.setSvg('stop');
            if (this._testArea) {
                this._testArea.classList.add('disabled');
                this._testArea.disabled = true;
                this._testArea.style.border = "4px solid #0F0A";
            }
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

    private getFirstNonMatchingChar = (testPhrase: string): number => {
        if (!this._phrase.value) return 0;
        const sourcePhrase = this._phrase.value.split('');
        if (testPhrase.length == 0) {
            return 0;
        }
        var result = 0;
        for (let i = 0; i < testPhrase.length; i++) {
            if (testPhrase[i] !== sourcePhrase[i]) {
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
        console.log('IsInPhraseMode: ', this.props.isInPhraseMode);
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
                    {this._phrase.value}
                </pre>
            </div>
        );
    }
}

export default NextCharsDisplay;