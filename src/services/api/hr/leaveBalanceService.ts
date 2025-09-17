import supabase from "../../supabaseClient";
import { getCurrentUserId } from "./leaveUtils";

/**
 * Service for managing user leave balances using anniversary-based system
 * Each employee gets 24 days per year + carryover from previous year (max 72 total)
 * Leave years run from hiring anniversary to hiring anniversary
 */

interface LeaveYear {
  start: Date;
  end: Date;
}

interface LeaveBalanceDetails {
  currentBalance: number;
  annualEntitlement: number;
  usedThisYear: number;
  carriedForward: number;
  leaveYearStart: Date;
  leaveYearEnd: Date;
}

interface LifetimeStatistics {
  vacation: number;
  sick: number;
  personal: number;
  casual: number;
  total: number;
}

export const leaveBalanceService = {
  /**
   * Gets the current leave year boundaries based on hiring anniversary
   * @param hiringDate The employee's hiring date
   * @returns LeaveYear object with start and end dates
   */
  getCurrentLeaveYear(hiringDate: Date): LeaveYear {
    const today = new Date();
    const currentYear = today.getFullYear();

    // Create anniversary date for current calendar year
    const currentYearAnniversary = new Date(
      currentYear,
      hiringDate.getMonth(),
      hiringDate.getDate()
    );

    if (today < currentYearAnniversary) {
      // Before anniversary this year, so still in previous leave year
      return {
        start: new Date(
          currentYear - 1,
          hiringDate.getMonth(),
          hiringDate.getDate()
        ),
        end: new Date(currentYearAnniversary.getTime() - 86400000), // Day before anniversary
      };
    } else {
      // After anniversary, in current leave year
      return {
        start: currentYearAnniversary,
        end: new Date(
          currentYear + 1,
          hiringDate.getMonth(),
          hiringDate.getDate() - 1
        ),
      };
    }
  },

  /**
   * Calculates days used in a specific leave year
   * @param userId User ID
   * @param leaveYear Leave year boundaries
   * @returns Promise<number> Days used in this leave year
   */
  async getDaysUsedInLeaveYear(
    userId: string,
    leaveYear: LeaveYear
  ): Promise<number> {
    const { data: approvedLeaves, error } = await supabase
      .from("leave_requests")
      .select("start_date, end_date")
      .eq("user_id", userId)
      .eq("status", "approved")
      .gte("start_date", leaveYear.start.toISOString().split("T")[0])
      .lte("start_date", leaveYear.end.toISOString().split("T")[0]);

    if (error) {
      console.error(
        "[leaveBalanceService] Error fetching leave requests:",
        error
      );
      throw error;
    }

    let totalDays = 0;
    if (approvedLeaves) {
      approvedLeaves.forEach((leave) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const days =
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
          ) + 1;
        totalDays += days;
      });
    }

    return totalDays;
  },

  /**
   * Gets lifetime statistics by leave type (since hiring)
   * @param userId User ID
   * @returns Promise<LifetimeStatistics> Total days used by category
   */
  async getLifetimeStatistics(userId: string): Promise<LifetimeStatistics> {
    // Get leave types with their names
    const { data: leaveTypes } = await supabase
      .from("leave_types")
      .select("id, name");

    // Get all approved leaves
    const { data: approvedLeaves, error } = await supabase
      .from("leave_requests")
      .select("start_date, end_date, leave_type_id")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (error) {
      console.error(
        "[leaveBalanceService] Error fetching lifetime statistics:",
        error
      );
      throw error;
    }

    const stats: LifetimeStatistics = {
      vacation: 0,
      sick: 0,
      personal: 0,
      casual: 0,
      total: 0,
    };

    if (approvedLeaves && leaveTypes) {
      approvedLeaves.forEach((leave) => {
        const startDate = new Date(leave.start_date);
        const endDate = new Date(leave.end_date);
        const days =
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)
          ) + 1;

        // Find leave type name
        const leaveType = leaveTypes.find(
          (type) => type.id === leave.leave_type_id
        );
        const typeName = leaveType?.name?.toLowerCase();

        // Categorize by leave type
        if (typeName?.includes("vacation")) {
          stats.vacation += days;
        } else if (typeName?.includes("sick")) {
          stats.sick += days;
        } else if (typeName?.includes("personal")) {
          stats.personal += days;
        } else if (typeName?.includes("casual")) {
          stats.casual += days;
        }

        stats.total += days;
      });
    }

    return stats;
  },

  /**
   * Gets detailed leave balance information for current user
   * @returns Promise<LeaveBalanceDetails> Comprehensive balance details
   */
  async getDetailedBalance(): Promise<LeaveBalanceDetails> {
    const userId = await getCurrentUserId();
    if (!userId) {
      throw new Error("User not authenticated to fetch leave balance.");
    }

    // Get user profile with hiring date and carried forward days
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("hiring_date, carried_forward_days")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.hiring_date) {
      console.error(
        "[leaveBalanceService] Error fetching profile:",
        profileError
      );
      throw new Error(
        "Unable to determine hiring date for balance calculation"
      );
    }

    const hiringDate = new Date(profile.hiring_date);
    const carriedForward = profile.carried_forward_days || 0;
    const currentLeaveYear =
      leaveBalanceService.getCurrentLeaveYear(hiringDate);

    // Calculate annual entitlement: 24 base + carryover (max 72 total)
    const baseEntitlement = 24;
    const maxCarryover = 48; // Ensures max 72 total
    const effectiveCarryover = Math.min(carriedForward, maxCarryover);
    const annualEntitlement = baseEntitlement + effectiveCarryover;

    // Get days used in current leave year
    const usedThisYear = await leaveBalanceService.getDaysUsedInLeaveYear(
      userId,
      currentLeaveYear
    );

    // Calculate remaining balance
    const currentBalance = Math.max(0, annualEntitlement - usedThisYear);

    console.log(
      `[leaveBalanceService] Anniversary calculation for user ${userId}:`,
      {
        leaveYear: `${currentLeaveYear.start.toISOString().split("T")[0]} to ${
          currentLeaveYear.end.toISOString().split("T")[0]
        }`,
        baseEntitlement,
        carriedForward: effectiveCarryover,
        annualEntitlement,
        usedThisYear,
        currentBalance,
      }
    );

    return {
      currentBalance,
      annualEntitlement,
      usedThisYear,
      carriedForward: effectiveCarryover,
      leaveYearStart: currentLeaveYear.start,
      leaveYearEnd: currentLeaveYear.end,
    };
  },

  /**
   * Gets the current authenticated user's leave balance (simple interface)
   * @returns Promise<number> The user's available leave days
   */
  async getMyLeaveBalance(): Promise<number> {
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        throw new Error("User not authenticated to fetch leave balance.");
      }

      // Get user profile with hiring date and carried forward days
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("hiring_date, carried_forward_days")
        .eq("id", userId)
        .single();

      if (profileError || !profile?.hiring_date) {
        console.error(
          "[leaveBalanceService] Error fetching profile:",
          profileError
        );
        throw new Error(
          "Unable to determine hiring date for balance calculation"
        );
      }

      const hiringDate = new Date(profile.hiring_date);
      const carriedForward = profile.carried_forward_days || 0;
      const currentLeaveYear =
        leaveBalanceService.getCurrentLeaveYear(hiringDate);

      // Calculate annual entitlement: 24 base + carryover (max 72 total)
      const baseEntitlement = 24;
      const maxCarryover = 48; // Ensures max 72 total
      const effectiveCarryover = Math.min(carriedForward, maxCarryover);
      const annualEntitlement = baseEntitlement + effectiveCarryover;

      // Get days used in current leave year
      const usedThisYear = await leaveBalanceService.getDaysUsedInLeaveYear(
        userId,
        currentLeaveYear
      );

      // Calculate remaining balance
      const currentBalance = Math.max(0, annualEntitlement - usedThisYear);

      return currentBalance;
    } catch (error) {
      console.error(
        "[leaveBalanceService] Failed to fetch leave balance:",
        error
      );
      throw error;
    }
  },

  /**
   * Processes end-of-leave-year carryover for a user
   * @param userId User ID
   * @returns Promise<void>
   */
  async processYearEndCarryover(userId: string): Promise<void> {
    try {
      const details = await leaveBalanceService.getDetailedBalance();
      const unusedDays = details.currentBalance;

      // Apply maximum carryover limit (48 days)
      const carryoverDays = Math.min(unusedDays, 48);

      // Update user's carried forward days
      const { error } = await supabase
        .from("profiles")
        .update({ carried_forward_days: carryoverDays })
        .eq("id", userId);

      if (error) {
        console.error("[leaveBalanceService] Error updating carryover:", error);
        throw error;
      }

      console.log(
        `[leaveBalanceService] Processed carryover for user ${userId}: ${carryoverDays} days`
      );
    } catch (error) {
      console.error(
        "[leaveBalanceService] Failed to process carryover:",
        error
      );
      throw error;
    }
  },
};
