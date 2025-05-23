import { useState, useEffect, useRef } from "react";
import { useUser } from "./";
import supabase from "../services/supabaseClient";

export const useRole = () => {
  const { user, authLoading, profile, profileLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isJobSeeker, setIsJobSeeker] = useState<boolean>(false);
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
            const { data, error } = await supabase
              .from("user_roles")
              .select("role_id")
              .eq("user_id", userId)
              .maybeSingle();

            if (error) {
              console.error("useRole: Error fetching user role_id:", error);
              setIsAdmin(false);
              setIsEmployee(false);
              setIsJobSeeker(true);
            } else {
              const roleId = data?.role_id;
              setIsAdmin(roleId === 1);
              setIsEmployee(roleId === 2);
              setIsJobSeeker(roleId === 3 || !roleId);
            }
          } catch (e) {
            console.error("useRole: Unexpected error in checkUserRole:", e);
            setIsAdmin(false);
            setIsEmployee(false);
            setIsJobSeeker(true);
          } finally {
            setRoleCheckLoading(false);
          }
        };
        checkUserRole(user.id);
      } else if (currentUserId.current === user.id) {
        // User ID is the same, role check was already done or in progress for this user.
      }
    } else {
      currentUserId.current = null;
      setIsAdmin(false);
      setIsEmployee(false);
      setIsJobSeeker(false);
      setRoleCheckLoading(false);
    }
  }, [user, authLoading, profile, profileLoading]);

  return { isAdmin, isEmployee, isJobSeeker, loading: roleCheckLoading };
};

export default useRole;
