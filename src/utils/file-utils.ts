/**
 * File utilities module
 * Provides file system operations with error handling
 */

import { readFile, writeFile, mkdir, stat, readdir, unlink } from "fs/promises";
import { existsSync } from "fs";
import { join, dirname, extname, basename, isAbsolute } from "path";
import { homedir } from "os";
import type { Logger } from "./logger";

/**
 * Expands tilde (~) to home directory
 */
export const expandTilde = (path: string): string => {
  if (path.startsWith("~/")) {
    return join(homedir(), path.slice(2));
  }
  if (path === "~") {
    return homedir();
  }
  return path;
};

/**
 * Resolves a path to absolute, expanding tilde if present
 */
export const resolvePath = (path: string): string => {
  // First expand tilde if present
  const expandedPath = expandTilde(path);

  if (isAbsolute(expandedPath)) {
    return expandedPath;
  }
  return join(process.cwd(), expandedPath);
};

/**
 * Safely reads a file
 */
export const safeReadFile = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; content?: string; error?: string }> => {
  try {
    const content = await readFile(filePath, "utf8");
    logger?.debug(`Successfully read file: ${filePath}`);
    return { success: true, content };
  } catch (error) {
    const errorMsg = `Failed to read file ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Safely writes a file
 */
export const safeWriteFile = async (
  filePath: string,
  content: string,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Ensure directory exists
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true });
      logger?.debug(`Created directory: ${dir}`);
    }

    await writeFile(filePath, content, "utf8");
    logger?.debug(`Successfully wrote file: ${filePath}`);
    return { success: true };
  } catch (error) {
    const errorMsg = `Failed to write file ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Safely creates a directory
 */
export const safeMkdir = async (
  dirPath: string,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> => {
  try {
    await mkdir(dirPath, { recursive: true });
    logger?.debug(`Successfully created directory: ${dirPath}`);
    return { success: true };
  } catch (error) {
    const errorMsg = `Failed to create directory ${dirPath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Safely gets file stats
 */
export const safeStat = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; stats?: any; error?: string }> => {
  try {
    const stats = await stat(filePath);
    logger?.debug(`Successfully got stats for: ${filePath}`);
    return { success: true, stats };
  } catch (error) {
    const errorMsg = `Failed to get stats for ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Safely reads a directory
 */
export const safeReaddir = async (
  dirPath: string,
  logger?: Logger
): Promise<{ success: boolean; files?: string[]; error?: string }> => {
  try {
    const files = await readdir(dirPath);
    logger?.debug(
      `Successfully read directory: ${dirPath} (${files.length} files)`
    );
    return { success: true, files };
  } catch (error) {
    const errorMsg = `Failed to read directory ${dirPath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Safely deletes a file
 */
export const safeUnlink = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> => {
  try {
    await unlink(filePath);
    logger?.debug(`Successfully deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    const errorMsg = `Failed to delete file ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Checks if a file exists
 */
export const fileExists = (filePath: string): boolean => {
  return existsSync(filePath);
};

/**
 * Checks if a directory exists
 */
export const dirExists = (dirPath: string): boolean => {
  return existsSync(dirPath);
};

/**
 * Gets file extension
 */
export const getFileExtension = (filePath: string): string => {
  return extname(filePath);
};

/**
 * Gets file name without extension
 */
export const getFileName = (filePath: string): string => {
  return basename(filePath, extname(filePath));
};

/**
 * Gets file name with extension
 */
export const getBaseName = (filePath: string): string => {
  return basename(filePath);
};

/**
 * Gets directory name
 */
export const getDirName = (filePath: string): string => {
  return dirname(filePath);
};

/**
 * Joins paths safely
 */
export const joinPaths = (...paths: string[]): string => {
  return join(...paths);
};

/**
 * Gets file size in bytes
 */
export const getFileSize = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; size?: number; error?: string }> => {
  try {
    const stats = await stat(filePath);
    const size = stats.size;
    logger?.debug(`File size for ${filePath}: ${size} bytes`);
    return { success: true, size };
  } catch (error) {
    const errorMsg = `Failed to get file size for ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Gets file modification time
 */
export const getFileModTime = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; modTime?: Date; error?: string }> => {
  try {
    const stats = await stat(filePath);
    const modTime = stats.mtime;
    logger?.debug(`File modification time for ${filePath}: ${modTime}`);
    return { success: true, modTime };
  } catch (error) {
    const errorMsg = `Failed to get file modification time for ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Checks if a file is readable
 */
export const isFileReadable = async (
  filePath: string,
  logger?: Logger
): Promise<boolean> => {
  try {
    await readFile(filePath, "utf8");
    logger?.debug(`File is readable: ${filePath}`);
    return true;
  } catch {
    logger?.debug(`File is not readable: ${filePath}`);
    return false;
  }
};

/**
 * Checks if a file is writable
 */
export const isFileWritable = async (
  filePath: string,
  logger?: Logger
): Promise<boolean> => {
  try {
    // Try to write a test file
    const testFile = `${filePath}.test`;
    await writeFile(testFile, "test");
    await unlink(testFile);
    logger?.debug(`File is writable: ${filePath}`);
    return true;
  } catch {
    logger?.debug(`File is not writable: ${filePath}`);
    return false;
  }
};

/**
 * Creates a backup of a file
 */
export const createBackup = async (
  filePath: string,
  logger?: Logger
): Promise<{ success: boolean; backupPath?: string; error?: string }> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupPath = `${filePath}.backup.${timestamp}`;

    const content = await readFile(filePath, "utf8");
    await writeFile(backupPath, content, "utf8");

    logger?.debug(`Created backup: ${backupPath}`);
    return { success: true, backupPath };
  } catch (error) {
    const errorMsg = `Failed to create backup for ${filePath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};

/**
 * Restores a file from backup
 */
export const restoreFromBackup = async (
  backupPath: string,
  originalPath: string,
  logger?: Logger
): Promise<{ success: boolean; error?: string }> => {
  try {
    const content = await readFile(backupPath, "utf8");
    await writeFile(originalPath, content, "utf8");

    logger?.debug(`Restored file from backup: ${originalPath}`);
    return { success: true };
  } catch (error) {
    const errorMsg = `Failed to restore file from backup ${backupPath}: ${error}`;
    logger?.error(errorMsg);
    return { success: false, error: errorMsg };
  }
};
