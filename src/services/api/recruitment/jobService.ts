import supabase from "../../supabaseClient";
import type { Job } from "../../../types";

interface JobFilters {
  departmentId?: number;
}

export const jobService = {
  /**
   * Retrieves all jobs with optional filtering by department
   * @param filters Optional filters to apply to the query
   * @returns Promise that resolves to array of jobs
   * @throws Error if database operation fails
   */
  async getAll(filters?: JobFilters): Promise<Job[]> {
    try {
      let query = supabase.from("jobs").select(`
          *,
          department:departments!jobs_department_id_fkey (id, name)
        `);

      if (filters?.departmentId) {
        query = query.eq("department_id", filters.departmentId);
      }

      const { data, error } = await query.order("posted_at", {
        ascending: false,
      });

      if (error) {
        console.error("[jobService] getAll failed:", error);
        throw error;
      }

      return (data as Job[]) || [];
    } catch (error) {
      console.error("[jobService] Unexpected error in getAll:", error);
      throw error;
    }
  },

  /**
   * Retrieves a specific job by ID
   * @param id The job ID to fetch
   * @returns Promise that resolves to job or null if not found
   * @throws Error if database operation fails
   */
  async getById(id: string | number): Promise<Job | null> {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          department:departments!jobs_department_id_fkey (id, name)
        `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(`[jobService] getById failed for ID ${id}:`, error);
        throw error;
      }

      return (data as Job) || null;
    } catch (error) {
      console.error("[jobService] Unexpected error in getById:", error);
      throw error;
    }
  },

  /**
   * Creates a new job
   * @param jobData Job data to create
   * @returns Promise that resolves to created job
   * @throws Error if database operation fails
   */
  async create(jobData: Partial<Job>): Promise<Job> {
    try {
      const { id: _id, department: _deptObj, ...insertData } = jobData;

      const { data, error } = await supabase
        .from("jobs")
        .insert(insertData)
        .select(
          `
          *,
          department:departments!jobs_department_id_fkey (id, name)
        `
        )
        .single();

      if (error) {
        console.error("[jobService] create failed:", error);
        throw error;
      }

      return data as Job;
    } catch (error) {
      console.error("[jobService] Unexpected error in create:", error);
      throw error;
    }
  },

  /**
   * Updates an existing job
   * @param id Job ID to update
   * @param jobData Updated job data
   * @returns Promise that resolves to updated job
   * @throws Error if database operation fails
   */
  async update(id: number, jobData: Partial<Job>): Promise<Job> {
    try {
      const { id: _jobId, department: _deptObj, ...updateData } = jobData;

      const { data, error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
        .select(
          `
          *,
          department:departments!jobs_department_id_fkey (id, name)
        `
        )
        .single();

      if (error) {
        console.error(`[jobService] update failed for ID ${id}:`, error);
        throw error;
      }

      return data as Job;
    } catch (error) {
      console.error("[jobService] Unexpected error in update:", error);
      throw error;
    }
  },

  /**
   * Deletes a job by ID
   * @param id Job ID to delete
   * @returns Promise that resolves when deletion is complete
   * @throws Error if database operation fails
   */
  async delete(id: number): Promise<void> {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) {
        console.error(`[jobService] delete failed for ID ${id}:`, error);
        throw error;
      }
    } catch (error) {
      console.error("[jobService] Unexpected error in delete:", error);
      throw error;
    }
  },
};
