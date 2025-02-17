export const TerminalCssClasses = {
    terminal: 'terminal',
    line: 'terminal-line',
    output: 'terminal-output',
    input: 'terminal-input',
    terminalGame: 'terminal-game',
    promptHeader: 'prompt-header',
    head: 'head',
    tail: 'tail',
    logPrefix: 'log-prefix',
    logTime: 'log-time',
    nextChars: 'next-chars',
    nextCharsRate: 'next-chars-rate',
    wholePhraseChords: 'wholePhraseChords',
    chordImageHolder: 'chord-image-holder',
    testArea: 'testArea',
    svgCharacter: 'svgCharacter',
    testMode: 'testMode',
    chordified: 'chordified',
    pangrams: 'pangrams',
    chordSection: 'chord-section',
    voiceMode: 'voiceMode',
    videoSection: 'video-section',
    allChordsList: 'allChordsList',
    errorCount: 'errorCount',
    phrase: 'phrase',
    timer: 'timer',
    timerSvg: 'timerSvg',
    charTimes: 'charTimes',
    wpm: 'wpm',
} as const;
export type TerminalCssClasses = (typeof TerminalCssClasses)[keyof typeof TerminalCssClasses];

export const AnsiColorCodes = {
    reset: "\x1B[0m",
    bright: "\x1B[1m",
    dim: "\x1B[2m",
    underscore: "\x1B[4m",
    blink: "\x1B[5m",
    reverse: "\x1B[7m",
    hidden: "\x1B[8m",

    fgBlack: "\x1B[30m",
    fgRed: "\x1B[31m",
    fgGreen: "\x1B[32m",
    fgYellow: "\x1B[33m",
    fgBlue: "\x1B[34m",
    fgMagenta: "\x1B[35m",
    fgCyan: "\x1B[36m",
    fgWhite: "\x1B[37m",

    bgBlack: "\x1B[40m",
    bgRed: "\x1B[41m",
    bgGreen: "\x1B[42m",
    bgYellow: "\x1B[43m",
    bgBlue: "\x1B[44m",
    bgMagenta: "\x1B[45m",
    bgCyan: "\x1B[46m",
    bgWhite: "\x1B[47m"
} as const;
export type AnsiColorCodes = (typeof AnsiColorCodes)[keyof typeof AnsiColorCodes];

export const StorageKeys = {
    charTime: 'char-time',
    command: 'command',
    commandHistory: 'commandHistory',
    phrasesAchieved: 'phrasesAchieved',
    targetWPM: 'targetWPM',
    currentCommand: 'currentCommand',
    repoNames: 'repoNames',
    username: 'userName',
    gitHubUsername: 'githubUserName',
    editContent: 'editContent',
    completedTutorials: 'completed-tutorials',
    tutorialState: 'tutorial-state'
} as const;
export type StorageKeys = (typeof StorageKeys)[keyof typeof StorageKeys];

export type TimeCode = string;
export type TimeHTML = string;
/**
 * Represents the duration of a character.
 */
export interface CharDuration {
    character: string;
    durationMilliseconds: number;
}
/**
 * Represents the WPM of a character.
 */
export interface CharWPM {
    character: string;
    wpm: number;
    durationMilliseconds: number;
}
