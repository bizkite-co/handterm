
export const TerminalCssClasses = {
    Terminal: 'terminal',
    Line: 'terminal-line',
    Output: 'terminal-output',
    Input: 'terminal-input',
    TerminalGame: 'terminal-game',
    Prompt: 'prompt',
    Head: 'head',
    Tail: 'tail',
    LogPrefix: 'log-prefix',
    LogTime: 'log-time',
    NextChars: 'nextChars',
    NextCharsRate: 'nextCharsRate',
    WholePhraseChords: 'wholePhraseChords',
    ChordImageHolder: 'chord-image-holder',
    TestArea: 'testArea',
    SvgCharacter: 'svgCharacter',
    TestMode: 'testMode',
    chordified: 'chordified',
    pangrams: 'pangrams',
    chordSection: 'chord-section',
    voiceMode: 'voiceMode',
    videoSection: 'video-section',
    allChordsList: 'allChordsList',
    errorCount: 'errorCount',
    Phrase: 'phrase',
    Timer: 'timer',
    TimerSvg: 'timerSvg',
    CharTimes: 'charTimes',
    WPM: 'wpm',
} as const;

export const LogKeys = {
    CharTime: 'char-time',
    Command: 'command',
    CommandHistory: 'commandHistory',
    PhrasesAchieved: 'phrasesAchieved',
} as const;

export type TimeCode = string;
export type TimeHTML = string;
export type CharDuration = {
    character: string;
    durationMilliseconds: number;
}
export type CharWPM = {
    character: string;
    wpm: number;
    durationMilliseconds: number;
}