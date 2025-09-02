// Role types and constants for the HR Management System

export interface Role {
  id: number;
  name: string;
}

export interface UserRole {
  id: number;
  user_id: string;
  role_id: number;
  assigned_at: string;
}

// Role name constants - use these instead of hard-coded IDs
export const ROLE_NAMES = {
  ADMIN: "admin",
  EMPLOYEE: "employee",
  JOB_SEEKER: "job_seeker",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

// Role ID mapping (fallback for legacy code)
export const ROLE_IDS = {
  ADMIN: 1,
  EMPLOYEE: 2,
  JOB_SEEKER: 3,
} as const;

// Helper functions for role checking
export const isAdminRole = (roleName: string): boolean =>
  roleName === ROLE_NAMES.ADMIN;

export const isEmployeeRole = (roleName: string): boolean =>
  roleName === ROLE_NAMES.EMPLOYEE;

export const isJobSeekerRole = (roleName: string): boolean =>
  roleName === ROLE_NAMES.JOB_SEEKER;

// Get role name from role ID (for migration purposes)
export const getRoleNameFromId = (roleId: number): RoleName => {
  switch (roleId) {
    case ROLE_IDS.ADMIN:
      return ROLE_NAMES.ADMIN;
    case ROLE_IDS.EMPLOYEE:
      return ROLE_NAMES.EMPLOYEE;
    case ROLE_IDS.JOB_SEEKER:
      return ROLE_NAMES.JOB_SEEKER;
    default:
      return ROLE_NAMES.JOB_SEEKER; // Default fallback
  }
};

// Get role ID from role name (for database operations)
export const getRoleIdFromName = (roleName: RoleName): number => {
  switch (roleName) {
    case ROLE_NAMES.ADMIN:
      return ROLE_IDS.ADMIN;
    case ROLE_NAMES.EMPLOYEE:
      return ROLE_IDS.EMPLOYEE;
    case ROLE_NAMES.JOB_SEEKER:
      return ROLE_IDS.JOB_SEEKER;
    default:
      return ROLE_IDS.JOB_SEEKER; // Default fallback
  }
};

// Format role name for display (e.g., "job_seeker" → "Job Seeker")
export const formatRoleForDisplay = (roleName: RoleName | null): string => {
  if (!roleName) return "Job Seeker";
  return roleName.charAt(0).toUpperCase() + roleName.slice(1).replace("_", " ");
};
