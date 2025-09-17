import supabase from "../../supabaseClient";
import type { Application } from "../../../types";

/**
 * Service for managing application workflow and status changes
 * Handles status transitions, workflow management, and application lifecycle
 */
export const applicationWorkflowService = {
  /**
   * Updates the status of an application
   * @param id Application ID
   * @param status New status for the application
   * @param additionalData Optional additional data to update with status change
   * @returns Promise that resolves to updated application
   * @throws Error if database operation fails
   */
  async updateStatus(
    id: number,
    status: string,
    additionalData?: Partial<Application>
  ): Promise<Application> {
    try {
      console.log(
        `[applicationWorkflowService] Updating application ${id} status to: ${status}`
      );

      const updateData = {
        status,
        ...additionalData,
        // Note: Applications table doesn't have updated_at column - using applied_at for timestamp
      };

      const { data, error } = await supabase
        .from("applications")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error(
          `[applicationWorkflowService] updateStatus failed for ID ${id}:`,
          error
        );
        throw error;
      }

      console.log(
        `[applicationWorkflowService] Successfully updated application ${id} to status: ${status}`
      );
      return data as Application;
    } catch (error) {
      console.error(
        "[applicationWorkflowService] Unexpected error in updateStatus:",
        error
      );
      throw error;
    }
  },

  /**
   * Moves application to next stage in the workflow
   * @param id Application ID
   * @param currentStatus Current application status
   * @returns Promise that resolves to updated application
   * @throws Error if invalid status transition or database operation fails
   */
  async moveToNextStage(
    id: number,
    currentStatus: string
  ): Promise<Application> {
    try {
      const nextStatus = this.getNextStatus(currentStatus);
      if (!nextStatus) {
        throw new Error(
          `No valid next status for current status: ${currentStatus}`
        );
      }

      return await this.updateStatus(id, nextStatus);
    } catch (error) {
      console.error(
        "[applicationWorkflowService] Failed to move to next stage:",
        error
      );
      throw error;
    }
  },

  /**
   * Rejects an application with optional reason
   * @param id Application ID
   * @param reason Optional rejection reason
   * @returns Promise that resolves to updated application
   * @throws Error if database operation fails
   */
  async reject(id: number, reason?: string): Promise<Application> {
    try {
      console.log(
        `[applicationWorkflowService] Rejecting application ${id}${
          reason ? ` with reason: ${reason}` : ""
        }`
      );

      const additionalData: Partial<Application> = {};
      if (reason) {
        // Add rejection reason if your Application model supports it
        // additionalData.rejection_reason = reason;
      }

      return await this.updateStatus(id, "rejected", additionalData);
    } catch (error) {
      console.error(
        "[applicationWorkflowService] Failed to reject application:",
        error
      );
      throw error;
    }
  },

  /**
   * Approves an application and converts job seeker to employee
   * @param id Application ID
   * @returns Promise that resolves to updated application
   * @throws Error if database operation fails
   */
  async approve(id: number): Promise<Application> {
    try {
      console.log(`[applicationWorkflowService] Approving application ${id}`);

      // First, update the application status
      const updatedApplication = await this.updateStatus(id, "accepted");

      // Then convert the job seeker to employee
      await this.convertToEmployee(updatedApplication.user_id);

      return updatedApplication;
    } catch (error) {
      console.error(
        "[applicationWorkflowService] Failed to approve application:",
        error
      );
      throw error;
    }
  },

  /**
   * Converts a job seeker to an employee by updating their role and setting hiring date
   * @param userId User ID to convert
   * @throws Error if database operation fails
   */
  async convertToEmployee(userId: string): Promise<void> {
    console.log(
      `[applicationWorkflowService] Converting user ${userId} to employee`
    );

    // Update user role from job_seeker (3) to employee (2)
    const { error: roleError } = await supabase
      .from("user_roles")
      .update({ role_id: 2 })
      .eq("user_id", userId);

    if (roleError) throw roleError;

    // Set hiring date in profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        hiring_date: new Date().toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) throw profileError;
  },

  /**
   * Gets the next valid status in the workflow
   * @param currentStatus Current application status
   * @returns Next status or null if no valid transition
   */
  getNextStatus(currentStatus: string): string | null {
    const statusFlow: Record<string, string> = {
      pending: "interviewing",
      interviewing: "accepted",
    };

    return statusFlow[currentStatus] || null;
  },

  /**
   * Gets all valid statuses that can be transitioned to from current status
   * @param currentStatus Current application status
   * @returns Array of valid next statuses
   */
  getValidTransitions(currentStatus: string): string[] {
    const transitions: Record<string, string[]> = {
      pending: ["interviewing", "rejected"],
      interviewing: ["accepted", "rejected"],
      accepted: [], // Terminal state
      rejected: [], // Terminal state
    };

    return transitions[currentStatus] || [];
  },

  /**
   * Checks if a status transition is valid
   * @param fromStatus Current status
   * @param toStatus Target status
   * @returns True if transition is valid
   */
  isValidTransition(fromStatus: string, toStatus: string): boolean {
    const validTransitions = this.getValidTransitions(fromStatus);
    return validTransitions.includes(toStatus);
  },
};
