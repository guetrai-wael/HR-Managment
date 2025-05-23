import {
  useMutation,
  UseMutationOptions,
  UseMutationResult,
  QueryKey,
  QueryClient,
} from "@tanstack/react-query";
import { message } from "antd";

interface MutationHandlerOptions<TData, TError, TVariables, TContext>
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  queryClient: QueryClient;
  successMessage?: string;
  errorMessagePrefix?: string;
  invalidateQueries?: QueryKey[];
}

export function useMutationHandler<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: MutationHandlerOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const {
    queryClient,
    successMessage,
    errorMessagePrefix = "Operation failed",
    invalidateQueries = [],
    onSuccess,
    onError, // Destructured onError
    ...mutationOptions
  } = options;

  return useMutation<TData, TError, TVariables, TContext>({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      if (successMessage) {
        message.success(successMessage);
      }
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey });
      });
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (
      error: TError,
      variables: TVariables,
      context: TContext | undefined
    ) => {
      let displayMessage = "An unexpected error occurred.";

      if (error instanceof Error) {
        displayMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
      ) {
        displayMessage = (error as { message: string }).message;
      } else if (typeof error === "string") {
        displayMessage = error;
      }

      message.error(`${errorMessagePrefix}: ${displayMessage}`);
      if (onError) {
        // Use the destructured onError from options
        onError(error, variables, context);
      }
    },
  });
}
