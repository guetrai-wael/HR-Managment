import supabase from "../../supabaseClient";
import type { DashboardActivity } from "../../../hooks/useDashboardData";

/**
 * Service for managing dashboard activity feeds and event tracking
 * Handles activity generation and historical event management
 */
export const activityService = {
  /**
   * Retrieves activity feed based on user role
   * @param isAdmin Whether user has admin privileges
   * @param isEmployee Whether user is an employee
   * @returns Promise that resolves to array of dashboard activities
   * @throws Error if database operation fails or user not authenticated
   */
  async getActivities(
    isAdmin: boolean,
    isEmployee: boolean
  ): Promise<DashboardActivity[]> {
    try {
      console.log(
        `[activityService] Fetching activities for ${
          isAdmin ? "admin" : isEmployee ? "employee" : "guest"
        }`
      );

      if (isAdmin) {
        return await this.getAdminActivities();
      }

      if (isEmployee) {
        return await this.getEmployeeActivities();
      }

      console.log(
        "[activityService] Returning empty activities for guest user"
      );
      return [];
    } catch (error) {
      console.error(
        "[activityService] Unexpected error in getActivities:",
        error
      );
      // Return empty array instead of throwing to prevent dashboard crash
      return [];
    }
  },

  /**
   * Gets activities visible to admin users (all recent system activities)
   * @returns Promise that resolves to admin activity feed
   * @throws Error if database operation fails
   */
  async getAdminActivities(): Promise<DashboardActivity[]> {
    try {
      console.log("[activityService] Fetching admin activities");

      const activities: DashboardActivity[] = [];

      // Get recent job applications for admin visibility
      const { data: recentApplications, error: appsError } = await supabase
        .from("applications")
        .select("id, status, applied_at")
        .order("applied_at", { ascending: false })
        .limit(10);

      if (appsError) {
        console.error(
          "[activityService] Error fetching applications:",
          appsError
        );
        throw appsError;
      }

      recentApplications?.forEach((application) => {
        activities.push({
          id: `admin-app-${application.id}`,
          type: "application",
          title: "New Job Application",
          description: `Application ${application.status}`,
          created_at: application.applied_at,
          status: application.status,
        });
      });

      // Get recent leave requests for admin visibility
      const { data: recentLeaveRequests, error: leaveError } = await supabase
        .from("leave_requests")
        .select("id, start_date, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (leaveError) {
        console.error(
          "[activityService] Error fetching leave requests:",
          leaveError
        );
        throw leaveError;
      }

      recentLeaveRequests?.forEach((request) => {
        activities.push({
          id: `admin-leave-${request.id}`,
          type: "leave_request",
          title: "Leave Request",
          description: `Leave starting ${request.start_date} - ${request.status}`,
          created_at: request.created_at,
          status: request.status,
        });
      });

      // Sort by most recent and limit to 20 items
      const sortedActivities = activities
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 20);

      console.log(
        `[activityService] Returning ${sortedActivities.length} admin activities`
      );
      return sortedActivities;
    } catch (error) {
      console.error(
        "[activityService] Error fetching admin activities:",
        error
      );
      throw error;
    }
  },

  /**
   * Gets activities visible to employee users (their own activities)
   * @returns Promise that resolves to employee activity feed
   * @throws Error if database operation fails or user not authenticated
   */
  async getEmployeeActivities(): Promise<DashboardActivity[]> {
    try {
      console.log("[activityService] Fetching employee activities");

      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      const activities: DashboardActivity[] = [];

      // Get user's leave requests
      const { data: leaveRequests, error: leaveError } = await supabase
        .from("leave_requests")
        .select("id, start_date, status, created_at")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (leaveError) {
        console.error(
          "[activityService] Error fetching user leave requests:",
          leaveError
        );
        throw leaveError;
      }

      leaveRequests?.forEach((request) => {
        activities.push({
          id: `leave-${request.id}`,
          type: "leave_request",
          title: "Your Leave Request",
          description: `Leave starting ${request.start_date} - ${request.status}`,
          created_at: request.created_at,
          status: request.status,
        });
      });

      // Get user's job applications
      const { data: applications, error: appsError } = await supabase
        .from("applications")
        .select("id, status, applied_at")
        .eq("user_id", user.user.id)
        .order("applied_at", { ascending: false })
        .limit(5);

      if (appsError) {
        console.error(
          "[activityService] Error fetching user applications:",
          appsError
        );
        throw appsError;
      }

      applications?.forEach((application) => {
        activities.push({
          id: `app-${application.id}`,
          type: "application",
          title: "Your Job Application",
          description: `Application ${application.status}`,
          created_at: application.applied_at,
          status: application.status,
        });
      });

      // Sort by most recent and limit to 20 items
      const sortedActivities = activities
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 20);

      console.log(
        `[activityService] Returning ${sortedActivities.length} employee activities`
      );
      return sortedActivities;
    } catch (error) {
      console.error(
        "[activityService] Error fetching employee activities:",
        error
      );
      throw error;
    }
  },

  /**
   * Gets recent system-wide activity summary for admin dashboard
   * @returns Promise that resolves to activity summary statistics
   */
  async getActivitySummary(): Promise<{
    recentApplications: number;
    recentLeaveRequests: number;
    recentRegistrations: number;
    lastUpdateTime: string;
  }> {
    try {
      console.log("[activityService] Fetching activity summary");

      const now = new Date();
      const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [
        { count: recentApplications },
        { count: recentLeaveRequests },
        { count: recentRegistrations },
      ] = await Promise.all([
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .gte("applied_at", last24Hours.toISOString()),

        supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .gte("created_at", last24Hours.toISOString()),

        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", last24Hours.toISOString()),
      ]);

      const summary = {
        recentApplications: recentApplications || 0,
        recentLeaveRequests: recentLeaveRequests || 0,
        recentRegistrations: recentRegistrations || 0,
        lastUpdateTime: now.toISOString(),
      };

      console.log("[activityService] Activity summary:", summary);
      return summary;
    } catch (error) {
      console.error(
        "[activityService] Error fetching activity summary:",
        error
      );
      throw error;
    }
  },
};
