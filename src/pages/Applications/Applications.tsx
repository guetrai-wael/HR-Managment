import React, { useState, useEffect, useRef } from "react";
import { message, Alert, Spin } from "antd";
import { Header } from "../../components/common";
import {
  ApplicationsTable,
  ApplicationDetailsModal,
  ApplicationFilters,
} from "../../components/Applications";
import { Application } from "../../types";
import { useUser, useRole, useApplicationActions } from "../../hooks";
import { fetchApplications } from "../../services/api/applicationService";
import { useErrorHandler } from "../../hooks/useErrorHandler";

interface FilterValues {
  jobId?: number;
  departmentId?: string;
  status?: string;
  dateRange?: [string, string];
  search?: string;
}

const Applications: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();
  const { handleUpdateStatus } = useApplicationActions();
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

  useEffect(() => {
    // Only load applications when we have a user
    if (user) {
      loadApplications();
    }

    // Cleanup function for unmounting
    return () => {
      fetchId.current = -1; // Mark all in-flight requests as stale
    };
  }, [user, isAdmin, filters]);

  const loadApplications = async () => {
    if (!user) return;

    const currentFetch = ++fetchId.current;
    setLoading(true);
    clearError();

    try {
      console.log("Loading applications for user:", user.id);

      // Try with timeout protection
      try {
        const data = await Promise.race([
          fetchApplications({
            userId: isAdmin ? undefined : user.id,
            ...filters,
          }),
          new Promise<never>((_, reject) =>
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

          // Direct Supabase fallback with simpler query
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
  };

  // Handler functions remain the same
  const handleFilterChange = (newFilters: FilterValues) => {
    console.log("Filters changed:", newFilters);
    setFilters(newFilters);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsModalVisible(true);
  };

  const handleViewResume = (url: string) => {
    window.open(url, "_blank");
  };

  const handleViewProfile = (userId: string) => {
    console.log("View profile for user:", userId);
  };

  const handleStatusUpdate = async (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => {
    const result = await handleUpdateStatus(id, status);
    if (result) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status } : app))
      );

      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) => (prev ? { ...prev, status } : null));
      }

      message.success(`Application ${status} successfully`);
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
        {/* Applications Table with loading state */}
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
