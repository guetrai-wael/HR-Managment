import supabase from "../../supabaseClient";
import type { Application, FilterValues } from "../../../types";

interface ApplicationFilters extends FilterValues {
  isAdmin: boolean;
  userId?: string | null;
}

/**
 * Service for managing application CRUD operations
 * Handles basic create, read, update, delete operations for job applications
 */
export const applicationCrudService = {
  /**
   * Retrieves all applications with optional filtering
   * @param filters Filters including admin status and user context
   * @returns Promise that resolves to array of applications
   * @throws Error if database operation fails
   */
  async getAll(
    filters: ApplicationFilters = { isAdmin: false }
  ): Promise<Application[]> {
    try {
      console.log(
        "[applicationCrudService] Fetching applications with filters:",
        filters
      );

      // Check session for non-admin users
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError) {
        console.error("[applicationCrudService] Session error:", sessionError);
      } else if (!sessionData.session && !filters.isAdmin) {
        return [];
      }

      let query = supabase
        .from("applications")
        .select(
          `
          *,
          job:jobs!inner(
            id,
            title,
            department_id,
            department:departments (id, name)
          ),
          profile:profiles(id, first_name, last_name, email, avatar_url)
        `
        )
        .order("applied_at", { ascending: false });

      // Apply user filtering for non-admin users
      if (!filters.isAdmin && filters.userId) {
        query = query.eq("user_id", filters.userId);
      } else if (!filters.isAdmin && !filters.userId) {
        console.warn(
          "[applicationCrudService] Non-admin user with no userId, returning empty results"
        );
        return [];
      }

      // Apply search filter if provided
      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        query = query.or(`job.title.ilike.${searchTerm}`);
      }

      // Apply status filter if provided
      if (filters.status && filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Apply job filter if provided
      if (filters.jobId) {
        query = query.eq("job_id", filters.jobId);
      }

      // Apply department filter if provided
      if (filters.departmentId) {
        query = query.eq("job.department_id", filters.departmentId);
      }

      // Apply date range filters if provided
      if (filters.dateRange && filters.dateRange[0]) {
        query = query.gte("applied_at", filters.dateRange[0]);
      }
      if (filters.dateRange && filters.dateRange[1]) {
        query = query.lte("applied_at", filters.dateRange[1]);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          "[applicationCrudService] Error fetching applications:",
          error
        );
        throw error;
      }

      const applications = (data as Application[]) || [];
      console.log(
        `[applicationCrudService] Successfully fetched ${applications.length} applications`
      );
      return applications;
    } catch (error) {
      console.error(
        "[applicationCrudService] Failed to fetch applications:",
        error
      );
      throw error;
    }
  },

  /**
   * Retrieves a single application by ID with detailed information
   * @param id Application ID
   * @returns Promise that resolves to application or null if not found
   * @throws Error if database operation fails
   */
  async getById(id: number): Promise<Application | null> {
    try {
      console.log(`[applicationCrudService] Fetching application by ID: ${id}`);

      const { data, error } = await supabase
        .from("applications")
        .select(
          `
          *,
          job:jobs(
            id, title, description, requirements, responsibilities, location, salary, deadline, status,
            department:departments (id, name)
          ),
          profile:profiles(id, first_name, last_name, email, avatar_url)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(
          `[applicationCrudService] getById failed for ID ${id}:`,
          error
        );
        throw error;
      }

      if (data) {
        console.log(
          `[applicationCrudService] Successfully fetched application ${id}`
        );
      } else {
        console.log(
          `[applicationCrudService] No application found with ID ${id}`
        );
      }

      return (data as Application) || null;
    } catch (error) {
      console.error(
        "[applicationCrudService] Unexpected error in getById:",
        error
      );
      throw error;
    }
  },

  /**
   * Creates a new job application
   * @param applicationData Application data to create
   * @returns Promise that resolves to created application
   * @throws Error if missing required fields or database operation fails
   */
  async create(applicationData: Partial<Application>): Promise<Application> {
    try {
      if (!applicationData.job_id || !applicationData.user_id) {
        throw new Error("Missing job_id or user_id for application creation.");
      }

      console.log("[applicationCrudService] Creating new application:", {
        job_id: applicationData.job_id,
        user_id: applicationData.user_id,
      });

      const { data, error } = await supabase
        .from("applications")
        .insert([
          {
            ...applicationData,
            applied_at: new Date().toISOString(),
            status: "pending", // Default status
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(
          "[applicationCrudService] Error creating application:",
          error
        );
        throw error;
      }

      console.log(
        "[applicationCrudService] Successfully created application:",
        data.id
      );
      return data as Application;
    } catch (error) {
      console.error(
        "[applicationCrudService] Failed to create application:",
        error
      );
      throw error;
    }
  },

  /**
   * Deletes a job application
   * @param id Application ID to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
      console.log(`[applicationCrudService] Deleting application: ${id}`);

      const { error } = await supabase
        .from("applications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(
          `[applicationCrudService] Error deleting application ${id}:`,
          error
        );
        throw error;
      }

      console.log(
        `[applicationCrudService] Successfully deleted application ${id}`
      );
    } catch (error) {
      console.error(
        "[applicationCrudService] Failed to delete application:",
        error
      );
      throw error;
    }
  },

  /**
   * Checks if a user has already applied for a specific job
   * @param userId User ID
   * @param jobId Job ID
   * @returns Promise that resolves to existing application or null
   * @throws Error if database operation fails
   */
  async checkApplicationStatus(
    userId: string,
    jobId: number
  ): Promise<Application | null> {
    try {
      console.log(
        `[applicationCrudService] Checking application status for user ${userId} and job ${jobId}`
      );

      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .eq("user_id", userId)
        .eq("job_id", jobId)
        .maybeSingle();

      if (error) {
        console.error(
          "[applicationCrudService] Error checking application status:",
          error
        );
        throw error;
      }

      if (data) {
        console.log(
          `[applicationCrudService] Found existing application: ${data.id} with status: ${data.status}`
        );
      } else {
        console.log("[applicationCrudService] No existing application found");
      }

      return (data as Application) || null;
    } catch (error) {
      console.error(
        "[applicationCrudService] Failed to check application status:",
        error
      );
      throw error;
    }
  },
};
