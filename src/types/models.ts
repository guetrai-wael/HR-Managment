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
