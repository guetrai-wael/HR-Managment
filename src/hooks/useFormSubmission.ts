import { useState } from "react";

/**
 * Hook for handling form submission with loading and error states
 * param onSubmit Function that handles the actual form submission
 * returns Object containing submission handler and state variables
 */
export const useFormSubmission = <T,>(onSubmit: (data: T) => Promise<void>) => {
  const [loading, setLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const handleSubmit = async (data: T) => {
    setFormSubmitted(true);
    setLoading(true);
    setError(null);

    try {
      await onSubmit(data);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An error occurred");
      console.error("Form submission error:", error);
      setError(error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSubmit,
    loading,
    formSubmitted,
    error,
  };
};
