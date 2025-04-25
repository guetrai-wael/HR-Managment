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
import { Dayjs } from "dayjs";
import { Job } from "./models";
import { UploadFile } from "antd/es/upload/interface";

// Export all models
export * from "./models";

export interface IRouteItem {
  path: string;
  element: ReactNode;
  layout?: ({ children }: { children: ReactNode }) => ReactNode;
  guard?: ({ children }: { children: ReactNode }) => ReactNode;
}

/**
 * Props interface for the FormContainer component
 */
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

/**
 * Props for the InputField component
 * Generic type T extends FieldValues to ensure type safety with react-hook-form
 */
export interface InputFieldProps<T extends FieldValues> {
  name: Path<T>; // Field name (path) in the form values object
  label: string; // Label displayed above the input
  type: string; // Input type (text, email, password, etc.)
  placeholder: string; // Placeholder text
  control: Control<T>; // React Hook Form control object
  error?:
    | FieldError
    | Merge<FieldError, FieldErrorsImpl<Record<string, unknown>>>; // Error from form validation
  showError: boolean; // Whether to display error messages
}

/**
 * Auth form field configuration
 */
export interface AuthFormField {
  name: string;
  label: string;
  type: string;
  placeholder: string;
}

/**
 * Auth form values structure
 */
export interface AuthFormValues {
  email: string;
  password: string;
  name?: string;
  rememberMe: boolean;
  [key: string]: unknown; // To support dynamic fields
}

// TypeScript interface for the form values
export interface FormValues {
  email: string;
  password: string;
  name?: string;
  rememberMe: boolean;
}

/**
 * Props for the AuthForm component
 */
export interface AuthFormProps {
  onSubmit: (data: AuthFormValues) => void;
  schema: Yup.AnyObjectSchema;
  submitText: string;
  fields: AuthFormField[];
  showRememberMe?: boolean;
  onGoogleSuccess?: () => void;
  onGoogleError?: (error: Error) => void;
}

export interface ILoginData {
  name?: string;
  email: string;
  password: string;
}

export interface GoogleSignInButtonProps {
  label: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface HeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export interface JobCardProps {
  title: string;
  description: string;
  status?: string;
  deadline?: string | Date;
  icon?: "hot" | "star" | "featured";
  onClick?: () => void;
  onActionClick?: () => void;
  actionText?: string;
  // New action props
  onApplyClick?: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
  // Show/hide controls based on user role
  showApplyButton?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
}

interface TabItem {
  key: string;
  label: string;
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tabs: TabItem[];
  defaultActiveTab?: string;
  onTabChange?: (key: string) => void;
  actionButton?: {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
  };
}

export interface ApplicationFormProps {
  jobId: number;
  jobTitle: string;
  onSuccess: () => void;
  onCancel: () => void;
}
export interface ApplicationFormValues {
  coverLetter: string;
  resume?: UploadFile[]; // For Ant Design Upload component
}

export interface JobFormProps {
  jobId?: number;
  initialValues?: Partial<Job>; // Change from any to Partial<Job>
  onSuccess: () => void;
  onCancel: () => void;
}
export interface JobFormValues {
  title: string;
  description: string;
  requirements: string;
  responsibilities: string;
  department: string;
  location: string;
  status: string;
  salary?: string;
  deadline?: Dayjs; // For the form values (before conversion)
  posted_by?: string;
  id?: number; // For edit mode
}

/**
 * Custom error type for API errors
 */
export interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

/**
 * Type for error handler argument
 */
export type ErrorWithMessage = Error | { message: string } | string | unknown;

/**
 * department interface
 */ export interface Department {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}
