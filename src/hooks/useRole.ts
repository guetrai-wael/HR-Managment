import { useState, useEffect, useRef } from "react";
import { useUser } from "./";
import supabase from "../services/supabaseClient";

export const useRole = () => {
  const { user, loading: userLoading } = useUser(); // Removed session
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  const [isJobSeeker, setIsJobSeeker] = useState<boolean>(false); // Add new state for job seeker
  // This state tracks if the *role check itself* is in progress
  const [roleCheckLoading, setRoleCheckLoading] = useState<boolean>(true);
  // Ref to prevent running the check multiple times unnecessarily if dependencies change rapidly
  // const hasCheckedRole = useRef(false); // Removed
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    if (userLoading) {
      // console.log("useRole Effect: Waiting for user context...");
      // currentUserId.current = null; // Keep currentUserId to compare when userLoading is false
      // hasCheckedRole.current = false; // Removed
      setRoleCheckLoading(true);
      return;
    }

    if (user) {
      // Only trigger a new role check if the user ID has actually changed.
      if (currentUserId.current !== user.id) {
        // console.log(
        //   `useRole Effect: User context loaded or user changed. User ${user.id} found. Triggering role check.`
        // );
        currentUserId.current = user.id;
        // hasCheckedRole.current = true; // Removed - not needed with currentUserId check
        setRoleCheckLoading(true); // Set loading true *before* the async call

        const checkUserRole = async (userId: string) => {
          // console.log(
          //   "useRole: checkUserRole - Checking role for user:",
          //   userId
          // );
          try {
            const { data, error } = await supabase
              .from("user_roles")
              .select("role_id")
              .eq("user_id", userId)
              .maybeSingle();

            if (error) {
              // console.error(
              //   "useRole: checkUserRole - Error fetching user role:",
              //   error
              // );
              setIsAdmin(false);
              setIsEmployee(false);
              setIsJobSeeker(true);
            } else {
              const isAdminResult = data?.role_id === 1;
              const isEmployeeResult = data?.role_id === 2;
              const isJobSeekerResult = data?.role_id === 3 || data === null;

              setIsAdmin(isAdminResult);
              setIsEmployee(isEmployeeResult);
              setIsJobSeeker(isJobSeekerResult);

              // console.log("useRole: checkUserRole - User role checked:", {
              //   isAdmin: isAdminResult,
              //   isEmployee: isEmployeeResult,
              //   isJobSeeker: isJobSeekerResult,
              // });
            }
          } catch (error) {
            console.error("useRole: checkUserRole - Unexpected error:", error); // Log the error
            setIsAdmin(false);
            setIsEmployee(false);
            setIsJobSeeker(true);
          } finally {
            // console.log(
            //   "useRole: checkUserRole - Finished. Setting roleCheckLoading false."
            // );
            setRoleCheckLoading(false);
          }
        };
        checkUserRole(user.id);
      } else {
        // User ID is the same, and userLoading is false.
        // This means a check for this user was previously initiated.
        // We don't change roleCheckLoading here; it will be false if the check finished,
        // or true if it's still in progress from the initial trigger.
        // console.log(
        //   `useRole Effect: User ${user.id} is the same and user context is loaded. Role check status is determined by ongoing/completed check.`
        // );
      }
    } else {
      // No user
      // console.log(
      //   "useRole Effect: User context loaded, no user. Setting defaults."
      // );
      currentUserId.current = null;
      // hasCheckedRole.current = false; // Removed
      setIsAdmin(false);
      setIsEmployee(false);
      setIsJobSeeker(false);
      setRoleCheckLoading(false);
    }
  }, [user, userLoading]); // Dependencies: user, userLoading

  // The hook reports loading if the user context is loading OR the role check is loading
  const combinedLoading = userLoading || roleCheckLoading;

  // Return the updated states including isJobSeeker
  return { isAdmin, isEmployee, isJobSeeker, loading: combinedLoading };
};

export default useRole;
