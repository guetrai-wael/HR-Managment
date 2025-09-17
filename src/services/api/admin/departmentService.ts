import supabase from "../../supabaseClient";
import type { Department } from "../../../types/models";

export const departmentService = {
  /**
   * Retrieves all departments ordered by name
   * @returns Promise that resolves to array of departments
   * @throws Error if database operation fails
   */
  async getAll(): Promise<Department[]> {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("[departmentService] getAll failed:", error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error("[departmentService] Unexpected error in getAll:", error);
      throw error;
    }
  },

  /**
   * Retrieves a specific department by ID
   * @param id The department ID to fetch
   * @returns Promise that resolves to department or null if not found
   * @throws Error if database operation fails
   */
  async getById(id: string): Promise<Department | null> {
    if (!id) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error(
          `[departmentService] getById failed for ID ${id}:`,
          error
        );
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error(`[departmentService] Unexpected error in getById:`, error);
      throw error;
    }
  },
};
