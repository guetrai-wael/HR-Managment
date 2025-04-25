import supabase from "../supabaseClient";
import { Department } from "../../types";
import { handleError } from "../../utils/errorHandler";

/**
 * Fetch all departments from the database
 */
export const fetchDepartments = async (): Promise<Department[]> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch departments" });
    return [];
  }
};

/**
 * Fetch a department by ID
 */
export const getDepartmentById = async (
  id: string
): Promise<Department | null> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, { userMessage: "Failed to fetch department" });
    return null;
  }
};

/**
 * Create a new department
 */
export const createDepartment = async (
  departmentData: Partial<Department>
): Promise<Department | null> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .insert([departmentData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, { userMessage: "Failed to create department" });
    return null;
  }
};

/**
 * Update an existing department
 */
export const updateDepartment = async (
  id: string,
  departmentData: Partial<Department>
): Promise<Department | null> => {
  try {
    const { data, error } = await supabase
      .from("departments")
      .update(departmentData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    handleError(error, { userMessage: "Failed to update department" });
    return null;
  }
};

/**
 * Delete a department
 */
export const deleteDepartment = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from("departments").delete().eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    handleError(error, { userMessage: "Failed to delete department" });
    return false;
  }
};
