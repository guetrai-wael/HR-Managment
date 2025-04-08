import supabase from "../supabaseClient";
import { Application } from "../../types";

/**
 * Fetch applications with optional filtering
 * Can filter by user ID, job ID, or status
 */
export const fetchApplications = async (filters?: {
  userId?: string;
  jobId?: number;
  status?: string;
}): Promise<Application[]> => {
  try {
    let query = supabase
      .from("applications")
      .select("*, job:jobs(*), profiles:profiles(full_name, email)")
      .order("applied_at", { ascending: false });

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

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error("Error fetching applications:", error);
    throw error;
  }
};

/**
 * Get a specific application by ID
 */
export const getApplicationById = async (id: number): Promise<Application> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select("*, job:jobs(*), profiles:profiles(full_name, email)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Application not found");

    return data;
  } catch (error) {
    console.error("Error fetching application details:", error);
    throw error;
  }
};

/**
 * Submit a new job application
 */
export const submitApplication = async (
  applicationData: Partial<Application>
): Promise<Application> => {
  try {
    // Check if user has already applied to this job
    if (applicationData.user_id && applicationData.job_id) {
      const { data: existingApp, error: checkError } = await supabase
        .from("applications")
        .select()
        .eq("job_id", applicationData.job_id)
        .eq("user_id", applicationData.user_id)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existingApp) {
        throw new Error("You have already applied for this job");
      }
    }

    const { data, error } = await supabase
      .from("applications")
      .insert(applicationData)
      .select();

    if (error) throw error;
    if (!data || data.length === 0)
      throw new Error("Failed to submit application");

    return data[0];
  } catch (error) {
    console.error("Error submitting application:", error);
    throw error;
  }
};

/**
 * Update an application's status
 */
export const updateApplicationStatus = async (
  id: number,
  status: "pending" | "accepted" | "rejected" | "interviewing"
): Promise<Application> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0)
      throw new Error("Failed to update application");

    return data[0];
  } catch (error) {
    console.error("Error updating application status:", error);
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
 * Upload a resume file and return the URL
 */
export const uploadResume = async (
  userId: string,
  file: File
): Promise<string> => {
  try {
    // Create a folder with user ID to organize files
    const filePath = `${userId}/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get the public URL
    const { data: urlData } = await supabase.storage
      .from("resumes")
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) throw new Error("Failed to get resume URL");

    return urlData.publicUrl;
  } catch (error) {
    console.error("Error uploading resume:", error);
    throw error;
  }
};
