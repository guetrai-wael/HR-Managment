import React, { useState, useEffect, useRef, useCallback } from "react";
import { message, Alert, Spin } from "antd";
import { Header } from "../../components/common";
import {
  ApplicationsTable,
  ApplicationDetailsModal,
  ApplicationFilters,
} from "../../components/Applications";
import { Application, FilterValues } from "../../types";
import { useUser, useRole, useApplicationActions } from "../../hooks";
import { fetchApplications } from "../../services/api/applicationService";
import { useErrorHandler } from "../../hooks/useErrorHandler";

const Applications: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();
  // Get the specific update handler from the hook
  const { handleUpdateStatus: updateStatusAction } = useApplicationActions();
  const { catchError, error: errorState, clearError } = useErrorHandler();
  // State variables
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  // Add fetchId ref to track latest request
  const fetchId = useRef(0);
  const loadApplications = useCallback(async () => {
    if (!user || roleLoading) return;
    const currentFetch = ++fetchId.current;
    setLoading(true);
    clearError();
    try {
      console.log(
        `Loading applications for user: ${user.id}, isAdmin: ${isAdmin}`
      );
      // Try with timeout protection
      try {
        const data = await Promise.race([
          fetchApplications(filters, isAdmin, user.id),
          new Promise<Application[]>((_, reject) =>
            setTimeout(() => reject(new Error("Request timed out")), 15000)
          ),
        ]);

        // Only update if this is still the most recent fetch
        if (fetchId.current === currentFetch) {
          console.log("Applications loaded:", data?.length || 0);
          setApplications(data || []);
        }
      } catch (error) {
        // Only handle errors if this is still the most recent fetch
        if (fetchId.current === currentFetch) {
          catchError(
            error,
            "Error with primary fetch method, trying fallback..."
          );

          // --- Fallback Logic---
          const supabase = (await import("../../services/supabaseClient"))
            .default;
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("applications")
            .select("*")
            .eq("user_id", user.id)
            .order("applied_at", { ascending: false });

          if (fallbackError) throw fallbackError;

          console.log("Fallback fetch succeeded:", fallbackData?.length);
          setApplications(fallbackData || []);
          // --- End Fallback Logic ---
        }
      }
    } catch (error: unknown) {
      // Only update error state if this is still the most recent fetch
      if (fetchId.current === currentFetch) {
        catchError(error, "Failed to load applications");
        setApplications([]);
      }
    } finally {
      // Only reset loading state if this is still the most recent fetch
      if (fetchId.current === currentFetch) {
        setLoading(false);
      }
    }
  }, [user, isAdmin, filters, roleLoading, catchError, clearError]);

  useEffect(() => {
    if (user && !roleLoading) {
      loadApplications();
    } else if (!user) {
      setApplications([]);
      setLoading(false);
    }
    return () => {
      fetchId.current = -1;
    };
  }, [user, roleLoading, loadApplications]);
  // Filter change handler
  const handleFilterChange = (newFilters: FilterValues) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
  };
  // View details handler
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsModalVisible(true);
  };
  // View resume handler
  const handleViewResume = (url: string) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      message.info("No resume available for this application.");
    }
  };
  // View profile handler (placeholder)
  const handleViewProfile = (userId: string) => {
    // TODO: Implement navigation or modal display for user profile
    console.log("Navigate to or show profile for user:", userId);
    message.info("Profile view not yet implemented.");
  };
  // Status update handler using the specific action from the hook
  const handleStatusUpdate = async (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => {
    const success = await updateStatusAction(id, status);
    if (success) {
      // Update local state optimistically or after confirmation
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );
      // Update selected application if it's the one being viewed
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) => (prev ? { ...prev, status } : null));
      }
    }
  };
  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header
          title={isAdmin ? "Manage Applications" : "My Applications"}
          subtitle={
            isAdmin
              ? "Review and manage all job applications"
              : "Track your submitted job applications"
          }
        />
        {errorState && (
          <Alert
            message="Error Loading Applications"
            description={errorState}
            type="error"
            showIcon
            className="mb-4"
            closable
            onClose={clearError}
          />
        )}
      </div>
      <div className="px-4 md:px-8">
        {/* Filters Section */}
        <ApplicationFilters
          isAdmin={isAdmin}
          onFilterChange={handleFilterChange}
        />
        {loading && !applications.length ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center justify-center py-8">
              <Spin size="large" />
              <div className="mt-3 text-gray-500">Loading...</div>
            </div>
          </div>
        ) : (
          <ApplicationsTable
            applications={applications}
            loading={loading || roleLoading}
            isAdmin={isAdmin}
            onViewDetails={handleViewDetails}
            onViewResume={handleViewResume}
            onViewProfile={handleViewProfile}
            onStatusUpdate={handleStatusUpdate}
          />
        )}
      </div>
      {/* Application Details Modal */}
      <ApplicationDetailsModal
        visible={detailsModalVisible}
        application={selectedApplication}
        isAdmin={isAdmin}
        onClose={() => setDetailsModalVisible(false)}
        onViewResume={handleViewResume}
        onViewProfile={handleViewProfile}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
};
export default Applications;
