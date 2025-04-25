import { useState } from "react";
import { message } from "antd";
import { Application } from "../types";
import {
  submitApplication,
  updateApplicationStatus,
  deleteApplication,
  uploadResume,
  fetchApplications,
} from "../services/api/applicationService";
import { handleError } from "../utils/errorHandler";

/**
 * Hook for application-related operations with loading state and error handling
 */
export const useApplicationActions = (): {
  loading: boolean;
  submitting: boolean;
  getApplications: (filters?: {
    userId?: string;
    jobId?: number;
    departmentId?: string;
    status?: string;
    dateRange?: [string, string];
    search?: string;
  }) => Promise<Application[]>;
  handleSubmitApplication: (
    applicationData: Partial<Application>,
    file?: File
  ) => Promise<Application | null>;
  handleUpdateStatus: (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => Promise<Application | null>;
  handleDeleteApplication: (id: number) => Promise<boolean>;
} => {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch applications with filters
   */
  const getApplications = async (filters?: {
    userId?: string;
    jobId?: number;
    departmentId?: string;
    status?: string;
    dateRange?: [string, string];
    search?: string;
  }): Promise<Application[]> => {
    setLoading(true);
    try {
      const applications = await fetchApplications(filters);
      return applications;
    } catch (error: unknown) {
      // Replace any with unknown
      handleError(error, {
        userMessage: "Failed to fetch applications",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit a new job application
   */
  const handleSubmitApplication = async (
    applicationData: Partial<Application>,
    file?: File
  ): Promise<Application | null> => {
    setSubmitting(true);
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
    } catch (error: unknown) {
      handleError(error, {
        userMessage: "Failed to submit application",
      });
      return null;
    } finally {
      setSubmitting(false);
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
    } catch (error: unknown) {
      handleError(error, {
        userMessage: `Failed to update status`,
      });
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
    } catch (error: unknown) {
      handleError(error, {
        userMessage: "Failed to delete application",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    submitting,
    getApplications,
    handleSubmitApplication,
    handleUpdateStatus,
    handleDeleteApplication,
  };
};
