import { createContext, useEffect, useState, ReactNode } from "react";
import supabase from "../services/supabaseClient";
import { Session, User } from "@supabase/supabase-js";

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
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

  useEffect(() => {
    // Auth state change listener
    const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user || null);
      setLoading(false); // Keep this line

      // Profile creation logic (Keep this part if you still want frontend profile check/creation as a fallback)
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user
      ) {
        // Ensure profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("id") // Only select id, no need for '*' if just checking existence
          .eq("id", session.user.id)
          .maybeSingle(); // Use maybeSingle to handle null gracefully

        if (!profile) {
          console.log(
            "Frontend: Creating missing profile for user:",
            session.user.id
          );
          // Attempt to create missing profile (backend trigger should ideally handle this)
          try {
            await supabase.from("profiles").insert([
              {
                id: session.user.id,
                email: session.user.email,
                // Use nullish coalescing for safer fallback
                full_name:
                  session.user.user_metadata?.full_name ??
                  session.user.email?.split("@")[0] ??
                  "User",
              },
            ]);
          } catch (profileError) {
            console.error("Frontend: Error creating profile:", profileError);
          }
        }
      }
    });

    // Initial session check
    supabase.auth
      .getSession()
      .then((response) => {
        const session = response.data.session;
        console.log(
          "Session fetch result:",
          session ? "Session exists" : "No session found"
        );
        setSession(session);
        setUser(session?.user || null);
      })
      .catch((error) => {
        console.error("Session fetch error details:", error);
      })
      .finally(() => {
        console.log("Setting loading to false");
        setLoading(false);
      });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, session, loading }}>
      {children}
    </UserContext.Provider>
  );
};
