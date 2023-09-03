import { cyan, green, red, yellow } from 'picocolors';

export interface Logger {
  debug: (...args: any[]) => void;

  error: (...args: any[]) => void;

  warn: (...args: any[]) => void;

  info: (...args: any[]) => void;
}

export class ConsoleLogger implements Logger {
  private debugEnabled: boolean = false;

  constructor(private readonly console: Console) {}

  debug(...args: any[]): void {
    if (this.debugEnabled) {
      this.console.debug(cyan('Debug:'), ...args);
    }
  }

  error(...args: any[]): void {
    this.console.error(red('Error:'), ...args);
  }

  info(...args: any[]): void {
    this.console.info(green('Info:'), ...args);
  }

  warn(...args: any[]): void {
    this.console.warn(yellow('Warn:'), ...args);
  }

  setDebugEnabled(debugEnabled: boolean): void {
    this.debugEnabled = debugEnabled;
  }

  isDebugEnabled(): boolean {
    return this.debugEnabled;
  }
}

export const log = new ConsoleLogger(console);
