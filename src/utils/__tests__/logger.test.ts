import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock chalk before importing the module under test
vi.mock("chalk", () => ({
  default: {
    gray: vi.fn((text: string) => `[gray]${text}[/gray]`),
    blue: vi.fn((text: string) => `[blue]${text}[/blue]`),
    yellow: vi.fn((text: string) => `[yellow]${text}[/yellow]`),
    red: vi.fn((text: string) => `[red]${text}[/red]`),
  },
}));

// Mock console.log to capture output
const mockConsoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

// Import the module under test
import {
  Logger,
  createLogger,
  logFunction,
  logAsyncFunction,
  logPerformance,
  logAsyncPerformance,
} from "../logger";

describe("logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConsoleLog.mockClear();
  });

  describe("Logger class", () => {
    describe("constructor", () => {
      it("should create logger with default settings", () => {
        const logger = new Logger();
        expect(logger).toBeInstanceOf(Logger);
      });

      it("should create logger with custom settings", () => {
        const logger = new Logger(true, false);
        expect(logger).toBeInstanceOf(Logger);
      });
    });

    describe("debug method", () => {
      it("should log debug message when verbose is true", () => {
        const logger = new Logger(true, true);

        logger.debug("Debug message", { key: "value" });

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("[gray]DEBUG[/gray]")
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("Debug message")
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining('{"key":"value"}')
        );
      });

      it("should not log debug message when verbose is false", () => {
        const logger = new Logger(false, true);

        logger.debug("Debug message");

        expect(mockConsoleLog).not.toHaveBeenCalled();
      });

      it("should log without colors when colors is false", () => {
        const logger = new Logger(true, false);

        logger.debug("Debug message");

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("DEBUG")
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.not.stringContaining("[gray]")
        );
      });
    });

    describe("info method", () => {
      it("should log info message with colors", () => {
        const logger = new Logger(false, true);

        logger.info("Info message", { context: "test" });

        expect(mockConsoleLog).toHaveBeenCalledTimes(1);
        const logCall = mockConsoleLog.mock.calls[0][0] as string;
        expect(logCall).toContain("[blue]INFO [/blue]");
        expect(logCall).toContain("Info message");
        expect(logCall).toContain('{"context":"test"}');
      });

      it("should log info message without context", () => {
        const logger = new Logger(false, true);

        logger.info("Info message");

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("Info message")
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.not.stringContaining('{"')
        );
      });
    });

    describe("warn method", () => {
      it("should log warning message with colors", () => {
        const logger = new Logger(false, true);

        logger.warn("Warning message");

        expect(mockConsoleLog).toHaveBeenCalledTimes(1);
        const logCall = mockConsoleLog.mock.calls[0][0] as string;
        expect(logCall).toContain("[yellow]WARN [/yellow]");
        expect(logCall).toContain("Warning message");
      });
    });

    describe("error method", () => {
      it("should log error message with colors", () => {
        const logger = new Logger(false, true);

        logger.error("Error message");

        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("[red]ERROR[/red]")
        );
        expect(mockConsoleLog).toHaveBeenCalledWith(
          expect.stringContaining("Error message")
        );
      });
    });

    describe("log entry structure", () => {
      it("should include timestamp in log entries", () => {
        const logger = new Logger(false, false);
        const beforeTime = new Date().toISOString();

        logger.info("Test message");

        const afterTime = new Date().toISOString();
        const logCall = mockConsoleLog.mock.calls[0][0] as string;

        // Extract timestamp from log entry
        const timestampMatch = logCall.match(
          /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/
        );
        expect(timestampMatch).toBeTruthy();

        if (timestampMatch) {
          const logTime = timestampMatch[1];
          expect(logTime >= beforeTime).toBe(true);
          expect(logTime <= afterTime).toBe(true);
        }
      });

      it("should format log entry correctly", () => {
        const logger = new Logger(false, false);

        logger.info("Test message", { key: "value" });

        const logCall = mockConsoleLog.mock.calls[0][0] as string;
        expect(logCall).toMatch(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO\s+Test message {"key":"value"}$/
        );
      });
    });
  });

  describe("createLogger function", () => {
    it("should create logger with default settings", () => {
      const logger = createLogger();
      expect(logger).toBeInstanceOf(Logger);
    });

    it("should create logger with custom settings", () => {
      const logger = createLogger(true, false);
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe("logFunction wrapper", () => {
    it("should log function execution successfully", () => {
      const mockLogger = { debug: vi.fn() };
      const testFunction = (a: number, b: number) => a + b;

      const wrappedFunction = logFunction(
        testFunction,
        "add",
        mockLogger as any
      );
      const result = wrappedFunction(2, 3);

      expect(result).toBe(5);
      expect(mockLogger.debug).toHaveBeenCalledWith("Calling function: add", {
        args: [2, 3],
      });
      expect(mockLogger.debug).toHaveBeenCalledWith("Function completed: add", {
        result: 5,
      });
    });

    it("should log function execution with error", () => {
      const mockLogger = { debug: vi.fn(), error: vi.fn() };
      const testFunction = () => {
        throw new Error("Test error");
      };

      const wrappedFunction = logFunction(
        testFunction,
        "errorFunction",
        mockLogger as any
      );

      expect(() => wrappedFunction()).toThrow("Test error");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Calling function: errorFunction",
        { args: [] }
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Function failed: errorFunction",
        expect.objectContaining({
          error: expect.any(Error),
          args: [],
        })
      );
    });

    it("should handle function with no arguments", () => {
      const mockLogger = { debug: vi.fn() };
      const testFunction = () => "no args";

      const wrappedFunction = logFunction(
        testFunction,
        "noArgs",
        mockLogger as any
      );
      const result = wrappedFunction();

      expect(result).toBe("no args");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Calling function: noArgs",
        { args: [] }
      );
    });
  });

  describe("logAsyncFunction wrapper", () => {
    it("should log async function execution successfully", async () => {
      const mockLogger = { debug: vi.fn() };
      const testFunction = async (a: number, b: number) => a + b;

      const wrappedFunction = logAsyncFunction(
        testFunction,
        "asyncAdd",
        mockLogger as any
      );
      const result = await wrappedFunction(2, 3);

      expect(result).toBe(5);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Calling async function: asyncAdd",
        { args: [2, 3] }
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Async function completed: asyncAdd",
        { result: 5 }
      );
    });

    it("should log async function execution with error", async () => {
      const mockLogger = { debug: vi.fn(), error: vi.fn() };
      const testFunction = async () => {
        throw new Error("Async test error");
      };

      const wrappedFunction = logAsyncFunction(
        testFunction,
        "asyncError",
        mockLogger as any
      );

      await expect(wrappedFunction()).rejects.toThrow("Async test error");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Calling async function: asyncError",
        { args: [] }
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Async function failed: asyncError",
        expect.objectContaining({
          error: expect.any(Error),
          args: [],
        })
      );
    });
  });

  describe("logPerformance wrapper", () => {
    it("should log performance metrics for successful function", () => {
      const mockLogger = { debug: vi.fn(), info: vi.fn() };
      const testFunction = (a: number, b: number) => a + b;

      const wrappedFunction = logPerformance(
        testFunction,
        "perfAdd",
        mockLogger as any
      );
      const result = wrappedFunction(2, 3);

      expect(result).toBe(5);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting performance measurement: perfAdd"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(/Performance: perfAdd completed in \d+ms/)
      );
    });

    it("should log performance metrics for failed function", () => {
      const mockLogger = { debug: vi.fn(), error: vi.fn() };
      const testFunction = () => {
        throw new Error("Performance test error");
      };

      const wrappedFunction = logPerformance(
        testFunction,
        "perfError",
        mockLogger as any
      );

      expect(() => wrappedFunction()).toThrow("Performance test error");
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting performance measurement: perfError"
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(/Performance: perfError failed after \d+ms/),
        {
          error: expect.any(Error),
        }
      );
    });
  });

  describe("logAsyncPerformance wrapper", () => {
    it("should log performance metrics for successful async function", async () => {
      const mockLogger = { debug: vi.fn(), info: vi.fn() };
      const testFunction = async (a: number, b: number) => a + b;

      const wrappedFunction = logAsyncPerformance(
        testFunction,
        "asyncPerfAdd",
        mockLogger as any
      );
      const result = await wrappedFunction(2, 3);

      expect(result).toBe(5);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting async performance measurement: asyncPerfAdd"
      );
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /Async performance: asyncPerfAdd completed in \d+ms/
        )
      );
    });

    it("should log performance metrics for failed async function", async () => {
      const mockLogger = { debug: vi.fn(), error: vi.fn() };
      const testFunction = async () => {
        throw new Error("Async performance test error");
      };

      const wrappedFunction = logAsyncPerformance(
        testFunction,
        "asyncPerfError",
        mockLogger as any
      );

      await expect(wrappedFunction()).rejects.toThrow(
        "Async performance test error"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting async performance measurement: asyncPerfError"
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /Async performance: asyncPerfError failed after \d+ms/
        ),
        {
          error: expect.any(Error),
        }
      );
    });
  });

  describe("edge cases", () => {
    it("should handle undefined context gracefully", () => {
      const logger = new Logger(false, false);

      logger.info("Test message", undefined);

      const logCall = mockConsoleLog.mock.calls[0][0] as string;
      expect(logCall).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO\s+Test message {}$/
      );
    });

    it("should handle empty context object", () => {
      const logger = new Logger(false, false);

      logger.info("Test message", {});

      const logCall = mockConsoleLog.mock.calls[0][0] as string;
      expect(logCall).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z INFO\s+Test message {}$/
      );
    });

    it("should handle complex context objects", () => {
      const logger = new Logger(false, false);
      const complexContext = {
        nested: { value: "test" },
        array: [1, 2, 3],
        nullValue: null,
        undefinedValue: undefined,
      };

      logger.info("Test message", complexContext);

      const logCall = mockConsoleLog.mock.calls[0][0] as string;
      expect(logCall).toContain(
        '{"nested":{"value":"test"},"array":[1,2,3],"nullValue":null}'
      );
    });
  });
});
