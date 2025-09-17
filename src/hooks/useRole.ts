import { useState, useEffect, useRef } from "react";

import {
  ROLE_NAMES,
  isAdminRole,
  isEmployeeRole,
  isJobSeekerRole,
  type RoleName,
} from "../types/roles";
import supabase from "../services/supabaseClient";
import { useUser } from "./useUser";

/**
 * Hook for determining the current user's role and permissions
 *
 * Fetches and manages user role information, providing boolean flags
 * for different role types and loading states.
 *
 * @returns Object containing role information and loading state
 *
 * @example
 * ```typescript
 * const { isAdmin, isEmployee, isJobSeeker, roleName, isLoading } = useRole();
 *
 * if (isLoading) {
 *   return <LoadingSpinner />;
 * }
 *
 * if (isAdmin) {
 *   return <AdminDashboard />;
 * }
 * ```
 */
export const useRole = () => {
  const { user, authLoading, profile, profileLoading } = useUser();

  // State declarations
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isJobSeeker, setIsJobSeeker] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<RoleName | null>(null);
  const [roleCheckLoading, setRoleCheckLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || profileLoading) {
      setRoleCheckLoading(true);
      return;
    }

    if (user && profile) {
      if (currentUserId.current !== user.id) {
        currentUserId.current = user.id;
        setRoleCheckLoading(true);

        const checkUserRole = async (userId: string) => {
          try {
            // Fetch role with name instead of just ID
            const { data, error } = await supabase
              .from("user_roles")
              .select(
                `
                role_id,
                roles!inner(
                  id,
                  name
                )
              `
              )
              .eq("user_id", userId)
              .maybeSingle();

            if (error) {
              console.error("useRole: Error fetching user role:", error);
              setError(new Error(error.message || "Failed to fetch user role"));
              // Set default role on error
              setRoleName(ROLE_NAMES.JOB_SEEKER);
              setIsAdmin(false);
              setIsEmployee(false);
              setIsJobSeeker(true);
            } else {
              setError(null); // Clear any previous errors
              // Extract role name from the nested data (handle array response)
              const roleData = Array.isArray(data?.roles)
                ? data.roles[0]
                : data?.roles;
              const currentRoleName =
                (roleData?.name as RoleName) || ROLE_NAMES.JOB_SEEKER;

              setRoleName(currentRoleName);
              setIsAdmin(isAdminRole(currentRoleName));
              setIsEmployee(isEmployeeRole(currentRoleName));
              setIsJobSeeker(isJobSeekerRole(currentRoleName));
            }
          } catch (e) {
            console.error("useRole: Unexpected error in checkUserRole:", e);
            // Set default role on error
            setRoleName(ROLE_NAMES.JOB_SEEKER);
            setIsAdmin(false);
            setIsEmployee(false);
            setIsJobSeeker(true);
          } finally {
            setRoleCheckLoading(false);
          }
        };

        checkUserRole(user.id);
      }
    } else if (!authLoading && !profileLoading) {
      // Only set loading to false if we're sure auth and profile loading are complete
      setRoleCheckLoading(false);
      setRoleName(null);
      setIsAdmin(false);
      setIsEmployee(false);
      setIsJobSeeker(false);
    }
  }, [user, profile, authLoading, profileLoading]);

  return {
    // Data
    data: {
      isAdmin,
      isEmployee,
      isJobSeeker,
      roleName,
    },

    // Loading states
    isLoading: roleCheckLoading,
    isError: !!error,
    error,

    // Actions (none for this hook)
    actions: {},
  };
};
