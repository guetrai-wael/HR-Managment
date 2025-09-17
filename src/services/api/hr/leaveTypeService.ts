import supabase from "../../supabaseClient";
import { LeaveType } from "../../../types/models";

/**
 * Service for managing leave types
 * Handles CRUD operations for different types of leave (vacation, sick, etc.)
 */
export const leaveTypeService = {
  /**
   * Fetches all available leave types from the database
   * @returns Promise<LeaveType[]> Array of all leave types
   * @throws Error if database operation fails
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    try {
      console.log("[leaveTypeService] Fetching all leave types");

      const { data, error } = await supabase
        .from("leave_types")
        .select("*")
        .order("name");

      if (error) {
        console.error("[leaveTypeService] Error fetching leave types:", error);
        throw error;
      }

      console.log(
        `[leaveTypeService] Successfully fetched ${
          data?.length || 0
        } leave types`
      );
      return data || [];
    } catch (error) {
      console.error("[leaveTypeService] Failed to fetch leave types:", error);
      throw error;
    }
  },
};
