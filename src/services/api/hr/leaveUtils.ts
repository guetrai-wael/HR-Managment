import supabase from "../../supabaseClient";
import { UserProfile } from "../../../types/models";

/**
 * Shared utility functions for leave services
 */

/**
 * Helper function to get the current authenticated user's ID
 * @returns Promise<string | undefined> The current user's ID or undefined if not authenticated
 */
export const getCurrentUserId = async (): Promise<string | undefined> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
};

// Type definitions for leave services

// Intermediate type for the fields selected from profiles in leave requests
export type SelectedUserProfileFields = Pick<
  UserProfile,
  "first_name" | "last_name" | "email" | "avatar_url" | "position"
>;
