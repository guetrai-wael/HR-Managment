import supabase from "../../supabaseClient";
import { LeaveRequest } from "../../../types/models";
import { getCurrentUserId } from "./leaveUtils";

/**
 * Service for managing leave request approvals and workflow
 * Handles approval, rejection, and cancellation operations
 */
export const leaveApprovalService = {
  /**
   * Approves a leave request (admin action)
   * @param requestId The ID of the leave request to approve
   * @returns Promise<LeaveRequest> The updated leave request
   * @throws Error if admin not authenticated or database operation fails
   */
  async approveLeaveRequest(requestId: string): Promise<LeaveRequest> {
    try {
      const adminId = await getCurrentUserId();
      if (!adminId) {
        throw new Error("Admin not authenticated.");
      }

      console.log(
        `[leaveApprovalService] Admin ${adminId} approving request ${requestId}`
      );

      const { data, error } = await supabase
        .from("leave_requests")
        .update({
          status: "approved",
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          comments: null, // Ensure comments are cleared on approval
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error(
          "[leaveApprovalService] Error approving leave request:",
          error
        );
        throw error;
      }

      console.log(
        "[leaveApprovalService] Successfully approved leave request:",
        requestId
      );
      return data;
    } catch (error) {
      console.error(
        "[leaveApprovalService] Failed to approve leave request:",
        error
      );
      throw error;
    }
  },

  /**
   * Rejects a leave request (admin action)
   * @param requestId The ID of the leave request to reject
   * @param rejectionReason Optional reason for rejection
   * @returns Promise<LeaveRequest> The updated leave request
   * @throws Error if admin not authenticated or database operation fails
   */
  async rejectLeaveRequest(
    requestId: string,
    rejectionReason?: string
  ): Promise<LeaveRequest> {
    try {
      const adminId = await getCurrentUserId();
      if (!adminId) {
        throw new Error("Admin not authenticated.");
      }

      console.log(
        `[leaveApprovalService] Admin ${adminId} rejecting request ${requestId}`
      );

      const { data, error } = await supabase
        .from("leave_requests")
        .update({
          status: "rejected",
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          comments: rejectionReason || null,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error(
          "[leaveApprovalService] Error rejecting leave request:",
          error
        );
        throw error;
      }

      console.log(
        "[leaveApprovalService] Successfully rejected leave request:",
        requestId
      );
      return data;
    } catch (error) {
      console.error(
        "[leaveApprovalService] Failed to reject leave request:",
        error
      );
      throw error;
    }
  },

  /**
   * Cancels a leave request (employee action)
   * Note: DB RLS policy ensures employees can only cancel their own pending requests
   * @param requestId The ID of the leave request to cancel
   * @returns Promise<LeaveRequest> The updated leave request
   * @throws Error if user not authenticated, no permission, or database operation fails
   */
  async cancelLeaveRequest(requestId: string): Promise<LeaveRequest> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated to cancel leave request.");
      }

      console.log(
        `[leaveApprovalService] User ${userId} cancelling request ${requestId}`
      );

      const { data, error } = await supabase
        .from("leave_requests")
        .update({ status: "cancelled" }) // DB enum uses 'cancelled'
        .eq("id", requestId)
        .select()
        .single();

      if (error) {
        console.error(
          "[leaveApprovalService] Error cancelling leave request:",
          error.message
        );
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

      console.log(
        "[leaveApprovalService] Successfully cancelled leave request:",
        requestId
      );
      return data;
    } catch (error) {
      console.error(
        "[leaveApprovalService] Failed to cancel leave request:",
        error
      );
      throw error;
    }
  },
};
