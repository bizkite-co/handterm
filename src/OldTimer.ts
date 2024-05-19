import { TerminalCssClasses } from './terminal/TerminalTypes.js';
import { CharTime, createCharTime, spaceDisplayChar, CancelCallback, InputEventCallback } from './types/Types.js';
import { createElement } from "./utils/dom.js";

class Timer {
    private _intervalId: number | null = null;
    private _centiSecond: number = 0;
    private _timerElement: HTMLSpanElement;
    private _timerSvg: SVGElement;

    private timerHandle: any = null;

    constructor() {
        this._timerElement = this.constructTimerElement();
        this._timerSvg = this.constructTimerSvgElement();
    }
    constructTimerElement(): HTMLSpanElement {
        let result = document.getElementById(TerminalCssClasses.Timer) as HTMLSpanElement;
        if (!result) {
            console.log(`Timer not found at document.getElementById('${TerminalCssClasses.Timer}')`, document.getElementById(TerminalCssClasses.Timer));
            result = createElement("span", TerminalCssClasses.Timer)
        }
        return result;
    }
    constructTimerSvgElement(): SVGElement {
        let timerSvgElement = document.getElementById(TerminalCssClasses.TimerSvg);
        if (timerSvgElement && (timerSvgElement instanceof SVGElement)) {
            return timerSvgElement
        }
        else {
            console.log('timerSvg missing, being created', TerminalCssClasses.TimerSvg, timerSvgElement);
            return document.createElementNS("http://www.w3.org/2000/svg", "svg");
        }
    }
    get timerElement(): HTMLElement {
        return this._timerElement;
    }
    set timerElement(element: HTMLSpanElement) {
        this._timerElement = element;
    }
    get timerSvg(): SVGElement {
        return this._timerSvg;
    }
    set timerSvg(svg: SVGElement) {
        this._timerSvg = svg;
    }

    public get centiSecond(): number {
        return this._centiSecond;
    }

    public start = () => {
        // Start if not already started.
        if (!this.timerHandle) {
            this.timerHandle = setInterval(this.run, 10);
            this.setSvg('pause');
        }
    };

    stop(): void {
        if (this._intervalId !== null) {
            clearInterval(this._intervalId);
            this._intervalId = null;
        }
    }

    reset(): void {
        this.stop();
        this._centiSecond = 0;
    }

    setSvg = (status: 'start' | 'stop' | 'pause'): void => {
        switch (status) {
            case 'start':
                this._timerSvg.innerHTML = '<use href="#start" transform="scale(2,2)" ></use>';
                break;
            case 'stop':
                this._timerSvg.innerHTML = '<use href="#stop" transform="scale(2,2)" ></use>';
                break;
            case 'pause':
                this._timerSvg.innerHTML = '<use href="#pause" transform="scale(2,2)" ></use>';
                break;
            default:
                this._timerSvg.innerHTML = '<use href="#stop" transform="scale(2,2)" ></use>';
        }
    };

    private run = () => {
        this._centiSecond++;
        this._timerElement.innerText = (this._centiSecond / 100).toFixed(1);
    };

    cancel = (): void => {
        // Cancel the timer and reset values.
        this._timerElement.innerHTML = '0.0';
        this._centiSecond = 0;
        clearInterval(this.timerHandle);
        this.timerHandle = null;
        this.setSvg('start');
    }
    success = (): void => {
        // Callback to the calling function.
        console.log("Timer Success");
        // Continue with local features
        this._centiSecond = 0;
        clearInterval(this.timerHandle);
        this.timerHandle = null;
        this.setSvg('start');
    }
}
