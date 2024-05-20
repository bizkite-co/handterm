import { NextCharsDisplay } from "./NextCharsDisplay.js";
import { TerminalCssClasses } from "./terminal/TerminalTypes.js";
import { CharTime, spaceDisplayChar, CancelCallback, InputEventCallback, createCharTime } from "./types/Types.js";


export class HandChord {
    phrase: HTMLInputElement | null;
    chordified: HTMLElement | null;
    wholePhraseChords: HTMLElement | null;
    charTimer: CharTime[];
    charTimes: HTMLElement | null;
    wpm: HTMLElement | null;
    prevCharTime: number;
    preview: HTMLVideoElement | null;
    pangrams: HTMLElement | null;
    voiceMode: HTMLInputElement | null;
    videoMode: HTMLInputElement | null;
    videoSection: HTMLDivElement | null;
    errorCount: HTMLElement | null;
    allChordsList: HTMLDivElement | null;
    chordSection: HTMLDivElement | null;

    constructor() {
        this.phrase = document.getElementById("phrase") as HTMLInputElement;
        this.chordified = document.getElementById("chordified") as HTMLElement;
        this.wholePhraseChords = document.getElementById(TerminalCssClasses.WholePhraseChords) as HTMLElement;
        this.charTimer = [];
        this.charTimes = document.getElementById("charTimes") as HTMLElement;
        this.wpm = document.getElementById("wpm") as HTMLElement;


        const handleInputEvent: InputEventCallback = (event: InputEvent) => {
            console.error("Handle Input Event not implementd:", event);
        };
        this.prevCharTime = 0;
        this.pangrams = document.getElementById("pangrams") as HTMLElement;
        this.prevCharTime = 0;
        this.preview = document.getElementById("preview") as HTMLVideoElement;
        this.charTimer = [];
        this.chordSection = document.getElementById("chord-section") as HTMLDivElement;
        this.voiceMode = document.getElementById("voiceMode") as HTMLInputElement;
        this.voiceMode.checked = localStorage.getItem('voiceMode') == 'true';
        this.voiceMode?.addEventListener('change', e => {
            this.saveMode(e);
        });
        this.videoMode = document.getElementById("videoMode") as HTMLInputElement;
        // NOTE: Starting video on page load is non-optimal.
        // APP.videoMode.checked = localStorage.getItem('videoMode') == 'true';
        this.videoSection = document.getElementById("video-section") as HTMLDivElement;
        if (this.videoSection) {
            this.videoSection.hidden = !this.videoMode.checked;
        }

        this.allChordsList = document.getElementById("allChordsList") as HTMLDivElement;
        // APP.testModeLabel = document.getElementById("testModeLabel");
        this.errorCount = document.getElementById("errorCount") as HTMLElement;
    }

    private saveMode = (modeEvent: Event): boolean => {
        // chordify();
        // Hide the chordified sub-divs.
        const result = (modeEvent.target as HTMLInputElement).checked
        localStorage.setItem((modeEvent.target as HTMLInputElement).id, result.toString());
        return result;
    }

};

