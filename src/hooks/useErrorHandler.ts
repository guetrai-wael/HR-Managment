import { useState, useCallback } from "react";
import { handleError } from "../utils/errorHandler";

// Update to store the error message as a string
export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);
  const [rawError, setRawError] = useState<unknown | null>(null);

  const catchError = useCallback((error: unknown, userMessage: string) => {
    handleError(error, { userMessage });
    setRawError(error);
    setError(userMessage); // Store the message string instead of the error object
    return error;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRawError(null);
  }, []);

  return {
    error, // This is now always a string
    rawError, // Keep the original error object for debugging
    catchError,
    clearError,
    isError: error !== null,
  };
};
