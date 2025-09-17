# Hook Standardization Template

## Standard Hook Structure

````typescript
// 1. React imports first
import React, { useState, useEffect, useCallback } from "react";

// 2. Third-party library imports (alphabetical)
import { useQuery, useMutation } from "@tanstack/react-query";
import { message } from "antd";

// 3. Internal imports (types → services → hooks → utils)
import { TypeName } from "../types";
import { serviceName } from "../services";
import { useOtherHook } from "./useOtherHook";
import { utilityFunction } from "../utils";

// 4. Types and interfaces (if component-specific)
interface HookOptions {
  // Configuration options
}

interface HookReturn {
  // Standardized return structure
  data: any | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  actions: {
    // Consistent action naming
    create?: () => void;
    update?: () => void;
    delete?: () => void;
    // Feature-specific actions
  };
}

/**
 * Hook description explaining purpose and main functionality
 *
 * @param options - Configuration options for the hook
 * @returns Object containing data, loading states, and actions
 *
 * @example
 * ```typescript
 * const { data, isLoading, actions } = useHookName({ param: 'value' });
 * ```
 */
export const useHookName = (options?: HookOptions): HookReturn => {
  // 5. State declarations (grouped logically)
  const [localState, setLocalState] = useState<Type>(initialValue);

  // 6. React hooks (useState, useEffect, useCallback, useMemo)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 7. Third-party hooks (useQuery, useMutation, etc.)
  const queryResult = useQuery({
    queryKey: ["key"],
    queryFn: serviceFn,
  });

  // 8. Custom hooks
  const { user } = useUser();

  // 9. Event handlers and functions (use useCallback when needed)
  const handleAction = useCallback(async () => {
    try {
      // Implementation
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    }
  }, [dependencies]);

  // 10. Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // 11. Return object with consistent structure
  return {
    // Data
    data: queryResult.data || null,

    // Loading states
    isLoading: queryResult.isLoading || loading,
    isError: queryResult.isError || !!error,
    error: queryResult.error || error,

    // Actions
    actions: {
      handleAction,
      // other actions
    },
  };
};
````

## Key Principles

1. **Consistent Import Order**: React → Third-party → Internal
2. **Standardized Return Object**: data, isLoading, isError, error, actions
3. **JSDoc Documentation**: Clear description with examples
4. **Error Handling**: Consistent error state management
5. **Action Grouping**: Related functions grouped in actions object
6. **Type Safety**: Full TypeScript coverage
7. **Performance**: Use useCallback and useMemo where appropriate
