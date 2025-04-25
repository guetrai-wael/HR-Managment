import { useState, useEffect } from "react";
import { useUser } from "./";
import supabase from "../services/supabaseClient";

export const useRole = () => {
  const { user, session, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsEmployee(false);
        setLoading(false);
        return;
      }

      try {
        console.log("Checking role for user:", user.id);
        const { data, error } = await supabase
          .from("user_roles")
          .select("role_id")
          .eq("user_id", user.id)
          .single();

        if (error) throw error;

        // Role ID 1 is admin
        setIsAdmin(data?.role_id === 1);
        setIsEmployee(data?.role_id === 2 || !data);

        console.log("User role checked:", {
          isAdmin: data?.role_id === 1,
          isEmployee: data?.role_id === 2,
        });
      } catch (error) {
        console.error("Error checking user role:", error);
        // Default to employee if there's an error
        setIsAdmin(false);
        setIsEmployee(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, session]);

  return { isAdmin, isEmployee, loading: loading || userLoading };
};

export default useRole;
