import { useState } from "react";
import { message } from "antd";
import supabase from "../services/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Session, User } from "@supabase/supabase-js";

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
      const { data: sessionResponse, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        message.error((error as { message: string }).message);
        return null;
      }

      message.success("Successfully logged in");
      return sessionResponse; // Return the actual session data not just 'session'
    } catch (e) {
      message.error("An unexpected error occurred");
      console.error("Login error:", e); // Log the error
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register a new user with email and password, and now firstName, lastName
   */
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ user: User; session: Session | null } | null> => {
    setLoading(true);
    console.log("[useAuth.ts register] Attempting to register user with:", {
      email,
      firstName,
      lastName,
    });
    try {
      const { data: authResponse, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

      if (signUpError) {
        console.error(
          "[useAuth.ts register] Supabase Auth signUpError:",
          signUpError
        );
        message.error(signUpError.message || "Registration failed");
        setLoading(false);
        return null;
      }

      if (!authResponse?.user) {
        console.error(
          "[useAuth.ts register] No user object in authResponse after signUp. This is unexpected."
        );
        message.error(
          "Registration failed: No user data returned from authentication service."
        );
        setLoading(false);
        return null;
      }

      // Profile creation is now handled by a server-side trigger.
      // Log user object. Session might be null here if email confirmation is pending.
      console.log(
        "[useAuth.ts register] User signed up via Auth (profile to be created by trigger):",
        authResponse.user
      );
      message.success(
        "Registration successful! Please check your email to confirm your account."
      );

      // Return user and session. Session might be null if email confirmation is pending.
      return { user: authResponse.user, session: authResponse.session };
    } catch (error) {
      console.error(
        "[useAuth.ts register] General error during registration:",
        error
      );
      const e =
        error instanceof Error ? error : new Error("An unknown error occurred");
      message.error(
        e.message || "An unexpected error occurred during registration."
      );
      return null;
    } finally {
      setLoading(false);
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

    if (error) {
      setLoading(false);
      message.error(error.message);
      console.error("Google OAuth error:", error); // Log the error
      return false;
    }

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        const user = sessionData.session.user;
        const { data: existingProfile, error: fetchError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error fetching profile for Google user:", fetchError);
        }

        const needsUpdate =
          !existingProfile ||
          !existingProfile.first_name ||
          !existingProfile.last_name;
        const updatePayload: { first_name?: string; last_name?: string } = {};

        if (needsUpdate) {
          const googleFirstName =
            user.user_metadata?.first_name || user.user_metadata?.given_name;
          const googleLastName =
            user.user_metadata?.last_name || user.user_metadata?.family_name;

          if (googleFirstName) updatePayload.first_name = googleFirstName;
          if (googleLastName) updatePayload.last_name = googleLastName;

          if (
            (!updatePayload.first_name || !updatePayload.last_name) &&
            user.user_metadata?.full_name
          ) {
            const nameParts = user.user_metadata.full_name.split(" ");
            if (!updatePayload.first_name)
              updatePayload.first_name = nameParts[0];
            if (!updatePayload.last_name)
              updatePayload.last_name = nameParts.slice(1).join(" ") || "";
          }

          if (Object.keys(updatePayload).length > 0) {
            const { error: updateError } = await supabase
              .from("profiles")
              .update(updatePayload)
              .eq("id", user.id);
            if (updateError) {
              console.error(
                "Error updating profile for Google user:",
                updateError
              );
            }
          }
        }
      }
    } catch (googleProcessingError) {
      console.error(
        "Error during Google login post-processing:",
        googleProcessingError
      ); // Log the error
    }
    setLoading(false);
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
      console.error("Logout error:", error); // Log the error
      return false;
    }
    message.success("Successfully logged out");
    navigate("/login");
    return true;
  };

  /**
   * Get the current session
   */
  const getSession = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        message.error("Could not retrieve session: " + error.message);
        console.error("Get session error:", error); // Log the error
        return null;
      }
      return data.session;
    } catch (sessionError) {
      message.error("An unexpected error occurred while fetching session.");
      console.error("Unexpected get session error:", sessionError); // Log the error
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    register,
    loginWithGoogle,
    logout,
    getSession, // Export getSession
    loading,
  };
};
