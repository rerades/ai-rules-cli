/**
 * Logger module
 * Provides structured logging with colors and levels
 */

import chalk from "chalk";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
}

/**
 * Logger class
 */
export class Logger {
  private readonly verbose: boolean;
  private readonly colors: boolean;

  constructor(verbose: boolean = false, colors: boolean = true) {
    this.verbose = verbose;
    this.colors = colors;
  }

  /**
   * Logs a debug message
   */
  debug(message: string, context?: Record<string, unknown>): void {
    if (this.verbose) {
      this.log("debug", message, context);
    }
  }

  /**
   * Logs an info message
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Logs a warning message
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Logs an error message
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): void {
    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context: context || {},
    };

    if (this.colors) {
      this.logWithColors(entry);
    } else {
      this.logPlain(entry);
    }
  }

  /**
   * Logs with colors
   */
  private logWithColors(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;

    let levelColor: (text: string) => string;
    switch (level) {
      case "debug":
        levelColor = chalk.gray;
        break;
      case "info":
        levelColor = chalk.blue;
        break;
      case "warn":
        levelColor = chalk.yellow;
        break;
      case "error":
        levelColor = chalk.red;
        break;
    }

    const timestampStr = chalk.gray(timestamp);
    const levelStr = levelColor(level.toUpperCase().padEnd(5));
    const messageStr = message;
    const contextStr = context ? chalk.gray(JSON.stringify(context)) : "";

    console.log(`${timestampStr} ${levelStr} ${messageStr} ${contextStr}`);
  }

  /**
   * Logs without colors
   */
  private logPlain(entry: LogEntry): void {
    const { timestamp, level, message, context } = entry;
    const contextStr = context ? JSON.stringify(context) : "";
    console.log(
      `${timestamp} ${level.toUpperCase().padEnd(5)} ${message} ${contextStr}`
    );
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger(false, true);

/**
 * Creates a logger with specific settings
 */
export const createLogger = (
  verbose: boolean = false,
  colors: boolean = true
): Logger => {
  return new Logger(verbose, colors);
};

/**
 * Logs a function execution
 */
export const logFunction = <T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  name: string,
  logger: Logger
) => {
  return (...args: T): R => {
    logger.debug(`Calling function: ${name}`, { args });
    try {
      const result = fn(...args);
      logger.debug(`Function completed: ${name}`, { result });
      return result;
    } catch (error) {
      logger.error(`Function failed: ${name}`, { error, args });
      throw error;
    }
  };
};

/**
 * Logs an async function execution
 */
export const logAsyncFunction = <T extends readonly unknown[], R>(
  fn: (...args: T) => Promise<R>,
  name: string,
  logger: Logger
) => {
  return async (...args: T): Promise<R> => {
    logger.debug(`Calling async function: ${name}`, { args });
    try {
      const result = await fn(...args);
      logger.debug(`Async function completed: ${name}`, { result });
      return result;
    } catch (error) {
      logger.error(`Async function failed: ${name}`, { error, args });
      throw error;
    }
  };
};

/**
 * Logs performance metrics
 */
export const logPerformance = <T extends readonly unknown[], R>(
  fn: (...args: T) => R,
  name: string,
  logger: Logger
) => {
  return (...args: T): R => {
    const start = Date.now();
    logger.debug(`Starting performance measurement: ${name}`);

    try {
      const result = fn(...args);
      const duration = Date.now() - start;
      logger.info(`Performance: ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Performance: ${name} failed after ${duration}ms`, {
        error,
      });
      throw error;
    }
  };
};

/**
 * Logs async performance metrics
 */
export const logAsyncPerformance = <T extends readonly unknown[], R>(
  fn: (...args: T) => Promise<R>,
  name: string,
  logger: Logger
) => {
  return async (...args: T): Promise<R> => {
    const start = Date.now();
    logger.debug(`Starting async performance measurement: ${name}`);

    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      logger.info(`Async performance: ${name} completed in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error(`Async performance: ${name} failed after ${duration}ms`, {
        error,
      });
      throw error;
    }
  };
};
