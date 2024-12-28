import type { ITerminalOptions, ITerminalInitOnlyOptions } from '@xterm/xterm';

export const XtermAdapterConfig: ITerminalOptions & ITerminalInitOnlyOptions = {
      fontFamily: '"Fira Code", Menlo, "DejaVu Sans Mono", "Lucida Console", monospace',
      cursorBlink: true,
      cursorStyle: 'block',
      cursorInactiveStyle: 'outline',
      rows: 50,
      theme: {
        foreground: 'white',
        background: '#0007',
        cursor: 'white',
        cursorAccent: 'yellow',
        selectionForeground: 'gray',
        selectionBackground: 'black',
        black: '#0007',
        red: '#ff0000',
        green: '#00ff00',
        yellow: '#ffff00',
        blue: '#4444ff',
        magenta: '#ff00ff',
        cyan: '#00ffff',
        white: '#ffffff',
        brightBlack: '#808080',
        brightRed: '#ff0000',
        brightGreen: '#00ff00',
        brightYellow: '#ffff00',
        brightBlue: '#66aaff',
        brightMagenta: '#ff00ff',
        brightCyan: '#00ffff',
        brightWhite: '#ffffff'
      }
    }
