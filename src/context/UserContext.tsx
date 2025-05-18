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
  // console.log("UserProvider Effect: Mounting.");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  // Ref to track if initial load is done
  const initialLoadComplete = useRef(false);

  useEffect(() => {
    // 1. Initial session check - This determines the *initial* loading state
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        // Set initial state based on this check
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      })
      .catch((error) => {
        // Ensure state is null on error
        console.error("Error getting initial session:", error); // Log the error
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        // Set loading false ONLY after the initial check is fully complete
        setLoading(false);
        initialLoadComplete.current = true;
      });

    // 2. Auth state change listener - This updates state *after* initial load
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        const currentUser = currentSession?.user ?? null;
        setUser(currentUser);
        setSession(currentSession);

        // DO NOT set loading state here. The initial load is handled above.
        // This listener only reacts to subsequent changes (login, logout, token refresh).

        if (
          (event === "SIGNED_IN" || event === "INITIAL_SESSION") &&
          currentSession?.user
        ) {
          // Optionally, you could trigger a fetch of the user's profile data here if it's not already part of the session
          // or if you need more profile details than what's in the user object.
          // Example: fetchUserProfile(currentSession.user.id);
        }
      }
    );

    // Cleanup function
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <UserContext.Provider value={{ user, session, loading }}>
      {children}
    </UserContext.Provider>
  );
};
