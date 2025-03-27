import { useContext } from "react";
import { UserContext } from "../context/UserContext";

/**
 * Hook for accessing the authenticated user data from UserContext
 * returns User context containing user data and loading state
 */
export const useUser = () => {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
};
