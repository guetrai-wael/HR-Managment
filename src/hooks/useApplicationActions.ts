import { useState } from "react";
import { message } from "antd";
import supabase from "../services/supabaseClient"; // Import supabase client for storage
// Correct the import name here
import {
  updateApplicationStatus,
  deleteApplication,
  createApplication, // Changed from submitApplication
} from "../services/api/applicationService";
import { Application } from "../types";
import { handleError } from "../utils/errorHandler";
import { useUser } from "./useUser"; // Assuming useUser is used

export const useApplicationActions = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useUser(); // Get user for create action

  // Function to handle creating a new application (potentially with file upload)
  const handleSubmitApplication = async (
    applicationData: Partial<Application>,
    resumeFile?: File // Optional file parameter
  ): Promise<boolean> => {
    if (!user) {
      handleError(new Error("User not logged in"), {
        userMessage: "You must be logged in to apply.",
      });
      return false;
    }

    setLoading(true);
    try {
      let resumeUrl: string | null = null;

      // --- File Upload Logic ---
      // Upload resume if provided
      if (resumeFile) {
        // Create a unique file path, e.g., using user ID and timestamp
        const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
        console.log(`Uploading resume to: ${filePath}`); // Debug log

        // Replace 'resumes' with your actual Supabase storage bucket name
        const { error: uploadError } = await supabase.storage
          .from("resumes") // <<<--- MAKE SURE 'resumes' IS YOUR BUCKET NAME
          .upload(filePath, resumeFile);

        if (uploadError) {
          console.error("Supabase storage upload error:", uploadError);
          throw new Error(`Failed to upload resume: ${uploadError.message}`);
        }

        // Get the public URL of the uploaded file
        const { data: urlData } = supabase.storage
          .from("resumes") // <<<--- MAKE SURE 'resumes' IS YOUR BUCKET NAME
          .getPublicUrl(filePath);

        resumeUrl = urlData?.publicUrl || null;
        console.log(`Resume uploaded, URL: ${resumeUrl}`); // Debug log
        if (!resumeUrl) {
          console.warn("Could not get public URL for uploaded resume.");
          // Decide if you want to proceed without a URL or throw an error
        }
      }
      // --- End File Upload Logic ---

      // Add user_id and resume_url before creating the application record
      const finalData: Partial<Application> = {
        ...applicationData,
        user_id: user.id, // Ensure user_id is set from the logged-in user
        resume_url: resumeUrl, // Set resume URL (will be null if no file was uploaded)
        status: "pending", // Explicitly set initial status
        applied_at: new Date().toISOString(), // Set application timestamp
      };

      console.log("Creating application record with data:", finalData); // Debug log

      // Call the correctly imported function
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
      handleError(error, {
        userMessage:
          "An unexpected error occurred while submitting the application.",
      });
      setLoading(false);
      return false;
    }
  };

  // Function to handle updating status
  const handleUpdateStatus = async (
    id: number,
    status: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const updated = await updateApplicationStatus(id, status);
      if (updated) {
        message.success(`Application status updated to ${status}`);
        return true; // Indicate success
      }
      // If updated is null, error was handled in service
      return false; // Indicate failure
    } catch (error) {
      // Catch unexpected errors in this function itself
      handleError(error, { userMessage: "Failed to update status." });
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
      // Catch unexpected errors in this function itself
      handleError(error, { userMessage: "Failed to delete application." });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmitApplication, // Export the create handler
    handleUpdateStatus,
    handleDeleteApplication,
  };
};
