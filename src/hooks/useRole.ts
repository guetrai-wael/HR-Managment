import { useState, useEffect, useRef } from "react";
import { useUser } from "./";
import supabase from "../services/supabaseClient";
import {
  ROLE_NAMES,
  isAdminRole,
  isEmployeeRole,
  isJobSeekerRole,
  type RoleName,
} from "../types/roles";

export const useRole = () => {
  const { user, authLoading, profile, profileLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isJobSeeker, setIsJobSeeker] = useState<boolean>(false);
  const [roleName, setRoleName] = useState<RoleName | null>(null);
  const [roleCheckLoading, setRoleCheckLoading] = useState<boolean>(true);
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
              // Set default role on error
              setRoleName(ROLE_NAMES.JOB_SEEKER);
              setIsAdmin(false);
              setIsEmployee(false);
              setIsJobSeeker(true);
            } else {
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
    } else {
      setRoleCheckLoading(false);
      setRoleName(null);
      setIsAdmin(false);
      setIsEmployee(false);
      setIsJobSeeker(false);
    }
  }, [user, profile, authLoading, profileLoading]);

  return {
    isAdmin,
    isEmployee,
    isJobSeeker,
    roleName,
    roleCheckLoading,
    loading: roleCheckLoading, // Backward compatibility alias
  };
};
