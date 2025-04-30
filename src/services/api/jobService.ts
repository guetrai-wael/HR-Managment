import supabase from "../supabaseClient";
import { Job } from "../../types";
import { handleError } from "../../utils/errorHandler";

/**
 * Fetch jobs with optional filtering by department name
 */
export const fetchJobs = async (departmentId?: number): Promise<Job[]> => {
  console.log(`Fetching jobs. Department filter ID: ${departmentId}`);
  try {
    let query = supabase.from("jobs").select(`
      *,
      department:departments!jobs_department_id_fkey (id, name)
    `);

    if (departmentId) {
      console.log(
        `Applying department filter: department_id eq ${departmentId}`
      );
      query = query.eq("department_id", departmentId);
    } else {
      console.log("No department filter applied."); // <<< ADD LOG
    }

    const { data, error } = await query.order("posted_at", {
      ascending: false,
    });

    if (error) {
      console.error("Error fetching jobs:", error);
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} jobs.`);
    return (data as Job[]) || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch jobs" });
    return [];
  }
};

/**
 * Get a specific job by ID
 */
export const getJobById = async (id: string | number): Promise<Job | null> => {
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
      .single();

    if (error) {
      if (error.code === "PGRST116" && !data) {
        console.warn(`Job not found for ID: ${id}`);
        return null;
      }
      throw error;
    }
    return data as Job | null;
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch job details" });
    return null;
  }
};

/**
 * Create a new job
 */
export const createJob = async (jobData: Partial<Job>): Promise<Job | null> => {
  try {
    const { id: _id, department: _deptObj, ...insertData } = jobData;

    // Log the data being sent to insert
    console.log("Attempting to create job with data:", insertData);

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
      // Log the specific insert error
      console.error("Error creating job:", error);
      throw error;
    }
    console.log("Job created successfully:", data);
    return data as Job | null;
  } catch (error) {
    // Use the centralized handler
    handleError(error, { userMessage: "Failed to create job" });
    return null;
  }
};

/**
 * Update an existing job
 */
export const updateJob = async (
  id: number,
  jobData: Partial<Job>
): Promise<Job | null> => {
  try {
    const { id: _jobId, department: _deptObj, ...updateData } = jobData;
    console.log(`Attempting to update job ${id} with data:`, updateData);
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
      throw error;
    }
    console.log(`Job ${id} updated successfully:`, data);
    return data as Job | null;
  } catch (error) {
    handleError(error, { userMessage: "Failed to update job" });
    return null;
  }
};

/**
 * Delete a job by ID
 */
export const deleteJob = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from("jobs").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, { userMessage: "Failed to delete job" });
    return false;
  }
};
