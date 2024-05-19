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
    private nextCharsDisplay: NextCharsDisplay;

    constructor() {
        this.nextCharsDisplay = new NextCharsDisplay({
            wholePhraseChords: document.getElementById(TerminalCssClasses.WholePhraseChords) as HTMLElement,
            chordImageHolder: document.getElementById(TerminalCssClasses.ChordImageHolder) as HTMLElement,
            svgCharacter: document.getElementById(TerminalCssClasses.SvgCharacter) as HTMLElement,
            testMode: document.getElementById(TerminalCssClasses.TestMode) as HTMLInputElement,
            setWpmCallback: () => { },
        });
        this.phrase = document.getElementById("phrase") as HTMLInputElement;
        this.nextCharsDisplay.phrase = this.phrase;
        this.chordified = document.getElementById("chordified") as HTMLElement;
        this.wholePhraseChords = document.getElementById(TerminalCssClasses.WholePhraseChords) as HTMLElement;
        this.nextCharsDisplay.testMode = (document.getElementById("testMode") as HTMLInputElement);
        this.charTimer = [];
        this.charTimes = document.getElementById("charTimes") as HTMLElement;
        this.wpm = document.getElementById("wpm") as HTMLElement;
        this.nextCharsDisplay.wpm = this.wpm;


        const handleInputEvent: InputEventCallback = (event: InputEvent) => {
            console.log("Handle Input Event not implementd:", event);
        };
        this.prevCharTime = 0;
        this.pangrams = document.getElementById("pangrams") as HTMLElement;
        this.prevCharTime = 0;
        this.preview = document.getElementById("preview") as HTMLVideoElement;
        this.charTimer = [];
        this.chordSection = document.getElementById("chord-section") as HTMLDivElement;
        this.nextCharsDisplay.testMode?.addEventListener('change', e => {
            this.saveMode(e);
            this.nextCharsDisplay.chordify();
        });
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
        this.videoMode?.addEventListener('change', e => {
            var changeResult = this.saveMode(e);
            this.toggleVideo(changeResult);
        });

        this.allChordsList = document.getElementById("allChordsList") as HTMLDivElement;
        // APP.testModeLabel = document.getElementById("testModeLabel");
        this.errorCount = document.getElementById("errorCount") as HTMLElement;

        this.phrase.addEventListener('change', this.nextCharsDisplay.chordify);
        this.phrase.addEventListener('touchend', (e: Event) => {
            if (this.voiceMode && this.voiceMode.checked) {
                this.nextCharsDisplay.sayText(e as KeyboardEvent);
            }
        });
        this.pangrams.addEventListener('click', (e: MouseEvent) => {
            const targetElement = e.target as HTMLElement;
            if (!targetElement) {
                console.log("Pangram element missing");
                return;
            }
            if (this.phrase && targetElement && targetElement.innerText === "Termux") {
                this.phrase.value = "Termux is an Android terminal emulator and Linux environment app that works directly with no rooting or setup required. A minimal base system is installed automatically - additional packages are available using the APT package manager. The termux-shared library was added in v0.109. It defines shared constants and utils of the Termux app and its plugins. It was created to allow for the removal of all hardcoded paths in the Termux app. Some of the termux plugins are using this as well and rest will in future. If you are contributing code that is using a constant or a util that may be shared, then define it in termux-shared library if it currently doesn't exist and reference it from there. Update the relevant changelogs as well. Pull requests using hardcoded values will/should not be accepted. Termux app and plugin specific classes must be added under com.termux.shared.termux package and general classes outside it. The termux-shared LICENSE must also be checked and updated if necessary when contributing code. The licenses of any external library or code must be honoured. The main Termux constants are defined by TermuxConstants class. It also contains information on how to fork Termux or build it with your own package name. Changing the package name will require building the bootstrap zip packages and other packages with the new $PREFIX, check Building Packages for more info. Check Termux Libraries for how to import termux libraries in plugin apps and Forking and Local Development for how to update termux libraries for plugins. The versionName in build.gradle files of Termux and its plugin apps must follow the semantic version 2.0.0 spec in the format major.minor.patch(-prerelease)(+buildmetadata). When bumping versionName in build.gradle files and when creating a tag for new releases on GitHub, make sure to include the patch number as well, like v0.1.0 instead of just v0.1. The build.gradle files and attach_debug_apks_to_release workflow validates the version as well and the build/attachment will fail if versionName does not follow the spec.";
            } else if (this.phrase && targetElement && targetElement.innerText === "Handex") {
                this.phrase.value = "Type anywhere with this one-handed keyboard. Stop sitting down to type. Stop looking down to send messages. Built to the shape of your finger actions, this device will eliminate your need to reposition your fingers while typeing. Use the same keyboard, designed for your hand, everywhere. You never have to learn a new one. The natural motions of your fingers compose the characters. It's build around your hand, so you don't have to reorient your finger placement on a board. Repositioning your fingers on a board is the biggest hurdle of typing-training, so don't do it. Handex is built around your finger movements, so you'll never have to reposition your fingers to find a key. Even unusual keys, such `\`, `~`, `|`, `^`, `&` are easy to type. Handex liberates you from the key-board-shackle problem. 151 keys are currently available and more are coming.";
            } else {
                if (targetElement && this.phrase) {
                    this.phrase.value = targetElement.innerText;
                }
            }
            this.nextCharsDisplay.chordify();
        });
        document.getElementById('timerCancel')
            ?.addEventListener('click', (e) => {
                this.nextCharsDisplay.cancelTimer();
            });
        document.getElementById('listAllChords')
            ?.addEventListener('click', this.listAllChords);
        document.getElementById('resetChordify')
            ?.addEventListener('click', this.nextCharsDisplay.resetChordify);

        this.toggleVideo(false);
    }

    private saveMode = (modeEvent: Event): boolean => {
        // chordify();
        // Hide the chordified sub-divs.
        const result = (modeEvent.target as HTMLInputElement).checked
        localStorage.setItem((modeEvent.target as HTMLInputElement).id, result.toString());
        return result;
    }
    private toggleVideo = (setOn: boolean): boolean => {
        if (setOn) {
            navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment'
                }
            })
                .then((stream: MediaStream) => {
                    if (this.preview) {
                        this.preview.srcObject = stream;
                    }
                });
            if (this.videoSection && this.chordSection) this.videoSection.appendChild(this.chordSection);
        } else {
            const divContent = document.querySelector<HTMLDivElement>("div.content");
            if (divContent && this.chordSection) {
                // Safely use divContent here
                divContent.appendChild(this.chordSection);
            }
            if (this.preview?.srcObject) {
                (this.preview.srcObject as MediaStream).getTracks().forEach(track => track.stop());
                this.preview.srcObject = null;
            }
        }
        if (this.videoSection) this.videoSection.hidden = !setOn;
        if (this.phrase) this.phrase.classList.toggle('phrase-over-video', setOn);
        if (this.chordSection) this.chordSection.classList.toggle('chord-section-over-video', setOn);
        return !setOn;
    }

    private listAllChords = () => {
        if (this.allChordsList) this.allChordsList.hidden = false;
        // highlight Vim navigation keys
        Array.from(document.querySelectorAll("#allChordsList div span") as NodeListOf<Element>)
            .filter((x: Element) => {
                const element = x as HTMLElement;
                return element.tagName === 'SPAN' && "asdfgjkl;/0$^m\"web".includes(element.innerText);
            })
            .forEach((x: Element, index: number, array: Element[]) => {
                const element = x as HTMLElement;
                if (element.tagName === 'SPAN' && "asdfgjkl;/0$^m\"web".includes(element.innerText)) {
                    element.style.color = "blue";
                }
            });
    };
};

