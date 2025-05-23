import { useQueryClient } from "@tanstack/react-query";
// import { message } from "antd"; // Keep for specific messages if needed
import { Job } from "../types";
import {
  createJob as apiCreateJob,
  updateJob as apiUpdateJob,
  deleteJob as apiDeleteJob,
} from "../services/api/jobService";
import { useMutationHandler } from "./useMutationHandler"; // Import the new hook

export const useJobActions = (departmentIdToFilter?: number | "all") => {
  const queryClient = useQueryClient();

  const getQueryKey = () => {
    return [
      "jobs",
      departmentIdToFilter !== "all" ? departmentIdToFilter : undefined,
    ];
  };

  // --- Create Job Mutation ---
  const { mutateAsync: createJob, isPending: isCreatingJob } =
    useMutationHandler<Job | null, Error, Partial<Job>>({
      mutationFn: apiCreateJob,
      queryClient,
      successMessage: "Job posted successfully!",
      errorMessagePrefix: "Failed to create job",
      invalidateQueries: [getQueryKey(), ["jobs"]],
    });

  // --- Update Job Mutation ---
  const { mutateAsync: updateJob, isPending: isUpdatingJob } =
    useMutationHandler<
      Job | null,
      Error,
      { id: number; jobData: Partial<Job> }
    >({
      mutationFn: ({ id, jobData }) => apiUpdateJob(id, jobData),
      queryClient,
      successMessage: "Job updated successfully!",
      errorMessagePrefix: "Failed to update job",
      onSuccess: (_data, variables) => {
        // Invalidate specific job query in addition to the list
        queryClient.invalidateQueries({ queryKey: ["job", variables.id] });
      },
      invalidateQueries: [getQueryKey(), ["jobs"]],
    });

  // --- Delete Job Mutation ---
  const { mutateAsync: deleteJob, isPending: isDeletingJob } =
    useMutationHandler<boolean, Error, number>({
      mutationFn: apiDeleteJob,
      queryClient,
      // Success message is often handled in the component for more context (e.g., job title)
      // successMessage: "Job deleted successfully",
      errorMessagePrefix: "Failed to delete job",
      onSuccess: (success, jobId) => {
        if (success) {
          // message.success(`Job deleted successfully.`); // Example of specific message if needed
          queryClient.invalidateQueries({ queryKey: ["job", jobId] });
        }
      },
      invalidateQueries: [getQueryKey(), ["jobs"]],
    });

  return {
    createJob,
    isCreatingJob,
    updateJob,
    isUpdatingJob,
    deleteJob,
    isDeletingJob,
    loading: isCreatingJob || isUpdatingJob || isDeletingJob,
  };
};
