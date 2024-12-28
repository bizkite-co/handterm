enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4
}

interface LoggerConfig {
  level?: LogLevel;
  prefix?: string;
  logToConsole?: boolean;
  logToFile?: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: config.level ?? LogLevel.INFO,
      prefix: config.prefix ?? 'HandTerm',
      logToConsole: config.logToConsole ?? true,
      logToFile: config.logToFile ?? false
    };
  }

  private log<T extends unknown[]>(level: LogLevel, message: string, ...args: T): void {
    if (this.config.level !== undefined && level < this.config.level) return;

    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${this.config.prefix}] [${LogLevel[level]}] ${message}`;

    if (this.config.logToConsole === true) {
      this.safeConsoleLog(level, formattedMessage, ...args);
    }

    if (this.config.logToFile === true) {
      this.writeToLogFile(formattedMessage, ...args);
    }
  }

  private safeConsoleLog<T extends unknown[]>(level: LogLevel, formattedMessage: string, ...args: T): void {
    if (typeof window !== 'undefined' && window.console) {
      switch (level) {
        case LogLevel.DEBUG:
          window.console.log(formattedMessage, ...args);
          break;
        case LogLevel.INFO:
          window.console.info(formattedMessage, ...args);
          break;
        case LogLevel.WARN:
          window.console.warn(formattedMessage, ...args);
          break;
        case LogLevel.ERROR:
          window.console.error(formattedMessage, ...args);
          break;
      }
    }
  }

  private writeToLogFile<T extends unknown[]>(_message: string, ..._args: T): void {
    // Implement file logging logic if needed
    // This could write to a log file in the application's data directory
    // Placeholder for future implementation
  }

  public debug(message: string, ...args: unknown[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  public info(message: string, ...args: unknown[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  public warn(message: string, ...args: unknown[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  public error(message: string, ...args: unknown[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

function createLogger(config?: Partial<LoggerConfig>): Logger {
  return new Logger(config);
}

export { Logger, LogLevel, createLogger };
