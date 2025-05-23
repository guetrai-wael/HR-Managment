import { createContext, useEffect, useState, ReactNode, useRef } from "react";
import supabase from "../services/supabaseClient";
import { Session, User } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../services/api/userService";
import { UserProfile } from "../types";

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null | undefined;
  authLoading: boolean;
  profileLoading: boolean;
  profileError: Error | null;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  session: null,
  profile: null,
  authLoading: true,
  profileLoading: false,
  profileError: null,
});

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const initialAuthLoadComplete = useRef(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session: initialSession } }) => {
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      })
      .catch((error) => {
        console.error("Error getting initial session:", error);
        setSession(null);
        setUser(null);
      })
      .finally(() => {
        setAuthLoading(false);
        initialAuthLoadComplete.current = true;
      });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        if (initialAuthLoadComplete.current || currentSession !== session) {
          setUser(currentSession?.user ?? null);
          setSession(currentSession);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [session]);

  const {
    data: profile,
    isLoading: profileIsLoading,
    error: profileError,
    isFetching: profileIsFetching,
  } = useQuery<UserProfile | null, Error>({
    queryKey: ["userProfile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      return fetchUserProfile(user.id);
    },
    enabled: !!user?.id && !authLoading,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  return (
    <UserContext.Provider
      value={{
        user,
        session,
        profile,
        authLoading,
        profileLoading:
          profileIsLoading ||
          (!!user?.id && !authLoading && profileIsFetching && !profile), // More robust loading state
        profileError,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
