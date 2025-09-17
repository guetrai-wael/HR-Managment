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

// ==========================================
// Authentication Form Types
// ==========================================

/** Props for a generic input field integrated with React Hook Form. */
export interface InputFieldProps<T extends FieldValues> {
  name: Path<T>; // Ensures 'name' is a valid key of the form values type T
  label: string;
  type: string;
  placeholder: string;
  control: Control<T>; // React Hook Form control object
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<T>>; // RHF error type, now using generic T
  showError: boolean; // Controls error message visibility
  disabled?: boolean; // Added disabled prop
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
  email: string;
  password?: string; // Password might be optional for Google Sign-In flows if handled differently
  name?: string; // Keep for now if AuthForm still uses it, but prefer firstName/lastName
  firstName?: string;
  lastName?: string;
  rememberMe?: boolean;
}

/** Props for the Google Sign-In button component. */
export interface GoogleSignInButtonProps {
  label: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  disabled?: boolean; // Added disabled prop
}

// ==========================================
// Form Container Types
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
