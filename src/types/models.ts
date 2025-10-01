/**
 * ==========================================
 * Core Data Models for the Application
 * ==========================================
 * These interfaces define the shape of the main data entities
 * used throughout the application, mirroring the database structure.
 */

/**
 * Represents a department within the organization.
 * Used for categorizing jobs.
 */
export interface Department {
  /** The unique identifier for the department (Primary Key). */
  id: number;
  /** The name of the department (e.g., "Engineering", "Marketing"). */
  name: string;
  /** An optional description of the department's function or purpose. */
  description?: string | null;
}

/**
 * Represents a user's profile information.
 * Linked from various parts of the application (e.g., applications, job postings).
 */
export interface UserProfile {
  /** The unique identifier for the user (usually UUID from Supabase Auth). */
  id: string;
  /** The user's first name. */
  first_name: string | null;
  /** The user's last name. */
  last_name: string | null;
  /** The user's email address (used for login and communication). */
  email: string;
  /** URL pointing to the user's avatar image (optional). */
  avatar_url?: string | null;
  /** The user's phone number (optional). */
  phone?: string | null;

  // Fields for employee-specific data / extended profile information
  /** The user's job title or position (if an employee). */
  position?: string | null;
  /** The ID of the department this user belongs to (Foreign Key to departments table, if an employee). */
  department_id?: number | null;
  /** The date the user was hired (if an employee). */
  hiring_date?: string | null; // Store as ISO string (e.g., "YYYY-MM-DD")
  /** The user's physical address (if provided). */
  physical_address?: string | null;
  /** A short biography of the user (if provided). */
  bio?: string | null;
  /** The current employment status of the user (e.g., "Active", "Terminated", if an employee). */
  employment_status?: string | null;
}

/**
 * Represents a job posting in the system.
 */
export interface Job {
  /** The unique identifier for the job posting (Primary Key). */
  id: number;
  /** The title of the job position (e.g., "Software Engineer"). */
  title: string;
  /** A detailed description of the job role and company. */
  description: string;
  /** Specific skills, qualifications, or experience required for the job. */
  requirements: string;
  /** Key duties and tasks the employee will perform. */
  responsibilities: string;
  /** The current status of the job posting (e.g., "Open", "Closed", "Draft"). */
  status: "Open" | "Closed"; // Consider using a union type like 'Open' | 'Closed' | 'Draft' if statuses are fixed
  /** The application deadline date (ISO string format or null if no deadline). */
  deadline: string | null;
  /** The physical location or remote status of the job. */
  location: string;
  /** The salary or salary range for the position (optional). */
  salary: string | null;
  /** The date when the job was posted (ISO string format, optional). */
  posted_at?: string | null;
  /** The ID of the user (admin/recruiter) who posted the job (Foreign Key to UserProfile). */
  posted_by: string; // Assuming this links to UserProfile.id
  /** The ID of the department this job belongs to (Foreign Key to Department, optional). */
  department_id: number | null; // Make 'number' if required in DB
  /** The associated Department object (populated via joins/relations). */
  department?: Department | null; // Added to reflect joined data
}

/**
 * Represents a user's application submitted for a specific job.
 */
export interface Application {
  /** The unique identifier for the application (Primary Key). */
  id: number;
  /** The ID of the job this application is for (Foreign Key to Job). */
  job_id: number;
  /** The ID of the user who submitted the application (Foreign Key to UserProfile). */
  user_id: string;
  /** The cover letter text submitted by the user. */
  cover_letter: string;
  /** URL pointing to the user's uploaded resume file in storage (optional). */
  resume_url: string | null;
  /** The current stage or status of the application process. */
  status: "pending" | "accepted" | "rejected" | "interviewing";
  /** The date when the application was submitted (ISO string format). */
  applied_at: string;
  /** The associated Job object (populated via joins/relations). */
  job?: Job | null; // Optional, based on query
  /** The associated UserProfile object of the applicant (populated via joins/relations). */
  profile?: UserProfile | null; // Optional, based on query
}

/**
 * Represents the type of leave available in the organization.
 */
export interface LeaveType {
  /** The unique identifier for the leave type (Primary Key). */
  id: string;
  /** The name of the leave type (e.g., "Sick Leave", "Vacation"). */
  name: string;
  /** An optional description of the leave type. */
  description?: string | null;
  /** A color scheme for the leave type, used in the UI (e.g., a hex code or Tailwind color class). */
  color_scheme?: string | null;
  /** Indicates if this leave type requires approval (true/false). */
  requires_approval: boolean;
  // Future: max_days_per_year, accrual_rate, etc.
}

/**
 * Represents a leave request submitted by a user.
 */
