import { message } from "antd";

type ErrorSeverity = "info" | "warning" | "error";

interface ErrorHandlerOptions {
  userMessage?: string;
  showNotification?: boolean;
  severity?: ErrorSeverity;
  report?: boolean;
}
/**
 * Centralized error handler for consistent error management
 *
 * @param error - The error object
 * @param options - Configuration options for error handling
 * @returns The original error for optional chaining
 */
export const handleError = (
  error: unknown,
  options: ErrorHandlerOptions = {}
): unknown => {
  const {
    userMessage = "An unexpected error occurred",
    showNotification = true,
    severity = "error",
    report = true,
  } = options;

  // Always log to console for debugging
  console.error("[App Error]:", error);

  // Show user-friendly notification if needed
  if (showNotification) {
    switch (severity) {
      case "info":
        message.info(userMessage);
        break;
      case "warning":
        message.warning(userMessage);
        break;
      case "error":
      default:
        message.error(userMessage);
    }
  }

  // Future enhancement: Report error to monitoring service
  if (report) {
    // Example: could integrate with Sentry, LogRocket, etc.
    // reportErrorToService(error, userMessage);
  }

  // Return the error for potential further handling
  return error;
};

/**
 * Wrap an async function with error handling
 *
 * @param fn - The async function to wrap
 * @param options - Error handling options
 * @returns A wrapped function with error handling
 */
export const withErrorHandling = <T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  options: ErrorHandlerOptions = {}
) => {
  return async (...args: Args): Promise<T | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      handleError(error, options);
      return null;
    }
  };
};
