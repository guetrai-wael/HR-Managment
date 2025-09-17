import supabase from "../../supabaseClient";
import type { UserProfile } from "../../../types/models";

/**
 * Service for searching and querying user profiles
 * Handles profile search operations across the application
 */
export const profileSearchService = {
  /**
   * Searches for user profiles by name or email
   * @param searchTerm Search term to match against first name, last name, or email
   * @param limit Maximum number of results to return (default: 10)
   * @returns Promise that resolves to array of matching user profiles
   * @throws Error if database operation fails
   */
  async searchProfiles(
    searchTerm: string,
    limit: number = 10
  ): Promise<UserProfile[]> {
    try {
      if (!searchTerm || searchTerm.trim().length === 0) {
        console.log("[profileSearchService] Empty search term provided");
        return [];
      }

      console.log(
        `[profileSearchService] Searching profiles for: "${searchTerm}"`
      );

      const cleanSearchTerm = searchTerm.trim();

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, position")
        .or(
          `first_name.ilike.%${cleanSearchTerm}%,last_name.ilike.%${cleanSearchTerm}%,email.ilike.%${cleanSearchTerm}%`
        )
        .limit(limit);

      if (error) {
        console.error("[profileSearchService] searchProfiles failed:", error);
        throw error;
      }

      const profiles = (data as UserProfile[]) || [];
      console.log(
        `[profileSearchService] Found ${profiles.length} matching profiles`
      );
      return profiles;
    } catch (error) {
      console.error(
        "[profileSearchService] Unexpected error in searchProfiles:",
        error
      );
      throw error;
    }
  },

  /**
   * Searches for profiles by specific criteria
   * @param criteria Search criteria object
   * @returns Promise that resolves to array of matching profiles
   * @throws Error if database operation fails
   */
  async searchByCriteria(criteria: {
    firstName?: string;
    lastName?: string;
    email?: string;
    position?: string;
    limit?: number;
  }): Promise<UserProfile[]> {
    try {
      console.log(
        "[profileSearchService] Searching profiles by criteria:",
        criteria
      );

      let query = supabase
        .from("profiles")
        .select("id, first_name, last_name, email, avatar_url, position");

      // Build dynamic query based on provided criteria
      const conditions: string[] = [];

      if (criteria.firstName) {
        conditions.push(`first_name.ilike.%${criteria.firstName}%`);
      }
      if (criteria.lastName) {
        conditions.push(`last_name.ilike.%${criteria.lastName}%`);
      }
      if (criteria.email) {
        conditions.push(`email.ilike.%${criteria.email}%`);
      }
      if (criteria.position) {
        conditions.push(`position.ilike.%${criteria.position}%`);
      }

      if (conditions.length > 0) {
        query = query.or(conditions.join(","));
      }

      if (criteria.limit) {
        query = query.limit(criteria.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[profileSearchService] searchByCriteria failed:", error);
        throw error;
      }

      const profiles = (data as UserProfile[]) || [];
      console.log(
        `[profileSearchService] Found ${profiles.length} profiles matching criteria`
      );
      return profiles;
    } catch (error) {
      console.error(
        "[profileSearchService] Unexpected error in searchByCriteria:",
        error
      );
      throw error;
    }
  },

  /**
   * Gets profile suggestions for autocomplete functionality
   * @param query Partial search query
   * @param maxSuggestions Maximum number of suggestions
   * @returns Promise that resolves to array of profile suggestions
   */
  async getProfileSuggestions(
    query: string,
    maxSuggestions: number = 5
  ): Promise<UserProfile[]> {
    try {
      if (!query || query.length < 2) {
        return []; // Require at least 2 characters for suggestions
      }

      console.log(
        `[profileSearchService] Getting profile suggestions for: "${query}"`
      );

      return await this.searchProfiles(query, maxSuggestions);
    } catch (error) {
      console.error(
        "[profileSearchService] Failed to get profile suggestions:",
        error
      );
      throw error;
    }
  },
};
