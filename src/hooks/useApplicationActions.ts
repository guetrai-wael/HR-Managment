import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd"; // Keep for specific messages if needed, though useMutationHandler handles generic ones
import supabase from "../services/supabaseClient";
import {
  updateApplicationStatus as apiUpdateApplicationStatus,
  deleteApplication as apiDeleteApplication,
  createApplication as apiCreateApplication,
} from "../services/api/applicationService";
import { Application, FilterValues } from "../types";
import { useUser } from "./useUser";
import { useMutationHandler } from "./useMutationHandler"; // Import the new hook

// Define interfaces for mutation arguments
interface SubmitApplicationArgs {
  applicationData: Partial<Application>;
  resumeFile?: File; // Use built-in File type
}

interface UpdateStatusArgs {
  id: number;
  status: Application["status"];
}

export const useApplicationActions = (filters?: FilterValues) => {
  const queryClient = useQueryClient();
  const { user } = useUser();

  const getApplicationsQueryKey = () => {
    return ["applications", filters || {}];
  };

  // --- Submit Application Mutation (Create with File Upload) ---
  const { mutateAsync: submitApplication, isPending: isSubmitting } =
    useMutationHandler<boolean, Error, SubmitApplicationArgs>({
      mutationFn: async ({ applicationData, resumeFile }) => {
        if (!user) {
          throw new Error(
            "User not logged in. You must be logged in to apply."
          );
        }
        let resumeUrl: string | null = null;
        if (resumeFile) {
          const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("resumes").upload(filePath, resumeFile);
          if (uploadError) throw uploadError;
          const { data: publicUrlData } = supabase.storage
            .from("resumes")
            .getPublicUrl(uploadData.path);
          resumeUrl = publicUrlData.publicUrl;
        }
        const finalData = {
          ...applicationData,
          user_id: user.id,
          resume_url: resumeUrl,
        };
        const newApplication = await apiCreateApplication(finalData);
        if (!newApplication) {
          throw new Error("Application submission failed at the API level.");
        }
        return true; // Indicate success
      },
      queryClient,
      successMessage: "Application submitted successfully!",
      errorMessagePrefix: "Application submission failed",
      invalidateQueries: [getApplicationsQueryKey(), ["jobApplications"]],
    });

  // --- Update Application Status Mutation ---
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useMutationHandler<Application | null, Error, UpdateStatusArgs>({
      mutationFn: ({ id, status }) => apiUpdateApplicationStatus(id, status),
      queryClient,
      // Custom success message to include the status
      onSuccess: (data, variables) => {
        if (data) {
          message.success(`Application status updated to ${variables.status}.`);
        }
      },
      errorMessagePrefix: "Failed to update application status",
      invalidateQueries: [getApplicationsQueryKey(), ["application"]], // Will be ["application", id] effectively due to how invalidateQueries works with array elements
      // To be more precise for individual item invalidation, one might need to pass a function or handle it in onSuccess
      // For now, this will invalidate all queries starting with ["application"].
      // A more targeted invalidation would be: queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
      // This can be done in the onSuccess callback if needed, after the generic one.
    });

  // --- Delete Application Mutation ---
  const { mutateAsync: deleteApplicationAction, isPending: isDeleting } =
    useMutationHandler<boolean, Error, number>({
      mutationFn: apiDeleteApplication,
      queryClient,
      successMessage: "Application deleted successfully",
      errorMessagePrefix: "Failed to delete application",
      invalidateQueries: [getApplicationsQueryKey()],
    });

  return {
    submitApplication,
    isSubmitting,
    updateStatus,
    isUpdatingStatus,
    deleteApplicationAction,
    isDeleting,
    loading: isSubmitting || isUpdatingStatus || isDeleting,
  };
};
