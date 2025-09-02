import supabase from "../supabaseClient";
// import { handleError } from "../../utils/errorHandler"; // To be removed
import { UserProfile } from "../../types/models";

interface EmployeePromotionData {
  position: string;
  department_id: number | null;
  hiring_date: string;
}

export interface EmployeeDataForUI extends UserProfile {
  department_name?: string;
}

// Import role constants from centralized location
import { ROLE_IDS } from "../../types/roles";

// Use centralized role constants instead of local ones
const EMPLOYEE_ROLE_ID = ROLE_IDS.EMPLOYEE;
const JOB_SEEKER_ROLE_ID = ROLE_IDS.JOB_SEEKER;

// --- Refactored for React Query: Returns updated profile or throws error ---
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<UserProfile> & { email?: string } // email is needed for insert
): Promise<UserProfile> => {
  console.log(
    "[userService] updateUserProfile CALLED. userId:",
    userId,
    "profileData:",
    profileData
  );
  // Check if profile exists to determine insert or update
  const { data: existingProfile, error: fetchError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle(); // Use maybeSingle to not throw error if not found

  if (fetchError && fetchError.code !== "PGRST116") {
    // PGRST116 means no rows found, which is fine for insert
    console.error("[userService] Error fetching existing profile:", fetchError);
    throw fetchError;
  }

  const payload = {
    ...profileData,
    updated_at: new Date().toISOString(),
  };

  if (!existingProfile) {
    // INSERT new profile
    console.log(
      "[userService] Attempting to CREATE new profile for userId:",
      userId
    );
    if (!profileData.email) {
      console.error("[userService] Email is required to create a new profile.");
      throw new Error("Email is required to create a new profile.");
    }
    const insertPayload = {
      ...payload,
      id: userId, // Set the id for insert
      email: profileData.email, // Ensure email is part of the payload
    };
    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select()
      .single();
    if (error) {
      console.error("[userService] Supabase insert error:", error);
      throw error;
    }
    console.log("[userService] Profile CREATED:", data);
    return data as UserProfile;
  } else {
    // UPDATE existing profile
    console.log(
      "[userService] Attempting to UPDATE existing profile for userId:",
      userId
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { email, id, ...updatePayload } = payload; // email and id should not be in update payload generally
    const { data, error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .select()
      .single();
    if (error) {
      console.error("[userService] Supabase update error:", error);
      throw error;
    }
    console.log("[userService] Profile UPDATED:", data);
    return data as UserProfile;
  }
};

// --- Refactored for React Query: Returns updated profile or throws error ---
export const updateUserAvatar = async (
  userId: string,
  avatarFile: File
): Promise<UserProfile> => {
  console.log("[userService] updateUserAvatar CALLED. userId:", userId);
  const fileName = `public/${userId}/${Date.now()}_${avatarFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, avatarFile, {
      cacheControl: "3600",
      upsert: true,
    });
  if (uploadError) {
    console.error("[userService] Avatar upload error:", uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(fileName);

  if (!publicUrlData) {
    console.error("[userService] Could not get public URL for avatar.");
    throw new Error("Could not get public URL for avatar.");
  }
  const avatar_url = publicUrlData.publicUrl;

  // Update profile table
  const { data: updatedProfile, error: updateProfileError } = await supabase
    .from("profiles")
    .update({ avatar_url, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (updateProfileError) {
    console.error(
      "[userService] Profile avatar update error:",
      updateProfileError
    );
    throw updateProfileError;
  }

  // Attempt to update auth.user metadata (best effort)
  const { error: userUpdateError } = await supabase.auth.updateUser({
    data: { avatar_url: avatar_url },
  });
  if (userUpdateError) {
    console.warn(
      "[userService] Could not update user metadata avatar_url:",
      userUpdateError.message
    );
  }
  console.log(
    "[userService] Avatar UPDATED and profile updated:",
    updatedProfile
  );
  return updatedProfile as UserProfile;
};

// --- Refactored for React Query: Returns UserProfile or throws error ---
export const fetchUserProfile = async (
  userId: string
): Promise<UserProfile | null> => {
  console.log("[userService] fetchUserProfile CALLED for userId:", userId);
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No profile found
      console.log("[userService] No profile found for userId:", userId);
      return null;
    }
    console.error("[userService] Error fetching profile:", error);
    throw error;
  }
  console.log("[userService] Profile fetched:", data);
  return data as UserProfile;
};

export const promoteUserToEmployee = async (
  userId: string,
  employeeData: EmployeePromotionData
): Promise<UserProfile> => {
  // Return UserProfile for consistency
  console.log(
    "[userService] promoteUserToEmployee CALLED. userId:",
    userId,
    "employeeData:",
    JSON.stringify(employeeData)
  );
  // Step 1: Update the user's profile with employee-specific information
  const { data: profileUpdateData, error: profileError } = await supabase
    .from("profiles")
    .update({
      position: employeeData.position,
      department_id: employeeData.department_id,
      hiring_date: employeeData.hiring_date,
      employment_status: "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    console.error(
      "[userService] ERROR updating 'profiles' for promotion:",
      JSON.stringify(profileError)
    );
    throw profileError;
  }
  console.log(
    `[userService] Profile updated for user ${userId} during promotion. Data:`,
    JSON.stringify(profileUpdateData)
  );

  // Step 2: Upsert the user's role to 'employee'
  const { error: roleError } = await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role_id: EMPLOYEE_ROLE_ID,
    },
    {
      onConflict: "user_id",
    }
  );

  if (roleError) {
    console.error(
      "[userService] ERROR upserting 'user_roles' for promotion:",
      JSON.stringify(roleError)
    );
    throw roleError;
  }
  console.log(
    `[userService] User role upserted to employee for user ${userId}.`
  );
  return profileUpdateData as UserProfile; // Return the updated profile
};

export const terminateEmployee = async (
  userId: string
): Promise<UserProfile> => {
  // Return UserProfile
  console.log(`[userService] terminateEmployee CALLED. userId: ${userId}`);
  // Step 1: Update employment_status in the profiles table
  const { data: profileUpdateData, error: profileError } = await supabase
    .from("profiles")
    .update({
      employment_status: "Terminated",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select()
    .single();

  if (profileError) {
    console.error(
      `[userService] ERROR updating employment_status for userId ${userId}:`,
      JSON.stringify(profileError)
    );
    throw profileError;
  }
  console.log(
    `[userService] Successfully set employment_status to 'Terminated' for userId ${userId}.`
  );

  // Step 2: Update user_role to job_seeker
  const { error: roleError } = await supabase
    .from("user_roles")
    .update({ role_id: JOB_SEEKER_ROLE_ID })
    .eq("user_id", userId);

  if (roleError) {
    console.error(
      `[userService] ERROR updating role to job_seeker for userId ${userId}:`,
      JSON.stringify(roleError)
    );
    throw roleError;
  }
  console.log(
    `[userService] Successfully updated role to job_seeker for userId ${userId}.`
  );
  return profileUpdateData as UserProfile; // Return the updated profile
};

export const getAllEmployees = async (): Promise<EmployeeDataForUI[]> => {
  console.log(
    "[userService] getAllEmployees CALLED (v2 - role & status based)."
  );
  try {
    // Step 1: Get user_ids of current employees
    const { data: employeeRoleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", EMPLOYEE_ROLE_ID);

    if (roleError) {
      console.error(
        "[userService] Supabase ERROR fetching current employee user_ids:",
        JSON.stringify(roleError, null, 2)
      );
      throw roleError;
    }
    const currentEmployeeUserIds = employeeRoleData
      ? employeeRoleData.map((role) => role.user_id)
      : [];
    console.log(
      "[userService] Current employee User IDs:",
      currentEmployeeUserIds
    );

    // Step 2: Get user_ids of terminated employees from profiles table
    const { data: terminatedProfilesData, error: terminatedError } =
      await supabase
        .from("profiles")
        .select("id") // Only select id, as we only need the id here
        .eq("employment_status", "Terminated");

    if (terminatedError) {
      console.error(
        "[userService] Supabase ERROR fetching terminated employee user_ids:",
        JSON.stringify(terminatedError, null, 2)
      );
      throw terminatedError;
    }
    const terminatedEmployeeUserIds = terminatedProfilesData
      ? terminatedProfilesData.map((profile) => profile.id)
      : [];
    console.log(
      "[userService] Terminated employee User IDs:",
      terminatedEmployeeUserIds
    );

    // Step 3: Combine and deduplicate user_ids
    const allRelevantUserIds = Array.from(
      new Set([...currentEmployeeUserIds, ...terminatedEmployeeUserIds])
    );

    console.log(
      "[userService] All relevant User IDs for profile fetch:",
      allRelevantUserIds
    );

    if (allRelevantUserIds.length === 0) {
      console.log("[userService] No relevant employee user_ids found.");
      return [];
    }

    // Step 4: Fetch full profiles for these combined user_ids
    type SupabaseProfileWithDepartment = UserProfile & {
      departments: { name: string } | { name: string }[] | null;
    };

    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select(
        `
        id,
        created_at,
        updated_at,
        email,
        avatar_url,
        first_name,
        last_name,
        phone,
        bio,
        position,
        hiring_date,
        employment_status,
        department_id,
        physical_address, 
        departments ( name )
      `
      )
      .in("id", allRelevantUserIds);

    if (profilesError) {
      console.error(
        "[userService] Supabase ERROR fetching profiles for relevant user_ids:",
        JSON.stringify(profilesError, null, 2)
      );
      throw profilesError;
    }

    if (!profilesData || profilesData.length === 0) {
      console.warn(
        "[userService] No profile data returned for relevant user_ids."
      );
      return [];
    }

    console.log(
      "[userService] Raw profile data from Supabase for relevant employees:",
      JSON.stringify(profilesData, null, 2)
    );

    const transformedData: EmployeeDataForUI[] = (
      profilesData as SupabaseProfileWithDepartment[]
    ).map((profile) => {
      const { departments, ...userProfileFields } = profile;
      let departmentName = "N/A";
      if (Array.isArray(departments) && departments.length > 0) {
        departmentName = departments[0]?.name || "N/A";
      } else if (departments && !Array.isArray(departments)) {
        departmentName = (departments as { name: string })?.name || "N/A";
      }
      return {
        ...userProfileFields,
        department_name: departmentName,
      };
    });

    console.log(
      "[userService] Transformed employee data for UI:",
      JSON.stringify(transformedData, null, 2)
    );
    return transformedData;
  } catch (err) {
    const errorDetails =
      err instanceof Error
        ? { message: err.message, stack: err.stack, name: err.name }
        : err;
    console.error(
      "[userService] CATCH BLOCK in getAllEmployees. Error details:",
      JSON.stringify(errorDetails, null, 2)
    );
    throw err;
  }
};
