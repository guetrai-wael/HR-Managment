import supabase from "../supabaseClient";
import type {
  DashboardStats,
  DashboardActivity,
} from "../../hooks/useDashboardData";

class DashboardService {
  // Helper method to automatically close expired jobs
  private async closeExpiredJobs(): Promise<void> {
    try {
      // Get all open jobs with deadlines
      const { data: openJobs } = await supabase
        .from("jobs")
        .select("id, deadline")
        .eq("status", "Open")
        .not("deadline", "is", null);

      if (!openJobs || openJobs.length === 0) return;

      // Find jobs that are past their deadline
      const today = new Date();
      const expiredJobIds = openJobs
        .filter((job) => {
          if (!job.deadline) return false;
          const deadlineDate = new Date(job.deadline);
          deadlineDate.setHours(23, 59, 59, 999);
          return today > deadlineDate;
        })
        .map((job) => job.id);

      // Update expired jobs to "Closed" status
      if (expiredJobIds.length > 0) {
        const { error } = await supabase
          .from("jobs")
          .update({ status: "Closed" })
          .in("id", expiredJobIds);

        if (error) {
          console.error("Error closing expired jobs:", error);
        } else {
          console.log(
            `Automatically closed ${expiredJobIds.length} expired jobs`
          );
        }
      }
    } catch (error) {
      console.error("Error in closeExpiredJobs:", error);
    }
  }

  async getStats(
    isAdmin: boolean,
    isEmployee: boolean
  ): Promise<DashboardStats> {
    // First, automatically close any expired jobs before calculating stats
    if (isAdmin) {
      await this.closeExpiredJobs();
    }
    if (isAdmin) {
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

        // Only open jobs (6 open jobs, not 7 total)
        supabase
          .from("jobs")
          .select("*", { count: "exact", head: true })
          .eq("status", "Open"),
      ]);

      return {
        registrationRequests: registrationRequests || 0,
        leaveRequests: leaveRequests || 0,
        jobApplications: jobApplications || 0,
        activeJobs: activeJobs || 0,
      };
    }

    if (isEmployee) {
      // Fetch employee statistics - days SPENT by category
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      // Get all APPROVED leave requests to calculate days spent
      const { data: approvedLeaves } = await supabase
        .from("leave_requests")
        .select("start_date, end_date, status, leave_type_id")
        .eq("user_id", user.user.id)
        .eq("status", "approved");

      // Get leave types separately to avoid TS issues
      const { data: leaveTypes } = await supabase
        .from("leave_types")
        .select("id, name");

      // Create a lookup map for leave types
      const leaveTypeMap = new Map();
      if (leaveTypes) {
        leaveTypes.forEach((type) => {
          leaveTypeMap.set(type.id, type.name);
        });
      }

      // Calculate days spent by category
      const daysSpent = {
        vacation: 0,
        sick: 0,
        casual: 0,
        personal: 0,
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
          const leaveTypeName = (
            leaveTypeMap.get(leave.leave_type_id) || ""
          ).toLowerCase();

          if (
            leaveTypeName.includes("vacation") ||
            leaveTypeName.includes("annual")
          ) {
            daysSpent.vacation += daysDiff;
          } else if (
            leaveTypeName.includes("sick") ||
            leaveTypeName.includes("medical")
          ) {
            daysSpent.sick += daysDiff;
          } else if (
            leaveTypeName.includes("casual") ||
            leaveTypeName.includes("emergency")
          ) {
            daysSpent.casual += daysDiff;
          } else if (
            leaveTypeName.includes("personal") ||
            leaveTypeName.includes("maternity") ||
            leaveTypeName.includes("paternity")
          ) {
            daysSpent.personal += daysDiff;
          } else {
            // Default to vacation if type is unclear
            daysSpent.vacation += daysDiff;
          }
        });
      }

      return {
        vacationDays: daysSpent.vacation, // Days SPENT on vacation
        casualDays: daysSpent.casual, // Days SPENT on casual leave
        personalDays: daysSpent.personal, // Days SPENT on personal leave
        sickDays: daysSpent.sick, // Days SPENT on sick leave
      };
    }

    return {};
  }

  async getActivities(
    isAdmin: boolean,
    isEmployee: boolean
  ): Promise<DashboardActivity[]> {
    if (isAdmin) {
      // Fetch recent admin activities
      const activities: DashboardActivity[] = [];

      // Recent leave requests (limit to 3 to make room for applications)
      const { data: leaveRequests } = await supabase
        .from("leave_requests")
        .select("id, start_date, status, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (leaveRequests && leaveRequests.length > 0) {
        leaveRequests.forEach((request) => {
          activities.push({
            id: `leave-${request.id}`,
            type: "leave_request",
            title: "Leave Request Submitted",
            description: `Leave starting ${request.start_date} - Status: ${request.status}`,
            created_at: request.created_at,
            status: request.status,
          });
        });
      }

      // Recent job applications (ensure they show up)
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, applied_at")
        .order("applied_at", { ascending: false })
        .limit(5);

      if (applications && applications.length > 0) {
        applications.forEach((application) => {
          activities.push({
            id: `app-${application.id}`,
            type: "application",
            title: "Job Application Received",
            description: `New application - Status: ${application.status}`,
            created_at: application.applied_at,
            status: application.status,
          });
        });
      }

      // Recent job postings
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, title, status, posted_at")
        .order("posted_at", { ascending: false })
        .limit(2);

      if (jobs && jobs.length > 0) {
        jobs.forEach((job) => {
          activities.push({
            id: `job-${job.id}`,
            type: "job",
            title: "New Job Posted",
            description: `${job.title} - Status: ${job.status}`,
            created_at: job.posted_at,
            status: job.status,
          });
        });
      }

      // Sort by created_at and return latest
      return activities
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 20);
    }

    if (isEmployee) {
      // Fetch employee activities
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("User not authenticated");

      const activities: DashboardActivity[] = [];

      // User's leave requests
      const { data: leaveRequests } = await supabase
        .from("leave_requests")
        .select("id, start_date, status, created_at")
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false })
        .limit(5);

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

      // User's job applications
      const { data: applications } = await supabase
        .from("applications")
        .select("id, status, applied_at")
        .eq("user_id", user.user.id)
        .order("applied_at", { ascending: false })
        .limit(5);

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

      return activities
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 20);
    }

    return [];
  }
}

export const dashboardService = new DashboardService();
