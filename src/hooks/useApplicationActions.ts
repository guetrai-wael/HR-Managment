import { useQueryClient } from "@tanstack/react-query";
import { message } from "antd";

import { Application, FilterValues } from "../types";
import {
  applicationCrudService,
  applicationWorkflowService,
} from "../services/api/recruitment";
import supabase from "../services/supabaseClient";
import { useUser } from "./useUser";
import { useMutationHandler } from "./useMutationHandler";

// Type definitions for mutation arguments
interface SubmitApplicationArgs {
  applicationData: Partial<Application>;
  resumeFile?: File;
}

interface UpdateStatusArgs {
  id: number;
  status: Application["status"];
}

/**
 * Hook for managing job application actions and mutations
 *
 * Provides CRUD operations for job applications including submission,
 * status updates, and deletion. Integrates with TanStack Query for
 * optimistic updates and cache management.
 *
 * @param filters - Optional filters to determine which query keys to invalidate
 * @returns Object containing application actions and loading states
 *
 * @example
 * ```typescript
 * const { actions, isLoading } = useApplicationActions(currentFilters);
 *
 * // Submit new application
 * await actions.submitApplication({
 *   applicationData: { job_id: 1, cover_letter: 'Hello...' },
 *   resumeFile: selectedFile
 * });
 *
 * // Update application status
 * await actions.updateStatus({ id: 1, status: 'accepted' });
 * ```
 */
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
          console.log("[submitApplication] Starting resume upload...");
          console.log("[submitApplication] File details:", {
            name: resumeFile.name,
            size: resumeFile.size,
            type: resumeFile.type,
          });

          const filePath = `${user.id}/${Date.now()}_${resumeFile.name}`;
          console.log("[submitApplication] Upload path:", filePath);

          const { data: uploadData, error: uploadError } =
            await supabase.storage.from("resumes").upload(filePath, resumeFile);

          if (uploadError) {
            console.error("[submitApplication] Upload error:", uploadError);
            throw new Error(`Resume upload failed: ${uploadError.message}`);
          }

          console.log("[submitApplication] Upload successful:", uploadData);

          const { data: publicUrlData } = supabase.storage
            .from("resumes")
            .getPublicUrl(uploadData.path);

          resumeUrl = publicUrlData.publicUrl;
          console.log("[submitApplication] Resume URL:", resumeUrl);
        } else {
          console.log("[submitApplication] No resume file provided");
        }
        const finalData = {
          ...applicationData,
          user_id: user.id,
          resume_url: resumeUrl,
        };

        console.log("[submitApplication] Final application data:", finalData);
        const newApplication = await applicationCrudService.create(finalData);
        console.log("[submitApplication] Created application:", newApplication);
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
      mutationFn: ({ id, status }) => {
        // Use approve method for acceptance to handle role conversion and hiring date
        if (status === "accepted") {
          return applicationWorkflowService.approve(id);
        }
        // Use regular updateStatus for other status changes
        return applicationWorkflowService.updateStatus(id, status);
      },
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
    useMutationHandler<void, Error, number>({
      mutationFn: applicationCrudService.delete,
      queryClient,
      successMessage: "Application deleted successfully",
      errorMessagePrefix: "Failed to delete application",
      invalidateQueries: [getApplicationsQueryKey()],
    });

  const isLoading = isSubmitting || isUpdatingStatus || isDeleting;

  return {
    // Data (no persistent data for action hooks)
    data: null,

    // Loading states
    isLoading,
    isError: false, // Individual mutations handle their own errors
    error: null,

    // Actions
    actions: {
      submitApplication,
      updateStatus,
      deleteApplication: deleteApplicationAction,
    },
  };
};
