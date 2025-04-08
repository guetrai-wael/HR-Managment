/**
 * Core data models for the application
 */

/**
 * Job posting model representing a job in the system
 */
export interface Job {
  id: number;
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  status: string;
  deadline: string | null;
  location: string;
  salary: string | null;
  department: string;
  posted_at: string;
  posted_by: string;
}

/**
 * Application model representing a user's application to a job
 */
export interface Application {
  id: number;
  job_id: number;
  user_id: string;
  cover_letter: string;
  resume_url: string | null;
  status: "pending" | "accepted" | "rejected" | "interviewing";
  applied_at: string;
  job?: Job;
  profiles?: {
    full_name: string;
    email: string;
  };
}

/**
 * User profile model with user information
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: "admin" | "employee";
}

/**
 * Department model for job categorization
 */
export interface Department {
  id: number;
  name: string;
  description?: string;
}
