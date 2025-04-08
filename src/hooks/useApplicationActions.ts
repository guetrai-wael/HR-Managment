import { useState } from "react";
import { message } from "antd";
import { Application } from "../types";
import {
  submitApplication,
  updateApplicationStatus,
  deleteApplication,
  uploadResume,
} from "../services/api/applicationService";

/**
 * Hook for application-related operations with loading state and error handling
 */
export const useApplicationActions = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Submit a new job application
   */
  const handleSubmitApplication = async (
    applicationData: Partial<Application>,
    file?: File
  ): Promise<Application | null> => {
    setLoading(true);
    try {
      let resumeUrl = applicationData.resume_url;

      // Upload resume if file is provided
      if (file && applicationData.user_id) {
        resumeUrl = await uploadResume(applicationData.user_id, file);
      }

      // Add resume URL to application data
      const dataWithResume = {
        ...applicationData,
        resume_url: resumeUrl,
        status: applicationData.status || "pending",
        applied_at: applicationData.applied_at || new Date().toISOString(),
      };

      const newApplication = await submitApplication(dataWithResume);
      message.success("Application submitted successfully!");
      return newApplication;
    } catch (error: any) {
      message.error(
        `Failed to submit application: ${error.message || "Unknown error"}`
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update an application's status
   */
  const handleUpdateStatus = async (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ): Promise<Application | null> => {
    setLoading(true);
    try {
      const updatedApplication = await updateApplicationStatus(id, status);
      message.success(`Application status updated to ${status}`);
      return updatedApplication;
    } catch (error: any) {
      message.error(
        `Failed to update status: ${error.message || "Unknown error"}`
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete an application
   */
  const handleDeleteApplication = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      await deleteApplication(id);
      message.success("Application deleted successfully");
      return true;
    } catch (error: any) {
      message.error(
        `Failed to delete application: ${error.message || "Unknown error"}`
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmitApplication,
    handleUpdateStatus,
    handleDeleteApplication,
  };
};
