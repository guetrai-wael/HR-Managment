import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import {
  Session,
  User,
  AuthError,
  SignInWithPasswordCredentials,
} from "@supabase/supabase-js";

import supabase from "../services/supabaseClient";
import { useMutationHandler } from "./useMutationHandler";

// Type definitions for mutation data
type LoginData = { user: User; session: Session };
type RegisterData = { user: User; session: Session | null };
type LogoutData = void;

// Variables for the register mutation
interface RegisterMutationVariables {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Hook for handling all authentication operations
 *
 * Provides comprehensive authentication functionality including login,
 * registration, logout, Google OAuth, and session management.
 *
 * @returns Object containing authentication actions and states
 *
 * @example
 * ```typescript
 * const { actions, isLoading, error } = useAuth();
 *
 * // Login
 * await actions.login({ email: 'user@example.com', password: 'password' });
 *
 * // Register
 * await actions.register({
 *   email: 'user@example.com',
 *   password: 'password',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 *
 * // Logout
 * await actions.logout();
 * ```
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const loginMutation = useMutationHandler<
    LoginData,
    AuthError,
    SignInWithPasswordCredentials
  >({
    mutationFn: async (credentials) => {
      const { data, error } = await supabase.auth.signInWithPassword(
        credentials
      );
      if (error) throw error;
      if (!data.session || !data.user)
        throw new Error("Login failed: No session or user returned.");
      return { user: data.user, session: data.session };
    },
    queryClient,
    successMessage: "Successfully logged in",
    errorMessagePrefix: "Login failed",
  });

  const registerMutation = useMutationHandler<
    RegisterData,
    AuthError,
    RegisterMutationVariables
  >({
    mutationFn: async ({ email, password, firstName, lastName }) => {
      console.log("[useAuth.ts register] Attempting to register user with:", {
        email,
        firstName,
        lastName,
      });
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

      if (signUpError) throw signUpError;
      if (!authResponse?.user) {
        console.error(
          "[useAuth.ts register] No user object in authResponse after signUp. This is unexpected."
        );
        throw new Error(
          "Registration failed: No user data returned from authentication service."
        );
      }
      console.log(
        "[useAuth.ts register] User signed up via Auth (profile to be created by trigger):",
        authResponse.user
      );
      return { user: authResponse.user, session: authResponse.session };
    },
    queryClient,
    successMessage:
      "Registration successful! Please check your email to confirm your account.",
    errorMessagePrefix: "Registration failed",
  });

  const logoutMutation = useMutationHandler<LogoutData, AuthError, void>({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    queryClient,
    successMessage: "Successfully logged out",
    errorMessagePrefix: "Logout failed",
    onSuccess: () => {
      navigate("/login");
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  /**
   * Log in with email and password
   */
  const login = async (email: string, password: string) => {
    return loginMutation.mutateAsync({ email, password });
  };

  /**
   * Register a new user with email and password, and firstName, lastName
   */
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<RegisterData | null> => {
    try {
      return await registerMutation.mutateAsync({
        email,
        password,
        firstName,
        lastName,
      });
    } catch {
      return null;
    }
  };

  /**
   * Sign in with Google OAuth
   */
  const loginWithGoogle = async () => {
    // Reset other mutation states if a user tries Google login after a failed email/password attempt
    loginMutation.reset();
    registerMutation.reset();
    logoutMutation.reset();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      message.error(error.message);
      console.error("Google OAuth error:", error);
      return false;
    }
    return true;
  };

  /**
   * Sign out the current user
   */
  const logout = async () => {
    try {
      await logoutMutation.mutateAsync();
      return true;
    } catch {
      return false;
    }
  };

  /**
   * Get the current session (imperative fetch)
   */
  const getSession = async () => {
    // This is a direct fetch, not a mutation. Consider useQuery for reactive session state.
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        message.error("Could not retrieve session: " + error.message);
        console.error("Get session error:", error);
        return null;
      }
      return data.session;
    } catch (sessionError) {
      message.error("An unexpected error occurred while fetching session.");
      console.error("Unexpected get session error:", sessionError);
      return null;
    }
  };

  // Consolidated loading state from relevant mutations
  const isLoading =
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending;

  const error =
    loginMutation.error || registerMutation.error || logoutMutation.error;

  return {
    // Data (no persistent data for auth operations)
    data: null,

    // Loading states
    isLoading,
    isError: !!error,
    error,

    // Actions
    actions: {
      login,
      register,
      loginWithGoogle,
      logout,
      getSession,
    },
  };
};
