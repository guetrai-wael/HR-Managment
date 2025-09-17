import supabase from "../../supabaseClient";
import type { UserProfile } from "../../../types/models";

/**
 * Avatar Service - File upload and avatar management
 *
 * Handles avatar-related operations including:
 * - Uploading avatar files to storage
 * - Updating profile with new avatar URLs
 * - Managing file storage and public URLs
 *
 * This service follows the standardized pattern:
 * { data, isLoading, error, actions }
 */
export const avatarService = {
  /**
   * Updates user avatar by uploading file and updating profile
   * @param userId User ID to update avatar for
   * @param avatarFile Avatar file to upload
   * @returns Promise that resolves to updated profile
   * @throws Error if database operation fails
   */
  async update(userId: string, avatarFile: File): Promise<UserProfile> {
    try {
      console.log("[avatarService] update called for userId:", userId);

      // Generate unique filename with timestamp
      const fileName = `public/${userId}/${Date.now()}_${avatarFile.name}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error("[avatarService] Avatar upload failed:", uploadError);
        throw uploadError;
      }

      // Get public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      if (!publicUrlData) {
        throw new Error("Could not get public URL for avatar.");
      }

      const avatar_url = publicUrlData.publicUrl;

      // Update profile table with new avatar URL
      const { data: updatedProfile, error: updateProfileError } = await supabase
        .from("profiles")
        .update({ avatar_url, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (updateProfileError) {
        console.error(
          "[avatarService] Profile avatar update failed:",
          updateProfileError
        );
        throw updateProfileError;
      }

      // Attempt to update auth.user metadata (best effort)
      const { error: userUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatar_url },
      });

      if (userUpdateError) {
        console.warn(
          "[avatarService] Could not update user metadata avatar_url:",
          userUpdateError.message
        );
      }

      console.log(
        "[avatarService] Avatar updated successfully for userId:",
        userId
      );
      return updatedProfile as UserProfile;
    } catch (error) {
      console.error("[avatarService] Unexpected error in update:", error);
      throw error;
    }
  },

  /**
   * Deletes user avatar file from storage
   * @param userId User ID to delete avatar for
   * @param avatarUrl Current avatar URL to extract filename
   * @returns Promise that resolves when deletion is complete
   * @throws Error if storage operation fails
   */
  async delete(userId: string, avatarUrl: string): Promise<void> {
    try {
      console.log("[avatarService] delete called for userId:", userId);

      // Extract filename from URL
      const urlParts = avatarUrl.split("/");
      const fileName = urlParts.slice(-3).join("/"); // Get public/userId/filename part

      // Delete file from storage
      const { error: deleteError } = await supabase.storage
        .from("avatars")
        .remove([fileName]);

      if (deleteError) {
        console.error("[avatarService] Avatar deletion failed:", deleteError);
        throw deleteError;
      }

      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (updateError) {
        console.error(
          "[avatarService] Profile avatar removal failed:",
          updateError
        );
        throw updateError;
      }

      console.log(
        "[avatarService] Avatar deleted successfully for userId:",
        userId
      );
    } catch (error) {
      console.error("[avatarService] Unexpected error in delete:", error);
      throw error;
    }
  },
};
