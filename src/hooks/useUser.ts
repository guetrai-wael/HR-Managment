import { useContext } from "react";

import { UserContext } from "../context/UserContext";

/**
 * Hook for accessing authenticated user data and profile information
 *
 * Provides access to the current user's authentication state, profile data,
 * and loading states from the UserContext.
 *
 * @returns Object containing user data, profile, and loading states
 *
 * @example
 * ```typescript
 * const { user, profile, authLoading, profileLoading } = useUser();
 *
 * if (authLoading || profileLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (!user) {
 *   return <LoginPrompt />;
 * }
 * ```
 *
 * @throws {Error} When used outside of UserProvider
 */
export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
