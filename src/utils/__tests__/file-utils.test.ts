import { describe, it, expect, beforeEach, vi } from "vitest";
import { homedir } from "os";
import { join, dirname, extname, basename, isAbsolute } from "path";

// Mock fs/promises before importing the module under test
vi.mock("fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
  stat: vi.fn(),
  readdir: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock("fs", () => ({
  existsSync: vi.fn(),
}));

// Import the module under test
import {
  expandTilde,
  resolvePath,
  safeReadFile,
  safeWriteFile,
  safeMkdir,
  safeStat,
  safeReaddir,
  safeUnlink,
  fileExists,
  dirExists,
  getFileExtension,
  getFileName,
  getBaseName,
  getDirName,
  joinPaths,
  getFileSize,
  getFileModTime,
  isFileReadable,
  isFileWritable,
  createBackup,
  restoreFromBackup,
} from "../file-utils";

import { readFile, writeFile, mkdir, stat, readdir, unlink } from "fs/promises";
import { existsSync } from "fs";

describe("file-utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("expandTilde", () => {
    it("should expand ~/ to home directory", () => {
      const result = expandTilde("~/test/path");
      expect(result).toBe(join(homedir(), "test/path"));
    });

    it("should expand ~ to home directory", () => {
      const result = expandTilde("~");
      expect(result).toBe(homedir());
    });

    it("should return path unchanged if no tilde", () => {
      const result = expandTilde("/absolute/path");
      expect(result).toBe("/absolute/path");
    });

    it("should handle relative paths without tilde", () => {
      const result = expandTilde("relative/path");
      expect(result).toBe("relative/path");
    });
  });

  describe("resolvePath", () => {
    it("should resolve absolute paths unchanged", () => {
      const result = resolvePath("/absolute/path");
      expect(result).toBe("/absolute/path");
    });

    it("should resolve relative paths with current working directory", () => {
      const result = resolvePath("relative/path");
      expect(result).toBe(join(process.cwd(), "relative/path"));
    });

    it("should expand tilde and resolve absolute paths", () => {
      const result = resolvePath("~/test");
      expect(result).toBe(join(homedir(), "test"));
    });

    it("should expand tilde and resolve relative paths", () => {
      const result = resolvePath("~/test/../other");
      expect(result).toBe(join(homedir(), "other"));
    });
  });

  describe("safeReadFile", () => {
    it("should successfully read a file", async () => {
      const mockContent = "file content";
      (readFile as any).mockResolvedValue(mockContent);

      const result = await safeReadFile("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.content).toBe(mockContent);
      expect(result.error).toBeUndefined();
      expect(readFile).toHaveBeenCalledWith("/test/file.txt", "utf8");
    });

    it("should handle file read errors", async () => {
      const mockError = new Error("File not found");
      (readFile as any).mockRejectedValue(mockError);

      const result = await safeReadFile("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.content).toBeUndefined();
      expect(result.error).toContain("Failed to read file");
      expect(result.error).toContain("File not found");
    });

    it("should call logger debug on success", async () => {
      const mockLogger = { debug: vi.fn() };
      (readFile as any).mockResolvedValue("content");

      await safeReadFile("/test/file.txt", mockLogger as any);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Successfully read file: /test/file.txt"
      );
    });

    it("should call logger error on failure", async () => {
      const mockLogger = { error: vi.fn() };
      (readFile as any).mockRejectedValue(new Error("Error"));

      await safeReadFile("/test/file.txt", mockLogger as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to read file")
      );
    });
  });

  describe("safeWriteFile", () => {
    it("should successfully write a file", async () => {
      (existsSync as any).mockReturnValue(true);
      (writeFile as any).mockResolvedValue(undefined);

      const result = await safeWriteFile("/test/file.txt", "content");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(writeFile).toHaveBeenCalledWith(
        "/test/file.txt",
        "content",
        "utf8"
      );
    });

    it("should create directory if it doesn't exist", async () => {
      (existsSync as any).mockReturnValue(false);
      (mkdir as any).mockResolvedValue(undefined);
      (writeFile as any).mockResolvedValue(undefined);

      const result = await safeWriteFile("/test/file.txt", "content");

      expect(result.success).toBe(true);
      expect(mkdir).toHaveBeenCalledWith("/test", { recursive: true });
    });

    it("should handle write errors", async () => {
      (existsSync as any).mockReturnValue(true);
      (writeFile as any).mockRejectedValue(new Error("Write failed"));

      const result = await safeWriteFile("/test/file.txt", "content");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to write file");
    });
  });

  describe("safeMkdir", () => {
    it("should successfully create directory", async () => {
      (mkdir as any).mockResolvedValue(undefined);

      const result = await safeMkdir("/test/dir");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mkdir).toHaveBeenCalledWith("/test/dir", { recursive: true });
    });

    it("should handle directory creation errors", async () => {
      (mkdir as any).mockRejectedValue(new Error("Permission denied"));

      const result = await safeMkdir("/test/dir");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create directory");
    });
  });

  describe("safeStat", () => {
    it("should successfully get file stats", async () => {
      const mockStats = { size: 1024, mtime: new Date() };
      (stat as any).mockResolvedValue(mockStats);

      const result = await safeStat("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.stats).toBe(mockStats);
      expect(result.error).toBeUndefined();
    });

    it("should handle stat errors", async () => {
      (stat as any).mockRejectedValue(new Error("File not found"));

      const result = await safeStat("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.stats).toBeUndefined();
      expect(result.error).toContain("Failed to get stats");
    });
  });

  describe("safeReaddir", () => {
    it("should successfully read directory", async () => {
      const mockFiles = ["file1.txt", "file2.txt"];
      (readdir as any).mockResolvedValue(mockFiles);

      const result = await safeReaddir("/test/dir");

      expect(result.success).toBe(true);
      expect(result.files).toEqual(mockFiles);
      expect(result.error).toBeUndefined();
    });

    it("should handle readdir errors", async () => {
      (readdir as any).mockRejectedValue(new Error("Permission denied"));

      const result = await safeReaddir("/test/dir");

      expect(result.success).toBe(false);
      expect(result.files).toBeUndefined();
      expect(result.error).toContain("Failed to read directory");
    });
  });

  describe("safeUnlink", () => {
    it("should successfully delete file", async () => {
      (unlink as any).mockResolvedValue(undefined);

      const result = await safeUnlink("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(unlink).toHaveBeenCalledWith("/test/file.txt");
    });

    it("should handle unlink errors", async () => {
      (unlink as any).mockRejectedValue(new Error("File not found"));

      const result = await safeUnlink("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to delete file");
    });
  });

  describe("fileExists", () => {
    it("should return true when file exists", () => {
      (existsSync as any).mockReturnValue(true);

      const result = fileExists("/test/file.txt");

      expect(result).toBe(true);
      expect(existsSync).toHaveBeenCalledWith("/test/file.txt");
    });

    it("should return false when file doesn't exist", () => {
      (existsSync as any).mockReturnValue(false);

      const result = fileExists("/nonexistent/file.txt");

      expect(result).toBe(false);
    });
  });

  describe("dirExists", () => {
    it("should return true when directory exists", () => {
      (existsSync as any).mockReturnValue(true);

      const result = dirExists("/test/dir");

      expect(result).toBe(true);
      expect(existsSync).toHaveBeenCalledWith("/test/dir");
    });

    it("should return false when directory doesn't exist", () => {
      (existsSync as any).mockReturnValue(false);

      const result = dirExists("/nonexistent/dir");

      expect(result).toBe(false);
    });
  });

  describe("getFileExtension", () => {
    it("should return file extension", () => {
      expect(getFileExtension("file.txt")).toBe(".txt");
      expect(getFileExtension("file.js")).toBe(".js");
      expect(getFileExtension("file")).toBe("");
    });

    it("should handle multiple dots in filename", () => {
      expect(getFileExtension("file.min.js")).toBe(".js");
    });
  });

  describe("getFileName", () => {
    it("should return filename without extension", () => {
      expect(getFileName("file.txt")).toBe("file");
      expect(getFileName("file.min.js")).toBe("file.min");
      expect(getFileName("file")).toBe("file");
    });
  });

  describe("getBaseName", () => {
    it("should return filename with extension", () => {
      expect(getBaseName("file.txt")).toBe("file.txt");
      expect(getBaseName("file.min.js")).toBe("file.min.js");
      expect(getBaseName("file")).toBe("file");
    });
  });

  describe("getDirName", () => {
    it("should return directory name", () => {
      expect(getDirName("/path/to/file.txt")).toBe("/path/to");
      expect(getDirName("file.txt")).toBe(".");
    });
  });

  describe("joinPaths", () => {
    it("should join multiple paths", () => {
      expect(joinPaths("path1", "path2", "path3")).toBe("path1/path2/path3");
      expect(joinPaths("/absolute", "relative")).toBe("/absolute/relative");
    });
  });

  describe("getFileSize", () => {
    it("should return file size", async () => {
      const mockStats = { size: 2048 };
      (stat as any).mockResolvedValue(mockStats);

      const result = await getFileSize("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.size).toBe(2048);
    });

    it("should handle file size errors", async () => {
      (stat as any).mockRejectedValue(new Error("File not found"));

      const result = await getFileSize("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to get file size");
    });
  });

  describe("getFileModTime", () => {
    it("should return file modification time", async () => {
      const mockDate = new Date("2023-01-01T00:00:00Z");
      const mockStats = { mtime: mockDate };
      (stat as any).mockResolvedValue(mockStats);

      const result = await getFileModTime("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.modTime).toBe(mockDate);
    });

    it("should handle modification time errors", async () => {
      (stat as any).mockRejectedValue(new Error("File not found"));

      const result = await getFileModTime("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to get file modification time");
    });
  });

  describe("isFileReadable", () => {
    it("should return true for readable file", async () => {
      (readFile as any).mockResolvedValue("content");

      const result = await isFileReadable("/test/file.txt");

      expect(result).toBe(true);
      expect(readFile).toHaveBeenCalledWith("/test/file.txt", "utf8");
    });

    it("should return false for unreadable file", async () => {
      (readFile as any).mockRejectedValue(new Error("Permission denied"));

      const result = await isFileReadable("/test/file.txt");

      expect(result).toBe(false);
    });
  });

  describe("isFileWritable", () => {
    it("should return true for writable file", async () => {
      (writeFile as any).mockResolvedValue(undefined);
      (unlink as any).mockResolvedValue(undefined);

      const result = await isFileWritable("/test/file.txt");

      expect(result).toBe(true);
      expect(writeFile).toHaveBeenCalledWith("/test/file.txt.test", "test");
      expect(unlink).toHaveBeenCalledWith("/test/file.txt.test");
    });

    it("should return false for unwritable file", async () => {
      (writeFile as any).mockRejectedValue(new Error("Permission denied"));

      const result = await isFileWritable("/test/file.txt");

      expect(result).toBe(false);
    });
  });

  describe("createBackup", () => {
    it("should create backup file", async () => {
      (readFile as any).mockResolvedValue("original content");
      (writeFile as any).mockResolvedValue(undefined);

      const result = await createBackup("/test/file.txt");

      expect(result.success).toBe(true);
      expect(result.backupPath).toMatch(
        /\/test\/file\.txt\.backup\.\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z/
      );
      expect(readFile).toHaveBeenCalledWith("/test/file.txt", "utf8");
      expect(writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/\.backup\./),
        "original content",
        "utf8"
      );
    });

    it("should handle backup creation errors", async () => {
      (readFile as any).mockRejectedValue(new Error("File not found"));

      const result = await createBackup("/nonexistent/file.txt");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to create backup");
    });
  });

  describe("restoreFromBackup", () => {
    it("should restore file from backup", async () => {
      (readFile as any).mockResolvedValue("backup content");
      (writeFile as any).mockResolvedValue(undefined);

      const result = await restoreFromBackup(
        "/test/file.txt.backup",
        "/test/file.txt"
      );

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(readFile).toHaveBeenCalledWith("/test/file.txt.backup", "utf8");
      expect(writeFile).toHaveBeenCalledWith(
        "/test/file.txt",
        "backup content",
        "utf8"
      );
    });

    it("should handle restore errors", async () => {
      (readFile as any).mockRejectedValue(new Error("Backup not found"));

      const result = await restoreFromBackup(
        "/nonexistent/backup",
        "/test/file.txt"
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain("Failed to restore file from backup");
    });
  });
});
