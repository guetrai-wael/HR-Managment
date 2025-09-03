import supabase from "../supabaseClient";
import { Application, FilterValues, UserProfile } from "../../types";
import dayjs from "dayjs";

export const fetchApplications = async (
  filters: FilterValues = {},
  isAdmin: boolean,
  userId?: string | null
): Promise<Application[]> => {
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();
  if (sessionError) {
    console.error("fetchApplications: Error getting session:", sessionError);
  } else if (!sessionData.session && !isAdmin) {
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
        profile:profiles(id, first_name, last_name, email)
      `
    )
    .order("applied_at", { ascending: false });

  if (!isAdmin && userId) {
    query = query.eq("user_id", userId);
  } else if (!isAdmin && !userId) {
    return [];
  }

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
    const startDate = dayjs(filters.dateRange[0]).startOf("day").toISOString();
    const endDate = dayjs(filters.dateRange[1]).endOf("day").toISOString();
    query = query.gte("applied_at", startDate);
    query = query.lte("applied_at", endDate);
  }

  if (isAdmin) {
    if (typeof filters.departmentId === "number") {
      query = query.eq("job.department_id", filters.departmentId);
    }
    // Note: Removed complex search for now due to Supabase limitations with joined table or() queries
    // We'll implement search on the frontend after data is fetched
  }

  const { data, error, status } = await query;

  if (error) {
    console.error("Supabase fetch error in fetchApplications:", {
      status,
      message: error.message,
      details: error.details,
      hint: error.hint,
    });
    throw error;
  }

  return (data as Application[]) || [];
};

export const getApplicationById = async (
  id: number
): Promise<Application | null> => {
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
      return null;
    }
    console.error("Supabase fetch error in getApplicationById:", error);
    throw error;
  }
  return data as Application | null;
};

export const createApplication = async (
  applicationData: Partial<Application>
): Promise<Application | null> => {
  if (!applicationData.job_id || !applicationData.user_id) {
    throw new Error("Missing job_id or user_id for application creation.");
  }
  
  // Extract only the fields needed for insertion, excluding computed fields
  const { id: _id, job: _job, profile: _profile, ...insertData } = applicationData;

  const { data, error } = await supabase
    .from("applications")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error in createApplication:", error);
    throw error;
  }
  return data as Application | null;
};

export const updateApplicationStatus = async (
  id: number,
  status: string
): Promise<Application | null> => {
  const { data, error } = await supabase
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Supabase update error in updateApplicationStatus:", error);
    throw error;
  }
  return data as Application | null;
};

export const deleteApplication = async (id: number): Promise<boolean> => {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) {
    console.error("Supabase delete error in deleteApplication:", error);
    throw error;
  }
  return true;
};

export const searchProfiles = async (
  searchTerm: string
): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email")
    .or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
    )
    .limit(10);

  if (error) {
    console.error("Supabase search error in searchProfiles:", error);
    throw error;
  }
  return (data as UserProfile[]) || [];
};

export const checkApplicationStatus = async (
  jobId: string,
  userId: string
): Promise<{ applied: boolean }> => {
  if (!userId || !jobId) return { applied: false };
  const { data, error } = await supabase
    .from("applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Supabase error in checkApplicationStatus:", error);
    throw error;
  }
  return { applied: !!data };
};
