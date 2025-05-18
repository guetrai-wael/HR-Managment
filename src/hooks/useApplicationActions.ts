import { useState } from "react";
import { message } from "antd";
import supabase from "../services/supabaseClient";
import {
  updateApplicationStatus,
  deleteApplication,
  createApplication,
} from "../services/api/applicationService";
import { Application } from "../types"; // Removed ApplicationStatus import
import { useErrorHandler } from "./useErrorHandler";
import { useUser } from "./useUser";

export const useApplicationActions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const { catchError, clearError, error: errorState } = useErrorHandler();

  // Function to handle creating a new application (potentially with file upload)
  const handleSubmitApplication = async (
    applicationData: Partial<Application>,
    resumeFile?: File // Optional file parameter
  ): Promise<boolean> => {
    if (!user) {
      catchError(
        new Error("User not logged in"),
        "You must be logged in to apply."
      ); // Use catchError
      return false;
    }

    setLoading(true);
    try {
      let resumeUrl: string | null = null;

      // --- File Upload Logic ---\
      // Upload resume if provided
      if (resumeFile) {
        // Create a unique file path, e.g., using user ID and timestamp
        const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
        // console.log(`Uploading resume to: ${filePath}`); // Debug log

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("resumes")
          .upload(filePath, resumeFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("resumes")
          .getPublicUrl(uploadData.path);

        // console.log(`Resume uploaded, URL: ${publicUrlData.publicUrl}`); // Debug log
        resumeUrl = publicUrlData.publicUrl;
      }
      // --- End File Upload Logic ---\

      // Add user_id and resume_url before creating the application record
      const finalData = {
        ...applicationData,
        user_id: user.id,
        resume_url: resumeUrl,
      }; // Ensure user_id is added

      try {
        setLoading(true);
        clearError();
        const newApplication = await createApplication(finalData);

        if (newApplication) {
          message.success("Application submitted successfully!");
          setLoading(false);
          return true;
        } else {
          // Error should have been handled by createApplication's handleError
          console.error("createApplication returned null or failed silently.");
          setLoading(false);
          return false;
        }
      } catch (error) {
        // Catch errors from file upload or other unexpected issues in this function
        console.error("Error in handleSubmitApplication:", error); // Detailed log
        catchError(
          error,
          "An unexpected error occurred while submitting the application."
        ); // Use catchError
        setLoading(false);
        return false;
      }
    } catch (error) {
      // Catch errors from file upload or other unexpected issues in this function
      console.error("Error in handleSubmitApplication:", error); // Detailed log
      catchError(
        error,
        "An unexpected error occurred while submitting the application."
      ); // Use catchError
      setLoading(false);
      return false;
    }
  };

  // Function to handle updating status
  const handleUpdateStatus = async (
    id: number,
    status: Application["status"]
  ) => {
    // Use Application['status']
    setLoading(true);
    clearError();
    try {
      const updated = await updateApplicationStatus(id, status);
      if (updated) {
        // console.log(
        //   `Application ${id} status updated successfully to ${status}.`
        // );
        message.success(`Application status updated to ${status}.`);
        return true; // Status update was successful
      }
      // If updated is false, error was handled in service
      return false; // Indicate failure
    } catch (error) {
      catchError(
        error,
        "An unexpected error occurred while updating application status."
      ); // Use catchError
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to handle deleting an application
  const handleDeleteApplication = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      const deleted = await deleteApplication(id);
      if (deleted) {
        message.success("Application deleted successfully");
        return true; // Indicate success
      }
      // If deleted is false, error was handled in service
      return false; // Indicate failure
    } catch (error) {
      catchError(error, "Failed to delete application."); // Use catchError
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error: errorState, // Expose error state from useErrorHandler
    clearError, // Expose clearError
    handleSubmitApplication, // Export the create handler
    handleUpdateStatus,
    handleDeleteApplication,
  };
};
