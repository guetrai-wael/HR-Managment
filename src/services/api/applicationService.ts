import supabase from "../supabaseClient";
import { Application, FilterValues, UserProfile } from "../../types";
import { handleError } from "../../utils/errorHandler";

export const fetchApplications = async (
  filters: FilterValues = {},
  isAdmin: boolean,
  userId?: string | null
): Promise<Application[]> => {
  try {
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
        profile:profiles(id, full_name, email)
      `
      )
      .order("applied_at", { ascending: false });

    // Apply user-specific filter if not admin
    if (!isAdmin && userId) {
      query = query.eq("user_id", userId);
    }

    // Apply common filters
    if (filters.jobId) {
      query = query.eq("job_id", filters.jobId);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startDate = new Date(filters.dateRange[0]).toISOString();
      const endDate = new Date(filters.dateRange[1]).toISOString();
      query = query.gte("applied_at", startDate);
      query = query.lte("applied_at", endDate);
    }

    // Admin-specific filters
    if (isAdmin) {
      if (filters.departmentId) {
        query = query.eq("job.department.id", filters.departmentId);
      }
      if (filters.search) {
        query = query.or(
          `profile.full_name.ilike.%${filters.search}%,profile.email.ilike.%${filters.search}%,job.title.ilike.%${filters.search}%`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data as Application[]) || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch applications" });
    return [];
  }
};

export const getApplicationById = async (
  id: number
): Promise<Application | null> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .select(
        `
      *,
      job:jobs(
          id, title, description, requirements, responsibilities, location, salary, deadline, status, 
          department:departments (id, name) 
      ),
      profile:profiles(id, full_name, email) 
    `
      )
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116" && !data) {
        console.warn(`Application not found for ID: ${id}`);
        return null;
      }
      throw error;
    }
    return data as Application | null;
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch application details" });
    return null;
  }
};

// --- createApplication ---
export const createApplication = async (
  applicationData: Partial<Application>
): Promise<Application | null> => {
  try {
    if (!applicationData.job_id || !applicationData.user_id) {
      throw new Error("Missing job_id or user_id for application creation.");
    }
    const {
      id: _id,
      job: _job,
      profile: _profile,
      ...insertData
    } = applicationData;

    const { data, error } = await supabase
      .from("applications")
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as Application | null;
  } catch (error) {
    handleError(error, { userMessage: "Failed to submit application" });
    return null;
  }
};

// --- updateApplicationStatus ---
export const updateApplicationStatus = async (
  id: number,
  status: string
): Promise<Application | null> => {
  try {
    const { data, error } = await supabase
      .from("applications")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Application | null;
  } catch (error) {
    handleError(error, { userMessage: "Failed to update application status" });
    return null;
  }
};

// --- deleteApplication ---
export const deleteApplication = async (id: number): Promise<boolean> => {
  try {
    const { error } = await supabase.from("applications").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, { userMessage: "Failed to delete application" });
    return false;
  }
};

// --- searchProfiles ---
export const searchProfiles = async (
  searchTerm: string
): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10);

    if (error) throw error;
    return (data as UserProfile[]) || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to search profiles" });
    return [];
  }
};
