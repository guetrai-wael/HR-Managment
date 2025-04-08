import { useState, useEffect } from "react";
import { useUser } from "./";
import supabase from "../services/supabaseClient";

export const useRole = () => {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsEmployee(false);
        setLoading(false);
        return;
      }

      try {
        const { data: adminData, error: adminError } = await supabase.rpc(
          "has_role",
          {
            user_uuid: user.id,
            role_name: "admin",
          }
        );

        if (adminError) throw adminError;
        const { data: employeeData, error: employeeError } = await supabase.rpc(
          "has_role",
          {
            user_uuid: user.id,
            role_name: "employee",
          }
        );

        if (employeeError) throw employeeError;

        setIsAdmin(adminData || false);
        setIsEmployee(employeeData || false);
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
  }, [user]);

  return { isAdmin, isEmployee, loading };
};

export default useRole;
