import { ReactNode } from "react";
import * as Yup from "yup";
import {
  Control,
  FieldError,
  Merge,
  FieldErrorsImpl,
  FieldValues,
  Path,
} from "react-hook-form";
import { Dayjs } from "dayjs"; // Type for Day.js objects used in date pickers
import { UploadFile } from "antd/es/upload/interface"; // Type for Ant Design Upload component files

// ==========================================
// Re-export Core Data Models
// ==========================================
// Makes models available via 'import { Job } from "src/types"' etc.
export * from "./models";
// Import Job model specifically for use within this file if needed after re-export
import { Job } from "./models";

// ==========================================
// Routing Types
// ==========================================

/** Defines the structure for a route configuration object. */
export interface IRouteItem {
  /** The URL path for the route. */
  path: string;
  /** The React component to render for this route. */
  element: ReactNode;
  /** An optional layout component to wrap the route's element. */
  layout?: ({ children }: { children: ReactNode }) => ReactNode;
  /** An optional guard component to protect the route (e.g., for authentication). */
  guard?: ({ children }: { children: ReactNode }) => ReactNode;
}

// ==========================================
// Component Prop Types
// ==========================================

/** Props for UI components displaying forms within a styled container. */
export interface FormContainerProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  actionLinkText: string;
  actionLinkLabel: string;
  actionLinkTo: string;
  backgroundImage?: string;
  infoHeading: string;
  infoText: string;
}

/** Props for a generic input field integrated with React Hook Form. */
export interface InputFieldProps<T extends FieldValues> {
  name: Path<T>; // Ensures 'name' is a valid key of the form values type T
  label: string;
  type: string;
  placeholder: string;
  control: Control<T>; // React Hook Form control object
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>>; // RHF error type
  showError: boolean; // Controls error message visibility
}

/** Configuration for a single field within an authentication form. */
export interface AuthFormField {
  name: string; // Should match a key in AuthFormValues
  label: string;
  type: string;
  placeholder: string;
}

/** Structure for values collected from authentication forms (Login/Signup). */
export interface AuthFormValues {
  email: string;
  password: string;
  name?: string; // Optional, e.g., for signup
  rememberMe: boolean;
  [key: string]: unknown; // Allows for potential extra fields
}

/** Props for the reusable authentication form component. */
export interface AuthFormProps {
  onSubmit: (data: AuthFormValues) => void; // Function to call on successful form submission
  schema: Yup.AnyObjectSchema; // Yup validation schema
  submitText: string; // Text for the submit button
  fields: AuthFormField[]; // Array defining the form fields
  showRememberMe?: boolean; // Whether to show the "Remember Me" checkbox
  onGoogleSuccess?: () => void; // Callback for successful Google Sign-In
  onGoogleError?: (error: Error) => void; // Callback for Google Sign-In error
}

/** Data structure specifically for login API calls. */
export interface ILoginData {
  name?: string; // Usually not needed for login
  email: string;
  password: string;
}

/** Props for the Google Sign-In button component. */
export interface GoogleSignInButtonProps {
  label: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/** Props for the main page header component. */
export interface HeaderProps {
  title: string | ReactNode; // Allow ReactNode for complex titles
  subtitle?: string;
  children?: React.ReactNode; // For potential extra content in the header
}

/** Props for the JobCard component displaying a job summary. */
export interface JobCardProps {
  title: string;
  description: string;
  status?: string; // Current status (e.g., "Open", "Closed")
  deadline?: string | Date | null; // Application deadline
  icon?: "hot" | "star" | "featured"; // Icon identifier for visual flair
  onClick?: () => void; // Action when the card itself is clicked
  onActionClick?: () => void; // Action for the primary "View Details" link/button
  actionText?: string; // Text for the primary action link/button
  onApplyClick?: () => void; // Action for the "Apply" button
  onEditClick?: () => void; // Action for the "Edit" button (Admin)
  onDeleteClick?: () => void; // Action for the "Delete" button (Admin)
  showApplyButton?: boolean; // Controls visibility of the Apply button
  showEditButton?: boolean; // Controls visibility of the Edit button
  showDeleteButton?: boolean; // Controls visibility of the Delete button
}

/** Structure for defining a tab item in components like SectionHeader. */
interface TabItem {
  key: string | number; // Key to identify the tab (can be string or department ID)
  label: string; // Text displayed on the tab
}

/** Props for the SectionHeader component used for titling sections, often with tabs or actions. */
export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tabs?: TabItem[]; // Optional array of tabs for filtering/navigation
  defaultActiveTab?: string | number; // Key of the initially active tab
  onTabChange?: (key: string | number) => void; // Callback when a tab is selected
  actionButton?: {
    // Optional action button (e.g., "Add Job")
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
  };
}

/** Props for the ApplicationForm component used to submit job applications. */
export interface ApplicationFormProps {
  jobId: number; // ID of the job being applied for
  jobTitle: string; // Title of the job (for display)
  onSuccess: () => void; // Callback on successful submission
  onCancel: () => void; // Callback when the form/modal is cancelled
}

/** Structure for values collected from the ApplicationForm. */
export interface ApplicationFormValues {
  coverLetter: string;
  resume?: UploadFile[]; // Ant Design Upload component expects an array
}

/** Props for the JobForm component used for creating or editing job postings. */
export interface JobFormProps {
  jobId?: number; // If provided, the form is in edit mode
  initialValues?: Partial<Job>; // Pre-fills form fields for editing
  onSuccess: () => void; // Callback on successful submission/update
  onCancel: () => void; // Callback when the form/modal is cancelled
}

/** Structure for values collected from the JobForm. */
export interface JobFormValues {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  department_id?: number; // Foreign key ID for the department
  // Removed 'department: string;' as it seemed unused and redundant with department_id
  location: string;
  status: string; // e.g., "Open", "Draft"
  salary?: string; // Optional salary information
  deadline?: Dayjs | null; // Use Dayjs for the form state, convert before sending to API
  posted_by?: string; // User ID of the poster (usually set automatically)
  id?: number; // Job ID, relevant only in edit mode
}

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
  dateRange?: [Dayjs | null, Dayjs | null]; // Filter by date range (using Dayjs for pickers)
  search?: string; // Generic search term
}
