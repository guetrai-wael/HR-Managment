import supabase from "../supabaseClient";
import { Application } from "../../types";
import { handleError } from "../../utils/errorHandler";

// Update the fetchApplications function:
export const fetchApplications = async (filters?: {
  userId?: string;
  jobId?: number;
  departmentId?: string;
  status?: string;
  dateRange?: [string, string];
  search?: string;
}): Promise<Application[]> => {
  try {
    // Create a query with proper joins
    let query = supabase.from("applications").select(`
        *,
        job:jobs(*), 
        profile:profiles(*)
      `);

    // Apply filters if provided
    if (filters?.userId) {
      query = query.eq("user_id", filters.userId);
    }

    if (filters?.jobId) {
      query = query.eq("job_id", filters.jobId);
    }

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }

    if (filters?.departmentId) {
      // First, get jobs that belong to this department
      const { data: jobsInDepartment } = await supabase
        .from("jobs")
        .select("id")
        .eq("department_id", filters.departmentId);

      if (jobsInDepartment && jobsInDepartment.length > 0) {
        // Get the job IDs in this department
        const jobIds = jobsInDepartment.map((job) => job.id);
        // Filter applications by those job IDs
        query = query.in("job_id", jobIds);
      } else {
        // If no jobs found in this department, return empty result
        return [];
      }
    }

    if (filters?.search) {
      // Don't use OR operator directly, use filter() instead
      const searchTerm = `%${filters.search}%`;

      // Get profiles that match the search term first
      const { data: matchingProfiles } = await supabase
        .from("profiles")
        .select("id")
        .or(`full_name.ilike.${searchTerm},email.ilike.${searchTerm}`);

      if (matchingProfiles && matchingProfiles.length > 0) {
        // Get the profile IDs that matched
        const profileIds = matchingProfiles.map((p) => p.id);
        // Filter applications by those profile IDs
        query = query.in("user_id", profileIds);
      } else {
        // No matching profiles, return empty result
        return [];
      }
    }

    if (filters?.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      query = query
        .gte("applied_at", filters.dateRange[0])
        .lte("applied_at", filters.dateRange[1]);
    }

    const { data, error } = await query.order("applied_at", {
      ascending: false,
    });

    if (error) throw error;

    return data || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch applications" });
    return [];
  }
};
/**
 * Update an application status
 */

export const updateApplicationStatus = async (
  id: number,
  status: string
): Promise<Application> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, {
      userMessage: `Failed to update application status to ${status}`,
    });
    throw error;
  }
};

/**
 * Submit a new application
 */
export const submitApplication = async (
  applicationData: Partial<Application>
): Promise<Application> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .insert([applicationData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, {
      userMessage: "Error submitting application",
    });
    throw error;
  }
};

/**
 * Delete an application
 */
export const deleteApplication = async (id: number): Promise<void> => {
  try {
    const { error } = await supabase.from("applications").delete().eq("id", id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting application:", error);
    throw error;
  }
};

/**
 * Upload resume file and get URL
 */
export const uploadResume = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `resumes/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("applications")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from("applications")
      .getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
};
