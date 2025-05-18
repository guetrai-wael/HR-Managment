import supabase from "../supabaseClient";
import { handleError } from "../../utils/errorHandler";
import { UserProfile } from "../../types/models"; // Ensure UserProfile is correctly defined and imported

// Define the structure for the employee data to be passed for promotion
interface EmployeePromotionData {
  position: string; // Job title
  department_id: number | null;
  hiring_date: string; // Expected format: YYYY-MM-DD
}

// Define the structure for the data returned by getAllEmployees
// Ensure this matches or is compatible with what UI components expect.
export interface EmployeeDataForUI extends UserProfile {
  department_name?: string;
}

const EMPLOYEE_ROLE_ID = 2;
const JOB_SEEKER_ROLE_ID = 3; // Assuming 3 is the role_id for 'job_seeker'

/**
 * Promotes a user to an employee, updating their profile and role.
 */
export const promoteUserToEmployee = async (
  userId: string,
  employeeData: EmployeePromotionData
): Promise<boolean> => {
  console.log(
    "[userService] promoteUserToEmployee CALLED. userId:",
    userId,
    "employeeData:",
    JSON.stringify(employeeData)
  );
  try {
    // Step 1: Update the user\\'s profile with employee-specific information
    const { data: profileUpdateData, error: profileError } = await supabase
      .from("profiles")
      .update({
        position: employeeData.position,
        department_id: employeeData.department_id,
        hiring_date: employeeData.hiring_date,
        employment_status: "Active",
      })
      .eq("id", userId)
      .select() // It\\'s good practice to select to confirm the update
      .single(); // Assuming \\'id\\' is unique and expecting one record

    if (profileError) {
      console.error(
        "[userService] ERROR updating \\'profiles\\' for promotion:",
        JSON.stringify(profileError)
      );
      throw profileError;
    }
    console.log(
      `[userService] Profile updated for user ${userId} during promotion. Data:`,
      JSON.stringify(profileUpdateData)
    );

    // Step 2: Upsert the user\\'s role to \\'employee\\'
    const { data: roleUpsertData, error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_id: userId,
          role_id: EMPLOYEE_ROLE_ID,
        },
        {
          onConflict: "user_id", // Assumes user_id is a unique constraint or PK
        }
      )
      .select(); // Good practice to see what was upserted

    if (roleError) {
      console.error(
        "[userService] ERROR upserting \\'user_roles\\' for promotion:",
        JSON.stringify(roleError)
      );
      throw roleError;
    }
    console.log(
      `[userService] User role upserted to employee for user ${userId}. Data:`,
      JSON.stringify(roleUpsertData)
    );

    return true;
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;
    console.error(
      "[userService] CATCH BLOCK in promoteUserToEmployee. Error:",
      JSON.stringify(errorDetails)
    );
    handleError(error, {
      userMessage:
        "Failed to promote user to employee. Please check details and try again.",
    });
    return false;
  }
};

/**
 * Terminates an employee, updating their employment status and role.
 */
export const terminateEmployee = async (userId: string): Promise<boolean> => {
  console.log(`[userService] terminateEmployee CALLED. userId: ${userId}`);
  try {
    // Step 1: Update employment_status in the profiles table
    const { data: profileUpdateData, error: profileError } = await supabase
      .from("profiles")
      .update({ employment_status: "Terminated" })
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
      `[userService] Successfully set employment_status to \\'Terminated\\' for userId ${userId}. Data:`,
      JSON.stringify(profileUpdateData)
    );

    // Step 2: Update user_role to job_seeker
    const { data: roleUpdateData, error: roleError } = await supabase
      .from("user_roles")
      .update({ role_id: JOB_SEEKER_ROLE_ID })
      .eq("user_id", userId)
      .select(); // See what was updated

    if (roleError) {
      console.error(
        `[userService] ERROR updating role to job_seeker for userId ${userId}:`,
        JSON.stringify(roleError)
      );
      throw roleError;
    }
    console.log(
      `[userService] Successfully updated role to job_seeker for userId ${userId}. Data:`,
      JSON.stringify(roleUpdateData)
    );

    return true;
  } catch (error) {
    const errorDetails =
      error instanceof Error
        ? { message: error.message, stack: error.stack, name: error.name }
        : error;
    console.error(
      `[userService] CATCH BLOCK in terminateEmployee for userId ${userId}. Error:`,
      JSON.stringify(errorDetails)
    );
    handleError(error, {
      userMessage: "Failed to terminate employee. Please check system logs.",
    });
    return false;
  }
};

/**
 * Fetches all users who have the \\'employee\\' role, along with their profile and department information.
 */
export const getAllEmployees = async (): Promise<EmployeeDataForUI[]> => {
  console.log("[userService] getAllEmployees CALLED.");
  try {
    // Step 1: Get all user_ids that have the employee role
    const { data: employeeRoleData, error: roleError } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role_id", EMPLOYEE_ROLE_ID);

    if (roleError) {
      console.error(
        "[userService] Supabase ERROR fetching employee user_ids from user_roles:",
        JSON.stringify(roleError, null, 2)
      );
      throw roleError;
    }

    if (!employeeRoleData || employeeRoleData.length === 0) {
      console.log(
        "[userService] No users found with the employee role in user_roles."
      );
      return []; // No employees to fetch profiles for
    }

    const employeeUserIds = employeeRoleData.map((role) => role.user_id);
    console.log(
      "[userService] User IDs with employee role:",
      JSON.stringify(employeeUserIds)
    );

    // Step 2: Fetch profiles for these user_ids, including department name
    // Explicitly type the expected shape of data from Supabase for profiles
    type SupabaseProfileWithDepartment = UserProfile & {
      departments: { name: string } | null; // departments can be an object or null
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
      .in("id", employeeUserIds);

    if (profilesError) {
      console.error(
        "[userService] Supabase ERROR fetching profiles for employee user_ids:",
        JSON.stringify(profilesError, null, 2)
      );
      throw profilesError;
    }

    if (!profilesData) {
      console.warn(
        "[userService] No profile data returned from Supabase for employee user_ids."
      );
      return [];
    }

    console.log(
      "[userService] Raw profile data from Supabase for employees (Profiles + Department Name):",
      JSON.stringify(profilesData, null, 2)
    );

    // Transform data to include department_name at the top level
    const transformedData: EmployeeDataForUI[] = (
      profilesData as SupabaseProfileWithDepartment[]
    ).map((profile) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { departments, ...userProfileFields } = profile;
      return {
        ...userProfileFields, // Spread all fields from UserProfile
        department_name: profile.departments?.name || "N/A", // Add department_name
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
    handleError(err, {
      userMessage:
        "Failed to fetch the employee list. Please check system logs for more details.",
    });
    return [];
  }
};
