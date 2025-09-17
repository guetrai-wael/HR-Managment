import { useQuery } from "@tanstack/react-query";

import { statisticsService, activityService } from "../services/api/analytics";

// Type definitions
export interface DashboardStats {
  // Admin stats
  registrationRequests?: number;
  leaveRequests?: number;
  jobApplications?: number;
  activeJobs?: number;

  // Employee stats (leave balances)
  vacationDays?: number;
  casualDays?: number;
  personalDays?: number;
  sickDays?: number;
}

export interface DashboardActivity {
  id: string | number;
  type: "leave_request" | "application" | "job" | "registration";
  title: string;
  description: string;
  created_at: string;
  status?: string;
  user_name?: string;
  user_id?: string;
}

/**
 * Hook for fetching dashboard statistics
 *
 * Retrieves dashboard stats like application counts, job counts, and leave balances
 * based on user role. Data refreshes automatically every minute.
 *
 * @param isAdmin - Whether the user has admin privileges
 * @param isEmployee - Whether the user has employee privileges
 * @returns Query result with dashboard statistics
 */
export const useDashboardStats = (isAdmin: boolean, isEmployee: boolean) => {
  const queryResult = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", isAdmin, isEmployee],
    queryFn: () => statisticsService.getStats(isAdmin, isEmployee),
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes instead of 1 minute
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
    enabled: isAdmin || isEmployee, // Only fetch if user has a valid role
  });

  return {
    // Backward compatibility - spread queryResult first
    ...queryResult,

    // Actions (none for this hook)
    actions: {},
  };
};

/**
 * Hook for fetching dashboard activity feed
 *
 * Retrieves recent activities like new applications, leave requests, etc.
 * Data refreshes automatically every 30 seconds.
 *
 * @param isAdmin - Whether the user has admin privileges
 * @param isEmployee - Whether the user has employee privileges
 * @returns Query result with dashboard activities
 */
export const useDashboardActivities = (
  isAdmin: boolean,
  isEmployee: boolean
) => {
  const queryResult = useQuery<DashboardActivity[]>({
    queryKey: ["dashboard-activities", isAdmin, isEmployee],
    queryFn: () => activityService.getActivities(isAdmin, isEmployee),
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes instead of 30 seconds
    staleTime: 60 * 1000, // Consider data fresh for 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    enabled: isAdmin || isEmployee, // Only fetch if user has a valid role
  });

  return {
    // Backward compatibility - spread queryResult first
    ...queryResult,

    // Actions (none for this hook)
    actions: {},
  };
};
