import supabase from "../supabaseClient";
import { Department } from "../../types/models";
/**
 * Fetch all departments
 */
export const fetchDepartments = async (): Promise<Department[]> => {
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .order("name", { ascending: true });
  if (error) {
    console.error("Error fetching departments:", error); // Added console.error
    throw error;
  }
  return data || [];
};
/**
 * Get a specific department by ID
 */
export const getDepartmentById = async (
  id: string
): Promise<Department | null> => {
  if (!id) {
    return null;
  }
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    if (error.code === "PGRST116" && !data) {
      return null; // Not an error to throw, resource simply not found
    }
    console.error(`Error fetching department by ID ${id}:`, error); // Added console.error
    throw error;
  }
  return data;
};
// createDepartment, updateDepartment, deleteDepartment are not needed for now.
