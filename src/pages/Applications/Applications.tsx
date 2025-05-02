import React, { useState, useEffect, useRef, useCallback } from "react";
import { Spin, Alert, message, Modal } from "antd"; // Modal is already imported
import { Header } from "../../components/common";
import {
  ApplicationsTable,
  ApplicationFilters,
  ApplicationDetailsModal,
} from "../../components/Applications";
import { useUser, useRole, useApplicationActions } from "../../hooks";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { fetchApplications } from "../../services/api/applicationService";
import { Application, FilterValues } from "../../types";

const Applications: React.FC = () => {
  const { user, loading: userLoading } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();
  // --- Use handleUpdateStatus from the hook ---
  const { handleUpdateStatus } = useApplicationActions();
  const { catchError, error: errorState, clearError } = useErrorHandler();

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const fetchId = useRef(0);

  // loadApplications (No change needed)
  const loadApplications = useCallback(async () => {
    if (!user || roleLoading || userLoading) {
      // console.log("loadApplications skipped: User or role not ready."); // Keep logs for now
      setLoading(false);
      return;
    }
    const currentFetch = ++fetchId.current;
    setLoading(true);
    clearError();
    try {
      // console.log(`Loading applications for user: ${user.id}, isAdmin: ${isAdmin}`);
      // console.log("Directly calling fetchApplications...");
      const data = await fetchApplications(filters, isAdmin, user.id);
      // console.log("fetchApplications call completed.");
      if (fetchId.current === currentFetch) {
        // console.log("Applications loaded:", data?.length || 0);
        setApplications(data || []);
      } else {
        // console.log("Stale fetch result ignored.");
      }
    } catch (error: unknown) {
      if (fetchId.current === currentFetch) {
        console.error(
          "Error caught in loadApplications after fetch attempt:",
          error
        );
        catchError(error, "Failed to load applications");
        setApplications([]);
      } else {
        // console.log("Stale fetch error ignored.");
      }
    } finally {
      if (fetchId.current === currentFetch) {
        // console.log("loadApplications finally block executed.");
        setLoading(false);
      }
    }
  }, [
    user,
    isAdmin,
    filters,
    roleLoading,
    userLoading,
    catchError,
    clearError,
  ]);

  // useEffect for loading (No change needed)
  useEffect(() => {
    const currentFetchId = fetchId.current;
    if (!userLoading && !roleLoading && user) {
      // console.log("useEffect: Dependencies ready, calling loadApplications.");
      loadApplications();
    } else if (!user && !userLoading) {
      // console.log("useEffect: No user and not loading, clearing applications.");
      setApplications([]);
      setLoading(false);
    } else {
      // console.log(`useEffect: Skipping loadApplications (userLoading: ${userLoading}, roleLoading: ${roleLoading}, userExists: ${!!user})`);
      setLoading(true);
    }
    return () => {
      fetchId.current = -1;
      // console.log("useEffect cleanup triggered.");
    };
  }, [user, userLoading, roleLoading, loadApplications]);

  // handleFilterChange (No change needed)
  const handleFilterChange = (newFilters: FilterValues) => {
    // console.log("Filters changed:", newFilters);
    fetchId.current = 0;
    setFilters(newFilters);
  };

  // handleViewDetails (No change needed)
  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsModalVisible(true);
  };

  // handleViewResume (No change needed)
  const handleViewResume = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      message.info("No resume available for this application.");
    }
  };

  // handleViewProfile (No change needed)
  const handleViewProfile = (userId: string) => {
    console.log("Navigate to or show profile for user:", userId); // Keep log for now
    message.info("Profile view not yet implemented.");
  };

  // --- handleAccept --- (No change needed)
  const handleAccept = async (id: number, _applicantName: string) => {
    const success = await handleUpdateStatus(id, "accepted");
    if (success) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: "accepted" } : app
        )
      );
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) =>
          prev ? { ...prev, status: "accepted" } : null
        );
      }
    }
  };

  // --- handleReject --- (No change needed)
  const handleReject = async (id: number, _applicantName: string) => {
    const success = await handleUpdateStatus(id, "rejected");
    if (success) {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: "rejected" } : app
        )
      );
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) =>
          prev ? { ...prev, status: "rejected" } : null
        );
      }
    }
  };

  // --- ADD handleInterview ---
  const handleInterview = async (id: number, _applicantName: string) => {
    // Confirmation is handled in the table component
    const success = await handleUpdateStatus(id, "interviewing");
    if (success) {
      // Optimistic update
      setApplications((prev) =>
        prev.map((app) =>
          app.id === id ? { ...app, status: "interviewing" } : app
        )
      );
      // Update modal if open
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) =>
          prev ? { ...prev, status: "interviewing" } : null
        );
      }
    }
  };

  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      {/* Header and Error Alert (No change) */}
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
        {/* Filters Section (No change) */}
        <ApplicationFilters
          isAdmin={isAdmin}
          onFilterChange={handleFilterChange}
          defaultValues={filters}
        />

        {/* Loading Check (No change) */}
        {userLoading || roleLoading || loading ? (
          <div className="flex justify-center py-8">
            <div className="flex flex-col items-center justify-center py-8">
              <Spin size="large" />
              <div className="mt-3 text-gray-500">Loading...</div>
            </div>
          </div>
        ) : (
          // --- Update ApplicationsTable props ---
          <ApplicationsTable
            applications={applications}
            loading={loading}
            isAdmin={isAdmin}
            onViewDetails={handleViewDetails}
            onViewResume={handleViewResume}
            onViewProfile={handleViewProfile} // Keep passing for modal
            onAccept={handleAccept}
            onReject={handleReject}
            onInterview={handleInterview} // Pass new handler
          />
        )}
      </div>

      {/* --- ApplicationDetailsModal props (No change needed here) --- */}
      <ApplicationDetailsModal
        visible={detailsModalVisible}
        application={selectedApplication}
        isAdmin={isAdmin}
        onClose={() => setDetailsModalVisible(false)}
        onViewResume={handleViewResume}
        onViewProfile={handleViewProfile} // Keep passing
      />
    </div>
  );
};
export default Applications;
