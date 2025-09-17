// ==========================================
// Error Handling Types
// ==========================================

/** Custom structure for representing API-specific errors. */
export interface ApiError {
  message: string;
  status?: number; // HTTP status code, if available
  details?: unknown; // Any additional details from the API response
}

/** A flexible type for accepting various error formats in the error handler. */
export type ErrorWithMessage = Error | { message: string } | string | unknown;

// ==========================================
// Filtering Types
// ==========================================

/** Structure for values used in filtering lists (e.g., applications). */
export interface FilterValues {
  jobId?: number; // Filter by specific job
  departmentId?: number | "all"; // Filter by department (use 'all' or specific ID)
  status?: string; // Filter by application or job status
  dateRange?: [string | null, string | null]; // Filter by date range (using Dayjs for pickers)
  search?: string; // Generic search term
}
