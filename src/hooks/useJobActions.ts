import { useState } from "react";
import { message } from "antd";
import { Job } from "../types";
import { createJob, updateJob, deleteJob } from "../services/api/jobService";

/**
 * Hook for job CRUD operations with loading state and error handling
 */
export const useJobActions = () => {
  const [loading, setLoading] = useState(false);

  const handleCreateJob = async (
    jobData: Partial<Job>
  ): Promise<Job | null> => {
    setLoading(true);
    try {
      const newJob = await createJob(jobData);
      message.success("Job posted successfully!");
      return newJob;
    } catch (error: any) {
      message.error(
        `Failed to create job: ${error.message || "Unknown error"}`
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async (
    id: number,
    jobData: Partial<Job>
  ): Promise<Job | null> => {
    setLoading(true);
    try {
      const updatedJob = await updateJob(id, jobData);
      message.success("Job updated successfully!");
      return updatedJob;
    } catch (error: any) {
      message.error(
        `Failed to update job: ${error.message || "Unknown error"}`
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (id: number): Promise<boolean> => {
    setLoading(true);
    try {
      await deleteJob(id);
      message.success("Job deleted successfully");
      return true;
    } catch (error: any) {
      message.error(
        `Failed to delete job: ${error.message || "Unknown error"}`
      );
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleCreateJob,
    handleUpdateJob,
    handleDeleteJob,
  };
};
