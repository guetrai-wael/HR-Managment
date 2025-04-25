import supabase from "../supabaseClient";
import { Job } from "../../types";

/**
 * Fetch jobs with optional filtering by department
 */
export const fetchJobs = async (department?: string): Promise<Job[]> => {
  try {
    console.log("Fetching jobs with department filter:", department);
    let query = supabase
      .from("jobs")
      .select("*")
      .order("posted_at", { ascending: false });

    if (department && department !== "all") {
      query = query.eq("department", department);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error fetching jobs:", error);
      throw error;
    }

    console.log("Jobs fetched successfully:", data?.length || 0, "results");

    return data || [];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
};

/**
 * Get a specific job by ID
 */
export const getJobById = async (id: string | number): Promise<Job> => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Job not found");

    return data;
  } catch (error) {
    console.error("Error fetching job details:", error);
    throw error;
  }
};

/**
 * Create a new job
 */
export const createJob = async (jobData: Partial<Job>): Promise<Job> => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .insert(jobData)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to create job");

    return data[0];
  } catch (error) {
    console.error("Error creating job:", error);
    throw error;
  }
};

/**
 * Update an existing job
 */
export const updateJob = async (
  id: number,
  jobData: Partial<Job>
): Promise<Job> => {
  try {
    const { data, error } = await supabase
      .from("jobs")
      .update(jobData)
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Failed to update job");

    return data[0];
  } catch (error) {
    console.error("Error updating job:", error);
    throw error;
  }
};

/**
 * Delete a job by ID
 */
export const deleteJob = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.from("jobs").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting job:", error);
    throw error;
  }
};
