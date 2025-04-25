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
      setLoading(false);

      // Profile and role creation logic
      if (
        (event === "SIGNED_IN" || event === "USER_UPDATED") &&
        session?.user
      ) {
        // Ensure profile exists
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!profile) {
          console.log("Creating missing profile for user:", session.user.id);
          // Create missing profile
          await supabase.from("profiles").insert([
            {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.email?.split("@")[0] || "User",
            },
          ]);
        }

        // Ensure role exists
        const { data: userRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (!userRole) {
          console.log("Assigning role to user:", session.user.id);
          // Assign appropriate role
          const { count } = await supabase
            .from("user_roles")
            .select("*", { count: "exact", head: true });

          const roleId = count === 0 ? 1 : 2; // 1=admin, 2=employee

          await supabase.from("user_roles").insert([
            {
              user_id: session.user.id,
              role_id: roleId,
            },
          ]);
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
