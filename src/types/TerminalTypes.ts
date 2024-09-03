
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
    NextChars: 'next-chars',
    NextCharsRate: 'next-chars-rate',
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

export const AnsiColorCodes = {
  Reset: "\x1B[0m",
  Bright: "\x1B[1m",
  Dim: "\x1B[2m",
  Underscore: "\x1B[4m",
  Blink: "\x1B[5m",
  Reverse: "\x1B[7m",
  Hidden: "\x1B[8m",

  FgBlack: "\x1B[30m",
  FgRed: "\x1B[31m",
  FgGreen: "\x1B[32m",
  FgYellow: "\x1B[33m",
  FgBlue: "\x1B[34m",
  FgMagenta: "\x1B[35m",
  FgCyan: "\x1B[36m",
  FgWhite: "\x1B[37m",

  BgBlack: "\x1B[40m",
  BgRed: "\x1B[41m",
  BgGreen: "\x1B[42m",
  BgYellow: "\x1B[43m",
  BgBlue: "\x1B[44m",
  BgMagenta: "\x1B[45m",
  BgCyan: "\x1B[46m",
  BgWhite: "\x1B[47m"
} as const;

export const LogKeys = {
    CharTime: 'char-time',
    Command: 'command',
    CommandHistory: 'commandHistory',
    PhrasesAchieved: 'phrasesAchieved',
    TargetWPM: 'targetWPM',
    CurrentCommand: 'currentCommand',
    RepoNames: 'repoNames',
    Username: 'userName',
    GitHubUsername: 'githubUserName',
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