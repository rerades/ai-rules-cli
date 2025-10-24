/**
 * Spinner module for loading indicators
 */

import ora, { type Ora } from "ora";
import type { GenerationProgress } from "../types/wizard.types";

/**
 * Creates a spinner instance
 */
export const createSpinner = (text: string): Ora => {
  return ora({
    text,
    spinner: "dots",
    color: "cyan",
  });
};

/**
 * Creates a spinner for rule loading
 */
export const createLoadingSpinner = (): Ora => {
  return createSpinner("Loading rules from repository...");
};

/**
 * Creates a spinner for validation
 */
export const createValidationSpinner = (): Ora => {
  return createSpinner("Validating rules...");
};

/**
 * Creates a spinner for dependency resolution
 */
export const createDependencySpinner = (): Ora => {
  return createSpinner("Resolving dependencies...");
};

/**
 * Creates a spinner for conflict detection
 */
export const createConflictSpinner = (): Ora => {
  return createSpinner("Detecting conflicts...");
};

/**
 * Creates a spinner for file generation
 */
export const createGenerationSpinner = (): Ora => {
  return createSpinner("Generating rule files...");
};

/**
 * Creates a spinner for index generation
 */
export const createIndexSpinner = (): Ora => {
  return createSpinner("Generating index file...");
};

/**
 * Updates spinner with progress information
 */
export const updateSpinnerProgress = (
  spinner: Ora,
  progress: GenerationProgress
): void => {
  const { current, total, currentFile, stage } = progress;
  const percentage = Math.round((current / total) * 100);

  let stageText: string;
  switch (stage) {
    case "loading":
      stageText = "Loading rules";
      break;
    case "validating":
      stageText = "Validating";
      break;
    case "generating":
      stageText = "Generating files";
      break;
    case "indexing":
      stageText = "Creating index";
      break;
    case "complete":
      stageText = "Complete";
      break;
    default:
      stageText = "Processing";
  }

  const text = `${stageText} (${current}/${total}) ${percentage}%`;
  const suffix = currentFile ? `\n  ${currentFile}` : "";

  spinner.text = text + suffix;
};

/**
 * Creates a spinner with custom text
 */
export const createCustomSpinner = (text: string): Ora => {
  return createSpinner(text);
};

/**
 * Stops spinner with success message
 */
export const stopSpinnerSuccess = (spinner: Ora, message: string): void => {
  spinner.succeed(message);
};

/**
 * Stops spinner with error message
 */
export const stopSpinnerError = (spinner: Ora, message: string): void => {
  spinner.fail(message);
};

/**
 * Stops spinner with warning message
 */
export const stopSpinnerWarning = (spinner: Ora, message: string): void => {
  spinner.warn(message);
};

/**
 * Stops spinner with info message
 */
export const stopSpinnerInfo = (spinner: Ora, message: string): void => {
  spinner.info(message);
};
