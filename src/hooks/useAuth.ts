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
        message.error(error.message);
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

    const { data: session, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      message.error(error.message);
      return null;
    }

    message.success(
      "Registration successful! Please check your email to confirm your account."
    );
    return session;
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

  /**
   * Get the current session
   */
  const getSession = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Session error:", error);
      return null;
    }

    return data.session;
  };

  return {
    login,
    register,
    loginWithGoogle,
    logout,
    getSession,
    loading,
  };
};
