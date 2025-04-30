import supabase from "../supabaseClient";
import { Department } from "../../types/models";
import { handleError } from "../../utils/errorHandler";
/**
 * Fetch all departments
 */
export const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch departments" });
    return [];
  }
};
/**
 * Get a specific department by ID
 */
export const getDepartmentById = async (
  id: string
): Promise<Department | null> => {
  if (!id) {
    console.warn("getDepartmentById called without an ID.");
    return null;
  }
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
      if (error.code === "PGRST116" && !data) {
        console.warn(`Department not found for ID: ${id}`);
        return null;
      }
      throw error;
    }
    return data;
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch department details" });
    return null;
  }
};
// createDepartment, updateDepartment, deleteDepartment are not needed for now.
