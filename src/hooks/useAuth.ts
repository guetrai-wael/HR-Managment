import { useState } from "react";
import { message } from "antd";
import supabase from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";

/**
 * Custom hook for handling authentication operations
 * Provides login, register, logout and session management functions
 */
export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  /**
   * Log in with email and password
   */
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data: session, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        message.error((error as { message: string }).message);
        return null;
      }

      message.success("Successfully logged in");
      return session;
    } catch (e) {
      message.error("An unexpected error occurred");
      console.error(e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user with email and password
   */
  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Step 1: Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error("Auth signup error:", error);
        throw error;
      }

      // Step 2: If signup successful, manually create profile
      // (this is normally handled by triggers but might be failing)
      if (data?.user) {
        console.log("User created successfully, adding profile and role");

        try {
          // Wait for auth to complete before attempting database operations
          await new Promise((resolve) => setTimeout(resolve, 1000));

          // Get session to have proper auth context for database operations
          const { data: sessionData } = await supabase.auth.getSession();

          if (sessionData?.session) {
            console.log("Got authenticated session");

            // Create profile if needed
            const { error: profileError } = await supabase
              .from("profiles")
              .upsert(
                [
                  {
                    id: data.user.id,
                    email: data.user.email,
                    full_name: data.user.email?.split("@")[0] || "User",
                  },
                ],
                { onConflict: "id" }
              );

            if (profileError) {
              console.error("Profile creation error:", profileError);
            }

            // Assign job_seeker role
            const { error: roleError } = await supabase
              .from("user_roles")
              .upsert(
                [
                  {
                    user_id: data.user.id,
                    role_id: 3, // job_seeker role
                  },
                ],
                { onConflict: "user_id" }
              );

            if (roleError) {
              console.error("Role assignment error:", roleError);
            }
          }
        } catch (dbError) {
          console.error("Database operations error:", dbError);
          // Continue anyway - user was created in auth system
        }
      }

      setLoading(false);
      message.success("Registration successful!");
      return data;
    } catch (error) {
      setLoading(false);
      message.error((error as { message: string }).message);
      return null;
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const loginWithGoogle = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    setLoading(false);

    if (error) {
      message.error(error.message);
      return false;
    }

    return true;
  };

  /**
   * Sign out the current user
   */
  const logout = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      message.error(error.message);
      return false;
    }

    message.success("Successfully logged out");
    navigate("/login");
    return true;
  };
  return {
    login,
    register,
    loginWithGoogle,
    logout,
    loading,
  };
};