export interface LeaveRequest {
  /** The unique identifier for the leave request (Primary Key). */
  id: string;
  /** The ID of the user who submitted the request (Foreign Key to UserProfile/AuthUser). */
  user_id: string;
  /** The ID of the leave type requested (Foreign Key to LeaveType). */
  leave_type_id: string;
  /** The start date of the leave (ISO 8601 date string). */
  start_date: string;
  /** The end date of the leave (ISO 8601 date string). */
  end_date: string;
  /** An optional reason for the leave request. */
  reason?: string | null;
  /** The current status of the leave request (e.g., "pending", "approved", "rejected", "cancelled"). */
  status: "pending" | "approved" | "rejected" | "cancelled"; // Updated to match DB enum and service layer
  /** The date and time when the request was created (ISO 8601 timestamp). */
  created_at: string;
  /** The date and time when the request was last updated (ISO 8601 timestamp). */
  updated_at: string;

  // Fields for admin actions - Corrected to match DB schema
  /** The ID of the admin who reviewed or actioned the request (if applicable). */
  approved_by?: string | null; // Corrected from admin_reviewer_id
  /** The date and time when the request was reviewed by admin (if applicable). */
  approved_at?: string | null; // Corrected from admin_reviewed_at
  /** The reason for rejection if the request was rejected by admin (if applicable). */
  comments?: string | null; // Corrected from admin_rejection_reason

  // Optional: For easier data handling in frontend, these can be populated via joins
  // user_profile?: UserProfile; // Assuming UserProfile is defined elsewhere
}

/**
 * Represents a leave request with additional fields for display purposes.
 */
export interface LeaveRequestDisplay extends LeaveRequest {
  /** The name of the employee who submitted the request (optional, for display). */
  employee_name?: string;
  /** The avatar URL of the employee (optional, for display). */
  employee_avatar_url?: string | null;
  /** The department of the employee (optional, for display). */
  employee_department?: string; // Or role, as in the image
  /** The name of the leave type (optional, for display). */
  leave_type_name?: string;
  /** The color scheme of the leave type (optional, for display). */
  leave_type_color_scheme?: string | null;
  /** The duration of the leave in days (calculated field, optional, for display). */
  duration_days?: number; // Calculated field
}

/**
 * Represents the leave balance for an employee.
 */
export interface LeaveBalance {
  /** The ID of the leave type (Foreign Key to LeaveType). */
  leave_type_id: string;
  /** The name of the leave type (for display purposes). */
  leave_type_name: string;
  /** The total accrued leave days. */
  total_accrued: number;
  /** The total leave days taken. */
  total_taken: number;
  /** The remaining leave balance. */
  remaining_balance: number;
  // unit: 'days' | 'hours';
}

/**
 * Recording types for employee presence tracking
 */

/**
 * Represents a recording entry in the system.
 */
export interface RecordingResult {
  /** The unique identifier for the recording (Primary Key). */
  id: string;
  /** The timestamp when the recording was created. */
  created_at: string;
  /** The name/path of the video file. */
  video_name: string;
  /** The size of the video file in bytes (nullable). */
  video_size?: number | null;
  /** The duration of the video in seconds (nullable). */
  video_duration?: number | null;
  /** The current status of the recording processing. */
  status: "processing" | "completed" | "failed";
}

/**
 * Extends RecordingResult with detailed analysis results.
 */
export interface RecordingDetails extends RecordingResult {
  /** The JSON containing employee presence data from the detection model. */
  results_json: EmployeePresence[];
}

/**
 * Represents an employee's presence data from video analysis.
 */
export interface EmployeePresence {
  /** The name of the employee detected. */
  name: string;
  /** The duration the employee was present (format: "Xsec"). */
  duration: string | number;
  /** The employee's email address. */
  email: string;
  /** The employee's phone number. */
  phone_number: string;
  /** The department the employee belongs to. */
  department: string;
  /** The employee's role in the organization. */
  role: string;
  /** Whether the employee was present or absent. */
  attendance: "Present" | "Absent";
  /** The employee ID from auth/database. */
  employee_id?: string;
  /** Time intervals when detected (optional). */
  intervals?: { in: number; out: number }[];
}

/**
 * Represents a person entry in results_json with intervals.
 * Used for employee-specific recordings view.
 */
export interface Person {
  /** The name of the person detected. */
  name: string | null;
  /** The person's role in the organization. */
  role: string | null;
  /** The person's email address. */
  email: string;
  /** The duration the person was present (in seconds). */
  duration: number;
  /** Time intervals when the person was detected. */
  intervals: { in: number; out: number }[];
  /** Whether the person was present or absent. */
  attendance: "Present" | "Absent" | string | null;
  /** The department the person belongs to. */
  department?: string | null;
  /** The employee ID from auth/database. */
  employee_id: string;
  /** The person's phone number. */
  phone_number?: string | null;
}

/**
 * Represents a recording from an employee's perspective.
 * Contains only the employee's own data extracted from results_json.
 */
export interface EmployeeRecording {
  /** The unique identifier for the recording. */
  id: string;
  /** The name of the video file. */
  video_name: string | null;
  /** The URL of the video file (if stored). */
  video_url: string | null;
  /** The duration of the video in seconds. */
  video_duration: number | null;
  /** The timestamp when the recording was created. */
  created_at: string | null;
  /** The employee's data extracted from results_json. */
  person: Person;
}
