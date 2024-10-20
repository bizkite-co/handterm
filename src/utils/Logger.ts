// utils/Logger.ts
export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export class Logger {
  private moduleName: string;
  private logLevel: LogLevel;

  constructor(moduleName: string, logLevel: LogLevel = LogLevel.INFO) {
    this.moduleName = moduleName;
    this.logLevel = logLevel;
  }

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level >= this.logLevel) {
      const stack = new Error().stack;

      const caller = stack?.split('\n')
        .slice(2,6)
        .join('\n')
        .replaceAll(window.location.origin, '')
        .replaceAll(/\?t\=\d*/g,'')
        .trim(); // Note the index change due to being inside a method
      console.log(`[${this.moduleName}] [${LogLevel[level]}] ${message}`, ...args, `\nCalled from: ${caller}`);
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export function createLogger(moduleName: string, logLevel?: LogLevel) {
  return new Logger(moduleName, logLevel);
}