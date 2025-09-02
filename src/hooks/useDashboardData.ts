import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../services/api/dashboardService";

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

export const useDashboardStats = (isAdmin: boolean, isEmployee: boolean) => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard-stats", isAdmin, isEmployee],
    queryFn: () => dashboardService.getStats(isAdmin, isEmployee),
    refetchInterval: 60000, // Refresh every minute
  });
};

export const useDashboardActivities = (
  isAdmin: boolean,
  isEmployee: boolean
) => {
  return useQuery<DashboardActivity[]>({
    queryKey: ["dashboard-activities", isAdmin, isEmployee],
    queryFn: () => dashboardService.getActivities(isAdmin, isEmployee),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
