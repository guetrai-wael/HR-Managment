import supabase from "../supabaseClient";
import {
  LeaveRequest,
  LeaveRequestDisplay,
  LeaveType,
  UserProfile, // Added UserProfile import
} from "../../types/models";

// Helper function to get current user's ID
const getCurrentUserId = async (): Promise<string | undefined> => {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id;
};

// Intermediate type for the fields selected from leave_types
type SelectedLeaveTypeFields = Pick<LeaveType, "id" | "name" | "color_scheme">;

// Intermediate type for the fields selected from profiles
type SelectedUserProfileFields = Pick<
  UserProfile,
  "first_name" | "last_name" | "email" | "avatar_url" | "position"
>;

export const leaveService = {
  /**
   * Fetches all leave types.
   */
  async getLeaveTypes(): Promise<LeaveType[]> {
    const { data, error } = await supabase.from("leave_types").select("*");
    if (error) {
      console.error("Error fetching leave types:", error);
      throw error;
    }
    return data || [];
  },

  /**
   * Creates a new leave request.
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
      | "approved_by" // Corrected from admin_reviewer_id
      | "approved_at" // Corrected from admin_reviewed_at
      | "comments" // Corrected from admin_rejection_reason
    >
  ): Promise<LeaveRequest> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("User not authenticated to create leave request.");
    }
    // Ensure requestData does not contain fields that should not be set by client
    const cleanRequestData = { ...requestData };
    // delete (cleanRequestData as any).user_id; // user_id is set by service
    // delete (cleanRequestData as any).status; // status defaults in DB

    const { data, error } = await supabase
      .from("leave_requests")
      .insert([{ ...cleanRequestData, user_id: userId }])
      .select()
      .single();

    if (error) {
      console.error("Error creating leave request:", error);
      throw error;
    }
    return data;
  },

  /**
   * Fetches all leave requests for the current authenticated user.
   */
  async getMyLeaveRequests(): Promise<LeaveRequestDisplay[]> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("User not authenticated to fetch leave requests.");
    }

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
      console.error("Error fetching my leave requests:", error);
      throw error;
    }

    return (
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
      ) || []
    );
  },

  /**
   * Fetches all leave requests (for admin view).
   */
  async getAllLeaveRequests(): Promise<LeaveRequestDisplay[]> {
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
      console.error("Error fetching all leave requests:", error);
      throw error;
    }
    return (
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
            ...req, // Spread existing fields (now including comments, approved_by, approved_at)
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
            // No longer need to map admin_rejection_reason as LeaveRequestDisplay will use 'comments' directly from LeaveRequest
          };
        }
      ) || []
    );
  },

  /**
   * Approves a leave request.
   */
  async approveLeaveRequest(requestId: string): Promise<LeaveRequest> {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      throw new Error("Admin not authenticated.");
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status: "approved",
        approved_by: adminId, // Corrected from admin_reviewer_id
        approved_at: new Date().toISOString(), // Corrected from admin_reviewed_at
        comments: null, // Ensure comments are cleared on approval
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Error approving leave request:", error);
      throw error;
    }
    return data;
  },

  /**
   * Rejects a leave request.
   */
  async rejectLeaveRequest(requestId: string): Promise<LeaveRequest> {
    const adminId = await getCurrentUserId();
    if (!adminId) {
      throw new Error("Admin not authenticated.");
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({
        status: "rejected",
        approved_by: adminId, // Corrected from admin_reviewer_id
        approved_at: new Date().toISOString(), // Corrected from admin_reviewed_at
        comments: null, // Set comments to null as it's no longer used for rejection reasons
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Error rejecting leave request:", error);
      throw error;
    }
    return data;
  },

  /**
   * Cancels a leave request (employee action).
   * DB RLS policy: Employees can update status to 'cancelled' if auth.uid() = user_id AND status = 'pending'.
   */
  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("User not authenticated to cancel leave request.");
    }

    const { data, error } = await supabase
      .from("leave_requests")
      .update({ status: "cancelled" }) // DB enum uses 'cancelled'
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
      console.error("Error cancelling leave request:", error.message);
      if (
        error.message.includes("violates row-level security policy") ||
        error.message.includes(
          "JSON object requested, multiple (or no) rows returned"
        )
      ) {
        throw new Error(
          "Failed to cancel request. You may not have permission, the request is not pending, or it does not exist."
        );
      }
      throw error;
    }
    if (!data) {
      throw new Error(
        "Failed to cancel request. Request not found, not pending, or permission denied."
      );
    }
    return data;
  },

  /**
   * Fetches the current authenticated user's leave balance.
   */
  async getMyLeaveBalance(): Promise<number> {
    const userId = await getCurrentUserId();
    if (!userId) {
      console.warn("User not authenticated, cannot fetch leave balance.");
      return 0;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase.rpc("get_leave_balance", {
      p_user_id: userId,
      p_as_of_date: today,
    });

    if (error) {
      console.error("Error fetching leave balance from RPC:", error);
      throw error;
    }
    return typeof data === "number" ? data : 0;
  },
};
