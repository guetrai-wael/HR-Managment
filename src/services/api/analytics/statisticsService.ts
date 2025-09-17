import supabase from "../../supabaseClient";
import type { DashboardStats } from "../../../hooks/useDashboardData";

/**
 * Service for generating dashboard statistics and metrics
 * Handles data aggregation and calculations for dashboard displays
 */
export const statisticsService = {
  /**
   * Retrieves comprehensive dashboard statistics based on user role
   * @param isAdmin Whether user has admin privileges
   * @param isEmployee Whether user is an employee
   * @returns Promise that resolves to dashboard statistics
   * @throws Error if database operation fails or user not authenticated
   */
  async getStats(
    isAdmin: boolean,
    isEmployee: boolean
  ): Promise<DashboardStats> {
    const defaultStats: DashboardStats = {
      registrationRequests: 0,
      leaveRequests: 0,
      jobApplications: 0,
      activeJobs: 0,
      vacationDays: 0,
      sickDays: 0,
      casualDays: 0,
      personalDays: 0,
    };

    try {
      console.log(
        `[statisticsService] Generating stats for ${
          isAdmin ? "admin" : isEmployee ? "employee" : "guest"
        }`
      );

      // Check if user is authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.warn(
          "[statisticsService] User not authenticated, returning default stats"
        );
        return defaultStats;
      }

      if (isAdmin) {
        return await this.getAdminStats();
      }

      if (isEmployee) {
        return await this.getEmployeeStats();
      }

      console.log("[statisticsService] Returning default stats for guest user");
      return defaultStats;
    } catch (error) {
      console.error("[statisticsService] Unexpected error in getStats:", error);
      // Return default stats instead of throwing to prevent dashboard crash
      return defaultStats;
    }
  },

  /**
   * Gets statistics specific to admin users
   * @returns Promise that resolves to admin dashboard statistics
   * @throws Error if database operation fails
   */
  async getAdminStats(): Promise<DashboardStats> {
    try {
      console.log("[statisticsService] Fetching admin statistics");

      // Fetch admin statistics with correct filters
      const [
        { count: registrationRequests },
        { count: leaveRequests },
        { count: jobApplications },
        { count: activeJobs },
      ] = await Promise.all([
        // Count new registrations this month only
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte(
            "created_at",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),

        // Only pending leave requests
        supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),

        // Only pending applications
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),

        // Only jobs with future deadlines (active jobs)
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .gte("deadline", new Date().toISOString().split("T")[0])
          .not("deadline", "is", null),
      ]);

      const adminStats = {
        registrationRequests: registrationRequests || 0,
        leaveRequests: leaveRequests || 0,
        jobApplications: jobApplications || 0,
        activeJobs: activeJobs || 0,
        vacationDays: 0,
        sickDays: 0,
        casualDays: 0,
        personalDays: 0,
      };

      console.log("[statisticsService] Admin stats:", adminStats);
      return adminStats;
    } catch (error) {
      console.error("[statisticsService] Error fetching admin stats:", error);
      // Return default admin stats instead of throwing
      return {
        registrationRequests: 0,
        leaveRequests: 0,
        jobApplications: 0,
        activeJobs: 0,
        vacationDays: 0,
        sickDays: 0,
        casualDays: 0,
        personalDays: 0,
      };
    }
  },

  /**
   * Gets statistics specific to employee users
   * @returns Promise that resolves to employee dashboard statistics
   * @throws Error if database operation fails or user not authenticated
   */
  async getEmployeeStats(): Promise<DashboardStats> {
    try {
      console.log("[statisticsService] Fetching employee statistics");

      // Fetch employee statistics - days SPENT by category
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
      }

      // Get all APPROVED leave requests to calculate days spent
      const { data: approvedLeaves, error: leavesError } = await supabase
        .from("leave_requests")
        .select("start_date, end_date, status, leave_type_id")
        .eq("user_id", user.user.id)
        .eq("status", "approved");

      if (leavesError) {
        console.error(
          "[statisticsService] Error fetching leave requests:",
          leavesError
        );
        throw leavesError;
      }

      // Get leave types separately to avoid TS issues
      const { data: leaveTypes, error: typesError } = await supabase
        .from("leave_types")
        .select("id, name");

      if (typesError) {
        console.error(
          "[statisticsService] Error fetching leave types:",
          typesError
        );
        throw typesError;
      }

      // Create a lookup map for leave types
      const leaveTypeMap = new Map<number, string>();
      if (leaveTypes) {
        leaveTypes.forEach((type) => {
          leaveTypeMap.set(type.id, type.name);
        });
      }

      // Calculate days spent by category
      const daysSpent = {
        vacationDays: 0,
        sickDays: 0,
        casualDays: 0,
        personalDays: 0,
      };

      if (approvedLeaves) {
        approvedLeaves.forEach((leave) => {
          // Calculate days between start and end date
          const startDate = new Date(leave.start_date);
          const endDate = new Date(leave.end_date);
          const daysDiff =
            Math.ceil(
              (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
            ) + 1;

          // Get leave type name and categorize
          const leaveTypeName = leaveTypeMap
            .get(leave.leave_type_id)
            ?.toLowerCase();

          if (leaveTypeName) {
            if (leaveTypeName.includes("vacation")) {
              daysSpent.vacationDays += daysDiff;
            } else if (leaveTypeName.includes("sick")) {
              daysSpent.sickDays += daysDiff;
            } else if (leaveTypeName.includes("casual")) {
              daysSpent.casualDays += daysDiff;
            } else if (leaveTypeName.includes("personal")) {
              daysSpent.personalDays += daysDiff;
            }
          }
        });
      }

      const employeeStats = {
        registrationRequests: 0,
        leaveRequests: 0,
        jobApplications: 0,
        activeJobs: 0,
        ...daysSpent,
      };

      console.log("[statisticsService] Employee stats:", employeeStats);
      return employeeStats;
    } catch (error) {
      console.error(
        "[statisticsService] Error fetching employee stats:",
        error
      );
      // Return default employee stats instead of throwing
      return {
        registrationRequests: 0,
        leaveRequests: 0,
        jobApplications: 0,
        activeJobs: 0,
        vacationDays: 0,
        sickDays: 0,
        casualDays: 0,
        personalDays: 0,
      };
    }
  },

  /**
   * Gets summary statistics for quick overview
   * @returns Promise that resolves to summary statistics
   */
  async getSummaryStats(): Promise<{
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
    totalLeaveRequests: number;
  }> {
    try {
      console.log("[statisticsService] Fetching summary statistics");

      const [
        { count: totalUsers },
        { count: totalJobs },
        { count: totalApplications },
        { count: totalLeaveRequests },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("jobs").select("*", { count: "exact", head: true }),
        supabase
          .from("applications")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("leave_requests")
          .select("*", { count: "exact", head: true }),
      ]);

      const summaryStats = {
        totalUsers: totalUsers || 0,
        totalJobs: totalJobs || 0,
        totalApplications: totalApplications || 0,
        totalLeaveRequests: totalLeaveRequests || 0,
      };

      console.log("[statisticsService] Summary stats:", summaryStats);
      return summaryStats;
    } catch (error) {
      console.error("[statisticsService] Error fetching summary stats:", error);
      throw error;
    }
  },
};
