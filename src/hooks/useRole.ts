import { useState, useEffect, useRef } from "react"; // <<< Import useRef
import { useUser } from "./";
import supabase from "../services/supabaseClient";

export const useRole = () => {
  const { user, session, loading: userLoading } = useUser();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isEmployee, setIsEmployee] = useState<boolean>(false);
  // This state tracks if the *role check itself* is in progress
  const [roleCheckLoading, setRoleCheckLoading] = useState<boolean>(true);
  // Ref to prevent running the check multiple times unnecessarily if dependencies change rapidly
  const hasCheckedRole = useRef(false);
  const currentUserId = useRef<string | null>(null);

  useEffect(() => {
    // --- Effect Logic ---
    if (userLoading) {
      // Still waiting for user context, ensure role check hasn't run and reset state
      console.log("useRole Effect: Waiting for user context...");
      hasCheckedRole.current = false; // Reset check status if user context is loading again
      currentUserId.current = null;
      setRoleCheckLoading(true); // Ensure we indicate loading while waiting for user
      return; // Exit effect early
    }

    // User context is loaded (userLoading is false)
    if (user) {
      // User exists. Check if we need to run the role check.
      // Run if we haven't checked yet OR if the user ID has changed.
      if (!hasCheckedRole.current || currentUserId.current !== user.id) {
        console.log(
          `useRole Effect: User context loaded. User ${user.id} found. Triggering role check.`
        );
        currentUserId.current = user.id; // Store current user ID
        hasCheckedRole.current = true; // Mark that we are initiating the check
        setRoleCheckLoading(true); // Set loading true *before* the async call

        // Define and immediately call the async function
        const checkUserRole = async (userId: string) => {
          console.log(
            "useRole: checkUserRole - Checking role for user:",
            userId
          );
          try {
            const { data, error } = await supabase
              .from("user_roles")
              .select("role_id")
              .eq("user_id", userId)
              .maybeSingle();

            if (error) {
              console.error(
                "useRole: checkUserRole - Error fetching user role:",
                error
              );
              setIsAdmin(false);
              setIsEmployee(true); // Default to employee on error
            } else {
              const isAdminResult = data?.role_id === 1;
              const isEmployeeResult = data?.role_id === 2 || data === null;
              setIsAdmin(isAdminResult);
              setIsEmployee(isEmployeeResult);
              console.log("useRole: checkUserRole - User role checked:", {
                isAdmin: isAdminResult,
                isEmployee: isEmployeeResult,
              });
            }
          } catch (error) {
            console.error("useRole: checkUserRole - Unexpected error:", error);
            setIsAdmin(false);
            setIsEmployee(true); // Default on unexpected error
          } finally {
            console.log(
              "useRole: checkUserRole - Finished. Setting roleCheckLoading false."
            );
            setRoleCheckLoading(false); // Set loading false *only* when async check finishes
          }
        };
        checkUserRole(user.id); // Call the async function
      } else {
        console.log(
          `useRole Effect: Role already checked for user ${user.id}. Skipping.`
        );
        // If check was already done, ensure loading is false if it wasn't already
        if (roleCheckLoading) {
          setRoleCheckLoading(false);
        }
      }
    } else {
      // No user, set defaults and mark loading as false
      console.log(
        "useRole Effect: User context loaded, no user. Setting defaults."
      );
      hasCheckedRole.current = false; // Reset check status
      currentUserId.current = null;
      setIsAdmin(false);
      setIsEmployee(false);
      setRoleCheckLoading(false); // No check needed, so not loading
    }
  }, [user, userLoading, session]); // Dependencies remain the same

  // The hook reports loading if the user context is loading OR the role check is loading
  const combinedLoading = userLoading || roleCheckLoading;

  // Log the state being returned
  // console.log(`useRole Returning: isAdmin=${isAdmin}, isEmployee=${isEmployee}, loading=${combinedLoading} (userLoading=${userLoading}, roleCheckLoading=${roleCheckLoading})`);

  return { isAdmin, isEmployee, loading: combinedLoading };
};

export default useRole;
