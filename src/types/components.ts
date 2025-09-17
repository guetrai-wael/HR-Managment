import { ReactNode } from "react";
import { Dayjs } from "dayjs";
import { UploadFile } from "antd/es/upload/interface";
import { Job } from "./models";

// ==========================================
// UI Component Props
// ==========================================

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

// ==========================================
// Application & Job Form Types
// ==========================================

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
  location: string;
  status: string; // e.g., "Open", "Draft"
  salary?: string; // Optional salary information
  deadline?: Dayjs | null; // Use Dayjs for the form state, convert before sending to API
  posted_by?: string; // User ID of the poster (usually set automatically)
  id?: number; // Job ID, relevant only in edit mode
}