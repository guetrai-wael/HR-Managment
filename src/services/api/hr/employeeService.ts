import supabase from "../../supabaseClient";
import type { UserProfile } from "../../../types/models";
import { ROLE_IDS } from "../../../types/roles";
import { roleService } from "../core/roleService";

interface EmployeePromotionData {
  position: string;
  department_id: number | null;
  hiring_date: string;
}

export interface EmployeeDataForUI extends UserProfile {
  department_name?: string;
}

// Use centralized role constants
const EMPLOYEE_ROLE_ID = ROLE_IDS.EMPLOYEE;

/**
 * Employee Service - HR workforce management
 *
 * Handles employee-related operations including:
 * - Promoting users to employees
 * - Terminating employee status
 * - Fetching employee lists with department data
 * - Managing employee roles and status
 *
 * This service follows the standardized pattern:
 * { data, isLoading, error, actions }
 */
export const employeeService = {
  /**
   * Promotes user to employee role with employee data
   * @param userId User ID to promote
   * @param employeeData Employee-specific data
   * @returns Promise that resolves to updated profile
   * @throws Error if database operation fails
   */
  async promote(
    userId: string,
    employeeData: EmployeePromotionData
  ): Promise<UserProfile> {
    try {
      console.log("[employeeService] promote called for userId:", userId);

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
          "[employeeService] Profile update failed during promotion:",
          profileError
        );
        throw profileError;
      }

      // Step 2: Assign employee role using roleService
      await roleService.promoteToEmployee(userId);

      console.log("[employeeService] User promoted successfully:", userId);
      return profileUpdateData as UserProfile;
    } catch (error) {
      console.error("[employeeService] Unexpected error in promote:", error);
      throw error;
    }
  },

  /**
   * Terminates employee by updating employment status
   * @param userId User ID to terminate
   * @returns Promise that resolves to updated profile
   * @throws Error if database operation fails
   */
  async terminate(userId: string): Promise<UserProfile> {
    try {
      console.log("[employeeService] terminate called for userId:", userId);

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
          "[employeeService] Profile update failed during termination:",
          profileError
        );
        throw profileError;
      }

      // Step 2: Demote to job seeker role using roleService
      await roleService.demoteToJobSeeker(userId);

      console.log(
        "[employeeService] Employee terminated successfully:",
        userId
      );
      return profileUpdateData as UserProfile;
    } catch (error) {
      console.error("[employeeService] Unexpected error in terminate:", error);
      throw error;
    }
  },

  /**
   * Retrieves all employees (current and terminated)
   * @returns Promise that resolves to array of employee data for UI
   * @throws Error if database operation fails
   */
  async getAll(): Promise<EmployeeDataForUI[]> {
    try {
      console.log("[employeeService] getAll called");

      // Step 1: Get user_ids of current employees
      const { data: employeeRoleData, error: roleError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role_id", EMPLOYEE_ROLE_ID);

      if (roleError) {
        console.error(
          "[employeeService] Failed to fetch current employee user_ids:",
          roleError
        );
        throw roleError;
      }

      const currentEmployeeUserIds = employeeRoleData
        ? employeeRoleData.map((role) => role.user_id)
        : [];

      // Step 2: Get user_ids of terminated employees from profiles table
      const { data: terminatedProfilesData, error: terminatedError } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("employment_status", "Terminated");

      if (terminatedError) {
        console.error(
          "[employeeService] Failed to fetch terminated employee user_ids:",
          terminatedError
        );
        throw terminatedError;
      }

      const terminatedEmployeeUserIds = terminatedProfilesData
        ? terminatedProfilesData.map((profile) => profile.id)
        : [];

      // Step 3: Combine and deduplicate user_ids
      const allRelevantUserIds = Array.from(
        new Set([...currentEmployeeUserIds, ...terminatedEmployeeUserIds])
      );

      if (allRelevantUserIds.length === 0) {
        console.log("[employeeService] No employees found");
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
          "[employeeService] Failed to fetch profiles for relevant user_ids:",
          profilesError
        );
        throw profilesError;
      }

      if (!profilesData || profilesData.length === 0) {
        console.log("[employeeService] No employee profiles found");
        return [];
      }

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
        `[employeeService] Retrieved ${transformedData.length} employees`
      );
      return transformedData;
    } catch (error) {
      console.error("[employeeService] Unexpected error in getAll:", error);
      throw error;
    }
  },

  /**
   * Gets employees by status
   * @param status Employment status to filter by
   * @returns Promise that resolves to array of filtered employee data
   * @throws Error if database operation fails
   */
  async getByStatus(
    status: "Active" | "Terminated"
  ): Promise<EmployeeDataForUI[]> {
    try {
      console.log(
        `[employeeService] getByStatus called with status: ${status}`
      );

      const allEmployees = await this.getAll();
      const filteredEmployees = allEmployees.filter(
        (employee) => employee.employment_status === status
      );

      console.log(
        `[employeeService] Found ${filteredEmployees.length} ${status} employees`
      );
      return filteredEmployees;
    } catch (error) {
      console.error(
        "[employeeService] Unexpected error in getByStatus:",
        error
      );
      throw error;
    }
  },
};
