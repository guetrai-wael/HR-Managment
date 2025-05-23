import supabase from "../supabaseClient";
import { Job } from "../../types";

/**
 * Fetch jobs with optional filtering by department name
 */
export const fetchJobs = async (departmentId?: number): Promise<Job[]> => {
  let query = supabase.from("jobs").select(`
      *,
      department:departments!jobs_department_id_fkey (id, name)
    `);

  if (departmentId) {
    query = query.eq("department_id", departmentId);
  }

  const { data, error } = await query.order("posted_at", {
    ascending: false,
  });

  if (error) {
    console.error("Error fetching jobs:", error);
    throw error; // Re-throw for React Query
  }

  return (data as Job[]) || [];
};

/**
 * Get a specific job by ID
 */
export const getJobById = async (id: string | number): Promise<Job | null> => {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
        *,
        department:departments!jobs_department_id_fkey (id, name) 
      `
    )
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116" && !data) {
      return null; // Expected case, not an error to throw
    }
    console.error("Error fetching job by ID:", error);
    throw error; // Re-throw other errors
  }
  return data as Job | null;
};

/**
 * Create a new job
 */
export const createJob = async (jobData: Partial<Job>): Promise<Job | null> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    console.error("Error creating job:", error);
    throw error; // Re-throw for React Query
  }
  return data as Job | null;
};

/**
 * Update an existing job
 */
export const updateJob = async (
  id: number,
  jobData: Partial<Job>
): Promise<Job | null> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    console.error(`Error updating job ${id}:`, error);
    throw error; // Re-throw for React Query
  }
  return data as Job | null;
};

/**
 * Delete a job by ID
 */
export const deleteJob = async (id: number): Promise<boolean> => {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) {
    console.error("Error deleting job:", error);
    throw error; // Re-throw for React Query
  }
  return true;
};
