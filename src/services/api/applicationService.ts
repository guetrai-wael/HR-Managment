import supabase from "../supabaseClient";
import { Application, FilterValues, UserProfile } from "../../types";
import { handleError } from "../../utils/errorHandler";
import { Dayjs } from "dayjs";
export const fetchApplications = async (
  filters: FilterValues = {},
  isAdmin: boolean,
  userId?: string | null
): Promise<Application[]> => {
  try {
    console.log("fetchApplications: Checking Supabase session before query...");
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();
    if (sessionError) {
      console.error("fetchApplications: Error getting session:", sessionError);
    } else if (!sessionData.session && !isAdmin) {
      console.warn(
        "fetchApplications: No active session found, returning empty array."
      );
      return [];
    } else {
      console.log(
        "fetchApplications: Session check complete.",
        sessionData.session
          ? "Session active."
          : "No session (Admin mode or public data)."
      );
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
        profile:profiles(id, first_name, last_name, email)
      `
      )
      .order("applied_at", { ascending: false });

    // Apply user-specific filter if not admin
    if (!isAdmin && userId) {
      query = query.eq("user_id", userId);
    } else if (!isAdmin && !userId) {
      // If not admin and userId is somehow missing, prevent fetching all data
      console.warn(
        "fetchApplications: Non-admin user ID missing, returning empty array."
      );
      return [];
    }

    // Apply common filters
    if (filters.jobId) {
      query = query.eq("job_id", filters.jobId);
    }
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (
      filters.dateRange &&
      filters.dateRange.length === 2 &&
      filters.dateRange[0] &&
      filters.dateRange[1]
    ) {
      const startDate = (filters.dateRange[0] as Dayjs)
        .startOf("day")
        .toISOString();
      const endDate = (filters.dateRange[1] as Dayjs)
        .endOf("day")
        .toISOString();
      query = query.gte("applied_at", startDate);
      query = query.lte("applied_at", endDate);
    }

    // Admin-specific filters
    if (isAdmin) {
      if (typeof filters.departmentId === "number") {
        console.log(
          `Applying department filter: job.department_id eq ${filters.departmentId}`
        );
        query = query.eq("job.department_id", filters.departmentId);
      } else {
        console.log(
          "No specific department filter applied (departmentId is 'all' or undefined)."
        );
      }

      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(
          `profile.first_name.ilike.${searchTerm},profile.last_name.ilike.${searchTerm},profile.email.ilike.${searchTerm},job.title.ilike.${searchTerm}`
        );
      }
    }

    console.log("Executing query...");
    const { data, error, status } = await query;

    if (error) {
      console.error("Supabase fetch error:", {
        status,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      if (status === 401 || status === 403) {
        console.error(
          "Authorization error detected. Token might be invalid or expired."
        );
      }
      throw error;
    }

    console.log(`Fetched ${data?.length || 0} applications successfully.`);
    return (data as Application[]) || [];
  } catch (error) {
    console.error("Error caught in fetchApplications:", error);
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
      profile:profiles(id, first_name, last_name, email) 
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
      .select("id, first_name, last_name, email")
      .or(
        `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
      )
      .limit(10);

    if (error) throw error;
    return (data as UserProfile[]) || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to search profiles" });
    return [];
  }
};
