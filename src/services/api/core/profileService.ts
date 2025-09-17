import supabase from "../../supabaseClient";
import type { UserProfile } from "../../../types/models";

/**
 * Profile Service - Core user profile management
 *
 * Handles basic CRUD operations for user profiles including:
 * - Fetching user profiles
 * - Creating new profiles
 * - Updating existing profiles
 *
 * This service follows the standardized pattern:
 * { data, isLoading, error, actions }
 */
export const profileService = {
  /**
   * Updates or creates a user profile
   * @param userId User ID to update profile for
   * @param profileData Profile data to update (email needed for insert)
   * @returns Promise that resolves to updated profile
   * @throws Error if database operation fails
   */
  async update(
    userId: string,
    profileData: Partial<UserProfile> & { email?: string }
  ): Promise<UserProfile> {
    try {
      console.log("[profileService] update called for userId:", userId);

      // Check if profile exists to determine insert or update
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[profileService] update failed:", fetchError);
        throw fetchError;
      }

      const payload = {
        ...profileData,
        updated_at: new Date().toISOString(),
      };

      if (!existingProfile) {
        // INSERT new profile
        if (!profileData.email) {
          throw new Error("Email is required to create a new profile.");
        }

        const insertPayload = {
          ...payload,
          id: userId,
          email: profileData.email,
        };

        const { data, error } = await supabase
          .from("profiles")
          .insert(insertPayload)
          .select()
          .single();

        if (error) {
          console.error("[profileService] Profile insert failed:", error);
          throw error;
        }

        return data as UserProfile;
      } else {
        // UPDATE existing profile
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { email, id, ...updatePayload } = payload;

        const { data, error } = await supabase
          .from("profiles")
          .update(updatePayload)
          .eq("id", userId)
          .select()
          .single();

        if (error) {
          console.error("[profileService] Profile update failed:", error);
          throw error;
        }

        return data as UserProfile;
      }
    } catch (error) {
      console.error("[profileService] Unexpected error in update:", error);
      throw error;
    }
  },

  /**
   * Retrieves a user profile by ID
   * @param userId User ID to fetch profile for
   * @returns Promise that resolves to user profile or null if not found
   * @throws Error if database operation fails
   */
  async getById(userId: string): Promise<UserProfile | null> {
    try {
      console.log("[profileService] getById called for userId:", userId);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error(
          `[profileService] getById failed for userId ${userId}:`,
          error
        );
        throw error;
      }

      return (data as UserProfile) || null;
    } catch (error) {
      console.error("[profileService] Unexpected error in getById:", error);
      throw error;
    }
  },
};
