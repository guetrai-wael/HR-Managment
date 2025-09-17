import supabase from "../../supabaseClient";
import {
  LeaveRequest,
  LeaveRequestDisplay,
  LeaveType,
} from "../../../types/models";
import { getCurrentUserId, SelectedUserProfileFields } from "./leaveUtils";
import { leaveBalanceService } from "./leaveBalanceService";

// Intermediate type for the fields selected from leave_types
type SelectedLeaveTypeFields = Pick<LeaveType, "id" | "name" | "color_scheme">;

/**
 * Service for managing leave requests
 * Handles CRUD operations for leave requests
 */
export const leaveRequestService = {
  /**
   * Creates a new leave request with balance validation
   * @param requestData Leave request data (excluding system fields)
   * @returns Promise<LeaveRequest> The created leave request
   * @throws Error if user not authenticated, insufficient balance, or database operation fails
   */
  async createLeaveRequest(
    requestData: Omit<
      LeaveRequest,
      | "id"
      | "user_id"
      | "created_at"
      | "updated_at"
      | "status"
      // Admin-set fields, should not be part of creation payload
      | "approved_by"
      | "approved_at"
      | "comments"
    >
  ): Promise<LeaveRequest> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated to create leave request.");
      }

      console.log(
        "[leaveRequestService] Creating leave request for user:",
        userId
      );

      // Calculate the number of days requested
      const startDate = new Date(requestData.start_date);
      const endDate = new Date(requestData.end_date);
      const daysRequested =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
        ) + 1;

      console.log(`[leaveRequestService] Days requested: ${daysRequested}`);

      // Get current leave balance
      const currentBalance = await leaveBalanceService.getMyLeaveBalance();

      // Check if user has enough balance
      if (daysRequested > currentBalance) {
        const error = `Insufficient leave balance. You requested ${daysRequested} days but only have ${currentBalance} days available.`;
        console.error("[leaveRequestService]", error);
        throw new Error(error);
      }

      // Ensure requestData does not contain fields that should not be set by client
      const cleanRequestData = { ...requestData };

      const { data, error } = await supabase
        .from("leave_requests")
        .insert([{ ...cleanRequestData, user_id: userId }])
        .select()
        .single();

      if (error) {
        console.error(
          "[leaveRequestService] Error creating leave request:",
          error
        );
        throw error;
      }

      console.log(
        "[leaveRequestService] Successfully created leave request:",
        data.id
      );
      return data;
    } catch (error) {
      console.error(
        "[leaveRequestService] Failed to create leave request:",
        error
      );
      throw error;
    }
  },

  /**
   * Fetches all leave requests for the current authenticated user
   * @returns Promise<LeaveRequestDisplay[]> Array of user's leave requests with display data
   * @throws Error if user not authenticated or database operation fails
   */
  async getMyLeaveRequests(): Promise<LeaveRequestDisplay[]> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated to fetch leave requests.");
      }

      console.log(
        "[leaveRequestService] Fetching leave requests for user:",
        userId
      );

      const { data, error } = await supabase
        .from("leave_requests")
        .select(
          `
          id,
          user_id,
          leave_type_id,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          updated_at,
          approved_by, 
          approved_at, 
          comments,
          leave_types!inner(id, name, color_scheme)
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "[leaveRequestService] Error fetching my leave requests:",
          error
        );
        throw error;
      }

      const requests =
        data?.map(
          (
            req: LeaveRequest & {
              leave_types: SelectedLeaveTypeFields | SelectedLeaveTypeFields[];
            }
          ): LeaveRequestDisplay => {
            const leaveTypeData = Array.isArray(req.leave_types)
              ? req.leave_types[0]
              : req.leave_types;
            return {
              ...req,
              employee_name: "My Request",
              employee_avatar_url: undefined,
              employee_department: undefined,
              leave_type_name: leaveTypeData?.name || "N/A",
              leave_type_color_scheme: leaveTypeData?.color_scheme,
              duration_days:
                (new Date(req.end_date).getTime() -
                  new Date(req.start_date).getTime()) /
                  (1000 * 3600 * 24) +
                1,
            };
          }
        ) || [];

      console.log(
        `[leaveRequestService] Successfully fetched ${requests.length} leave requests`
      );
      return requests;
    } catch (error) {
      console.error(
        "[leaveRequestService] Failed to fetch leave requests:",
        error
      );
      throw error;
    }
  },

  /**
   * Fetches all leave requests (for admin view)
   * @returns Promise<LeaveRequestDisplay[]> Array of all leave requests with employee and display data
   * @throws Error if database operation fails
   */
  async getAllLeaveRequests(): Promise<LeaveRequestDisplay[]> {
    try {
      console.log(
        "[leaveRequestService] Fetching all leave requests for admin view"
      );

      const { data, error } = await supabase
        .from("leave_requests")
        .select(
          `
          id,
          user_id,
          leave_type_id,
          start_date,
          end_date,
          reason,
          status,
          created_at,
          updated_at,
          approved_by,
          approved_at,
          comments,
          profiles!user_id(first_name, last_name, email, avatar_url, position),
          leave_types!inner(id, name, color_scheme)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error(
          "[leaveRequestService] Error fetching all leave requests:",
          error
        );
        throw error;
      }

      const requests =
        data?.map(
          (
            req: LeaveRequest & {
              profiles: SelectedUserProfileFields | SelectedUserProfileFields[];
              leave_types: SelectedLeaveTypeFields | SelectedLeaveTypeFields[];
            }
          ): LeaveRequestDisplay => {
            const profileData = Array.isArray(req.profiles)
              ? req.profiles[0]
              : req.profiles;
            const leaveTypeData = Array.isArray(req.leave_types)
              ? req.leave_types[0]
              : req.leave_types;
            return {
              ...req,
              employee_name: profileData
                ? `${profileData.first_name || ""} ${
                    profileData.last_name || ""
                  }`.trim()
                : "N/A",
              employee_avatar_url: profileData?.avatar_url,
              employee_department: profileData?.position ?? undefined,
              leave_type_name: leaveTypeData?.name || "N/A",
              leave_type_color_scheme: leaveTypeData?.color_scheme,
              duration_days:
                (new Date(req.end_date).getTime() -
                  new Date(req.start_date).getTime()) /
                  (1000 * 3600 * 24) +
                1,
            };
          }
        ) || [];

      console.log(
        `[leaveRequestService] Successfully fetched ${requests.length} leave requests`
      );
      return requests;
    } catch (error) {
      console.error(
        "[leaveRequestService] Failed to fetch all leave requests:",
        error
      );
      throw error;
    }
  },
};
