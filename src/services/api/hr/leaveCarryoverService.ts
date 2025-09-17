import supabase from "../../supabaseClient";
import { leaveBalanceService } from "./leaveBalanceService";

/**
 * Service for managing leave carryover operations
 * Handles automatic end-of-leave-year processing and manual carryover updates
 */

interface CarryoverResult {
  userId: string;
  previousBalance: number;
  carriedForward: number;
  newAnnualEntitlement: number;
  success: boolean;
  error?: string;
}

interface BulkCarryoverResult {
  processed: number;
  succeeded: number;
  failed: number;
  results: CarryoverResult[];
}

export const leaveCarryoverService = {
  /**
   * Process carryover for a single user
   * @param userId User ID to process carryover for
   * @returns Promise<CarryoverResult> Processing result
   */
  async processUserCarryover(userId: string): Promise<CarryoverResult> {
    const result: CarryoverResult = {
      userId,
      previousBalance: 0,
      carriedForward: 0,
      newAnnualEntitlement: 24,
      success: false,
    };

    try {
      console.log(
        `[leaveCarryoverService] Processing carryover for user: ${userId}`
      );

      // Get user's current balance details
      const balanceDetails = await leaveBalanceService.getDetailedBalance();
      result.previousBalance = balanceDetails.currentBalance;

      // Calculate carryover amount (max 48 days)
      const maxCarryover = 48;
      const carryoverAmount = Math.min(
        balanceDetails.currentBalance,
        maxCarryover
      );
      result.carriedForward = carryoverAmount;
      result.newAnnualEntitlement = 24 + carryoverAmount;

      // Update the user's carried_forward_days in profiles table
      const { error } = await supabase
        .from("profiles")
        .update({ carried_forward_days: carryoverAmount })
        .eq("id", userId);

      if (error) {
        console.error(
          `[leaveCarryoverService] Error updating carryover for ${userId}:`,
          error
        );
        result.error = error.message;
        return result;
      }

      result.success = true;
      console.log(
        `[leaveCarryoverService] Successfully processed carryover for ${userId}: ${carryoverAmount} days`
      );

      return result;
    } catch (error) {
      console.error(
        `[leaveCarryoverService] Unexpected error processing ${userId}:`,
        error
      );
      result.error = error instanceof Error ? error.message : "Unknown error";
      return result;
    }
  },

  /**
   * Process carryover for all employees
   * @returns Promise<BulkCarryoverResult> Bulk processing results
   */
  async processBulkCarryover(): Promise<BulkCarryoverResult> {
    const bulkResult: BulkCarryoverResult = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    };

    try {
      console.log("[leaveCarryoverService] Starting bulk carryover processing");

      // Get all active employees with hiring dates
      const { data: employees, error } = await supabase
        .from("profiles")
        .select("id, hiring_date, first_name, last_name")
        .eq("employment_status", "Active")
        .not("hiring_date", "is", null);

      if (error) {
        console.error(
          "[leaveCarryoverService] Error fetching employees:",
          error
        );
        throw error;
      }

      if (!employees || employees.length === 0) {
        console.log("[leaveCarryoverService] No active employees found");
        return bulkResult;
      }

      console.log(
        `[leaveCarryoverService] Processing ${employees.length} employees`
      );

      // Process each employee
      for (const employee of employees) {
        bulkResult.processed++;

        const result = await this.processUserCarryover(employee.id);
        bulkResult.results.push(result);

        if (result.success) {
          bulkResult.succeeded++;
        } else {
          bulkResult.failed++;
        }
      }

      console.log(
        `[leaveCarryoverService] Bulk processing completed: ${bulkResult.succeeded}/${bulkResult.processed} succeeded`
      );

      return bulkResult;
    } catch (error) {
      console.error(
        "[leaveCarryoverService] Error in bulk carryover processing:",
        error
      );
      throw error;
    }
  },

  /**
   * Check if carryover processing is needed for employees with upcoming anniversaries
   * @param daysAhead Number of days ahead to check for anniversaries (default: 7)
   * @returns Promise<string[]> Array of user IDs needing carryover processing
   */
  async getEmployeesNeedingCarryover(daysAhead: number = 7): Promise<string[]> {
    try {
      console.log(
        `[leaveCarryoverService] Checking for employees needing carryover in next ${daysAhead} days`
      );

      // Get all active employees with hiring dates
      const { data: employees, error } = await supabase
        .from("profiles")
        .select("id, hiring_date")
        .eq("employment_status", "Active")
        .not("hiring_date", "is", null);

      if (error) {
        console.error(
          "[leaveCarryoverService] Error fetching employees:",
          error
        );
        throw error;
      }

      if (!employees || employees.length === 0) {
        return [];
      }

      const today = new Date();
      const checkUntil = new Date();
      checkUntil.setDate(today.getDate() + daysAhead);

      const employeesNeedingCarryover: string[] = [];

      employees.forEach((employee) => {
        const hiringDate = new Date(employee.hiring_date);
        const currentYear = today.getFullYear();

        // Calculate next anniversary date
        const nextAnniversary = new Date(
          currentYear,
          hiringDate.getMonth(),
          hiringDate.getDate()
        );

        // If anniversary has passed this year, check next year
        if (nextAnniversary < today) {
          nextAnniversary.setFullYear(currentYear + 1);
        }

        // Check if anniversary falls within the check period
        if (nextAnniversary >= today && nextAnniversary <= checkUntil) {
          employeesNeedingCarryover.push(employee.id);
        }
      });

      console.log(
        `[leaveCarryoverService] Found ${employeesNeedingCarryover.length} employees needing carryover`
      );

      return employeesNeedingCarryover;
    } catch (error) {
      console.error(
        "[leaveCarryoverService] Error checking for carryover needs:",
        error
      );
      throw error;
    }
  },

  /**
   * Manually set carryover days for a user (admin function)
   * @param userId User ID
   * @param carriedDays Number of days to carry forward (max 48)
   * @returns Promise<boolean> Success status
   */
  async setManualCarryover(
    userId: string,
    carriedDays: number
  ): Promise<boolean> {
    try {
      console.log(
        `[leaveCarryoverService] Setting manual carryover for ${userId}: ${carriedDays} days`
      );

      // Validate carryover amount
      const maxCarryover = 48;
      const validCarryover = Math.max(0, Math.min(carriedDays, maxCarryover));

      if (validCarryover !== carriedDays) {
        console.warn(
          `[leaveCarryoverService] Carryover adjusted from ${carriedDays} to ${validCarryover} (max: ${maxCarryover})`
        );
      }

      // Update the user's carried_forward_days
      const { error } = await supabase
        .from("profiles")
        .update({ carried_forward_days: validCarryover })
        .eq("id", userId);

      if (error) {
        console.error(
          `[leaveCarryoverService] Error setting manual carryover:`,
          error
        );
        throw error;
      }

      console.log(
        `[leaveCarryoverService] Successfully set manual carryover: ${validCarryover} days`
      );
      return true;
    } catch (error) {
      console.error(
        "[leaveCarryoverService] Error in manual carryover:",
        error
      );
      throw error;
    }
  },

  /**
   * Get carryover history/status for all employees (admin view)
   * @returns Promise<Array> Employee carryover information
   */
  async getCarryoverStatus(): Promise<
    Array<{
      userId: string;
      name: string;
      hiringDate: string;
      carriedForward: number;
      currentBalance: number;
      nextAnniversary: string;
    }>
  > {
    try {
      console.log(
        "[leaveCarryoverService] Fetching carryover status for all employees"
      );

      // Get all active employees with their profile information
      const { data: employees, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, hiring_date, carried_forward_days")
        .eq("employment_status", "Active")
        .not("hiring_date", "is", null);

      if (error) {
        console.error(
          "[leaveCarryoverService] Error fetching employee profiles:",
          error
        );
        throw error;
      }

      if (!employees || employees.length === 0) {
        return [];
      }

      const carryoverStatus = employees.map((employee) => {
        const hiringDate = new Date(employee.hiring_date);
        const today = new Date();
        const currentYear = today.getFullYear();

        // Calculate next anniversary
        const nextAnniversary = new Date(
          currentYear,
          hiringDate.getMonth(),
          hiringDate.getDate()
        );

        if (nextAnniversary <= today) {
          nextAnniversary.setFullYear(currentYear + 1);
        }

        return {
          userId: employee.id,
          name:
            `${employee.first_name || ""} ${employee.last_name || ""}`.trim() ||
            "Unknown",
          hiringDate: employee.hiring_date,
          carriedForward: employee.carried_forward_days || 0,
          currentBalance: 0, // Would need to calculate this separately
          nextAnniversary: nextAnniversary.toISOString().split("T")[0],
        };
      });

      console.log(
        `[leaveCarryoverService] Retrieved status for ${carryoverStatus.length} employees`
      );
      return carryoverStatus;
    } catch (error) {
      console.error(
        "[leaveCarryoverService] Error getting carryover status:",
        error
      );
      throw error;
    }
  },
};
