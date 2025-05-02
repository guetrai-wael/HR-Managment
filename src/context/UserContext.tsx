import { createContext, useEffect, useState, ReactNode, useRef } from "react"; // Import useRef
import supabase from "../services/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean; // Represents the initial loading state of the context
}

export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  loading: true,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref to track if initial load is done
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    console.log("UserProvider Effect: Mounting.");
    setLoading(true); // Ensure loading is true on mount
    initialLoadComplete.current = false;

    // 1. Initial session check - This determines the *initial* loading state
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        console.log(
          "UserProvider: Initial getSession complete.",
          initialSession ? "Session found." : "No session."
        );
        // Set initial state based on this check
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      })
      .catch((error) => {
        console.error("UserProvider: Initial getSession error:", error);
        // Ensure state is null on error
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        // Set loading false ONLY after the initial check is fully complete
        console.log(
          "UserProvider: Initial getSession finally block. Setting loading false."
        );
        setLoading(false);
        initialLoadComplete.current = true;
      });

    // 2. Auth state change listener - This updates state *after* initial load
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log(
          `UserProvider: onAuthStateChange event: ${event}`,
          currentSession ? "Session updated." : "Session removed."
        );
        // Simply update the session and user state
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // DO NOT set loading state here. The initial load is handled above.
        // This listener only reacts to subsequent changes (login, logout, token refresh).

        // --- Keep Profile Check/Creation Logic (Optional Fallback) ---
        // This can still run on SIGNED_IN or INITIAL_SESSION if needed
        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          currentSession?.user
        ) {
          // Check only if initial load is complete to avoid race conditions
          if (initialLoadComplete.current) {
            console.log(
              "UserProvider: Checking/Creating profile based on auth event."
            );
            // (Profile check/creation logic remains the same as before)
            const { data: profile, error: profileError } = await supabase
              .from("profiles")
              .select("id")
              .eq("id", currentSession.user.id)
              .maybeSingle();

            if (profileError) {
              console.error(
                "UserProvider: Error checking profile existence:",
                profileError
              );
            } else if (!profile) {
              console.log(
                "UserProvider: Profile missing for user:",
                currentSession.user.id,
                "Attempting creation."
              );
              try {
                const { error: insertError } = await supabase
                  .from("profiles")
                  .insert([
                    {
                      id: currentSession.user.id,
                      email: currentSession.user.email,
                      full_name:
                        currentSession.user.user_metadata?.full_name ??
                        currentSession.user.email?.split("@")[0] ??
                        "User",
                    },
                  ]);
                if (insertError) throw insertError;
                console.log("UserProvider: Profile created successfully.");
              } catch (profileInsertError) {
                console.error(
                  "UserProvider: Error creating profile:",
                  profileInsertError
                );
              }
            } else {
              console.log(
                "UserProvider: Profile exists for user:",
                currentSession.user.id
              );
            }
          } else {
            console.log(
              "UserProvider: Skipping profile check as initial load is not complete."
            );
          }
        }
        // --- End Profile Check ---
      }
    );

    // Cleanup function
    return () => {
      console.log(
        "UserProvider Effect: Unmounting. Unsubscribing auth listener."
      );
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <UserContext.Provider value={{ user, session, loading }}>
      {children}
    </UserContext.Provider>
  );
};
