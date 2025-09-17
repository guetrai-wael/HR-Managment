import supabase from "../../supabaseClient";
import { ROLE_IDS } from "../../../types/roles";

export interface UserRole {
  user_id: string;
  role_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleInfo {
  id: number;
  name: string;
  description?: string;
}

/**
 * Role Service - Centralized role management
 *
 * Handles role-related operations including:
 * - Assigning roles to users
 * - Updating user roles
 * - Fetching user roles
 * - Role validation and management
 *
 * This service follows the standardized pattern:
 * { data, isLoading, error, actions }
 */
export const roleService = {
  /**
   * Assigns a role to a user (upsert operation)
   * @param userId User ID to assign role to
   * @param roleId Role ID to assign
   * @returns Promise that resolves when role is assigned
   * @throws Error if database operation fails
   */
  async assignRole(userId: string, roleId: number): Promise<UserRole> {
    try {
      console.log(
        `[roleService] assignRole called for userId: ${userId}, roleId: ${roleId}`
      );

      const { data, error } = await supabase
        .from("user_roles")
        .upsert(
          {
            user_id: userId,
            role_id: roleId,
          },
          {
            onConflict: "user_id",
          }
        )
        .select()
        .single();

      if (error) {
        console.error("[roleService] Role assignment failed:", error);
        throw error;
      }

      console.log(
        `[roleService] Role assigned successfully: ${userId} -> ${roleId}`
      );
      return data as UserRole;
    } catch (error) {
      console.error("[roleService] Unexpected error in assignRole:", error);
      throw error;
    }
  },

  /**
   * Updates a user's role
   * @param userId User ID to update role for
   * @param newRoleId New role ID to assign
   * @returns Promise that resolves when role is updated
   * @throws Error if database operation fails
   */
  async updateRole(userId: string, newRoleId: number): Promise<UserRole> {
    try {
      console.log(
        `[roleService] updateRole called for userId: ${userId}, newRoleId: ${newRoleId}`
      );

      const { data, error } = await supabase
        .from("user_roles")
        .update({ role_id: newRoleId })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        console.error("[roleService] Role update failed:", error);
        throw error;
      }

      console.log(
        `[roleService] Role updated successfully: ${userId} -> ${newRoleId}`
      );
      return data as UserRole;
    } catch (error) {
      console.error("[roleService] Unexpected error in updateRole:", error);
      throw error;
    }
  },

  /**
   * Gets a user's current role
   * @param userId User ID to fetch role for
   * @returns Promise that resolves to user role or null if not found
   * @throws Error if database operation fails
   */
  async getUserRole(userId: string): Promise<UserRole | null> {
    try {
      console.log(`[roleService] getUserRole called for userId: ${userId}`);

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("[roleService] Get user role failed:", error);
        throw error;
      }

      return (data as UserRole) || null;
    } catch (error) {
      console.error("[roleService] Unexpected error in getUserRole:", error);
      throw error;
    }
  },

  /**
   * Gets all users with a specific role
   * @param roleId Role ID to search for
   * @returns Promise that resolves to array of user roles
   * @throws Error if database operation fails
   */
  async getUsersByRole(roleId: number): Promise<UserRole[]> {
    try {
      console.log(`[roleService] getUsersByRole called for roleId: ${roleId}`);

      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("role_id", roleId);

      if (error) {
        console.error("[roleService] Get users by role failed:", error);
        throw error;
      }

      console.log(
        `[roleService] Found ${data?.length || 0} users with roleId: ${roleId}`
      );
      return (data as UserRole[]) || [];
    } catch (error) {
      console.error("[roleService] Unexpected error in getUsersByRole:", error);
      throw error;
    }
  },

  /**
   * Promotes user to employee role
   * @param userId User ID to promote
   * @returns Promise that resolves when promotion is complete
   * @throws Error if database operation fails
   */
  async promoteToEmployee(userId: string): Promise<UserRole> {
    try {
      console.log(
        `[roleService] promoteToEmployee called for userId: ${userId}`
      );
      return await this.assignRole(userId, ROLE_IDS.EMPLOYEE);
    } catch (error) {
      console.error(
        "[roleService] Unexpected error in promoteToEmployee:",
        error
      );
      throw error;
    }
  },

  /**
   * Demotes employee to job seeker role
   * @param userId User ID to demote
   * @returns Promise that resolves when demotion is complete
   * @throws Error if database operation fails
   */
  async demoteToJobSeeker(userId: string): Promise<UserRole> {
    try {
      console.log(
        `[roleService] demoteToJobSeeker called for userId: ${userId}`
      );
      return await this.updateRole(userId, ROLE_IDS.JOB_SEEKER);
    } catch (error) {
      console.error(
        "[roleService] Unexpected error in demoteToJobSeeker:",
        error
      );
      throw error;
    }
  },

  /**
   * Assigns admin role to user
   * @param userId User ID to make admin
   * @returns Promise that resolves when admin role is assigned
   * @throws Error if database operation fails
   */
  async promoteToAdmin(userId: string): Promise<UserRole> {
    try {
      console.log(`[roleService] promoteToAdmin called for userId: ${userId}`);
      return await this.assignRole(userId, ROLE_IDS.ADMIN);
    } catch (error) {
      console.error("[roleService] Unexpected error in promoteToAdmin:", error);
      throw error;
    }
  },

  /**
   * Checks if user has a specific role
   * @param userId User ID to check
   * @param roleId Role ID to check for
   * @returns Promise that resolves to boolean indicating if user has role
   * @throws Error if database operation fails
   */
  async hasRole(userId: string, roleId: number): Promise<boolean> {
    try {
      console.log(
        `[roleService] hasRole called for userId: ${userId}, roleId: ${roleId}`
      );

      const userRole = await this.getUserRole(userId);
      const hasRole = userRole?.role_id === roleId;

      console.log(
        `[roleService] User ${userId} has roleId ${roleId}: ${hasRole}`
      );
      return hasRole;
    } catch (error) {
      console.error("[roleService] Unexpected error in hasRole:", error);
      throw error;
    }
  },

  /**
   * Gets all available roles from the system
   * @returns Promise that resolves to array of available roles
   * @throws Error if database operation fails
   */
  async getAllRoles(): Promise<RoleInfo[]> {
    try {
      console.log("[roleService] getAllRoles called");

      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("name");

      if (error) {
        console.error("[roleService] Get all roles failed:", error);
        throw error;
      }

      console.log(`[roleService] Retrieved ${data?.length || 0} roles`);
      return (data as RoleInfo[]) || [];
    } catch (error) {
      console.error("[roleService] Unexpected error in getAllRoles:", error);
      throw error;
    }
  },
};
