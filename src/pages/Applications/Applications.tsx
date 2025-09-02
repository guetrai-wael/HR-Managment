import React, { useState } from "react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "../../components/common";
import QueryBoundary from "../../components/common/QueryBoundary";
import {
  ApplicationsTable,
  ApplicationFilters,
  ApplicationDetailsModal,
} from "../../components/Applications";
import { useUser, useRole, useApplicationActions } from "../../hooks";
import { Application, FilterValues } from "../../types";
import { fetchApplications } from "../../services/api/applicationService";

const Applications: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    authLoading: userAuthLoading,
    profileLoading: userProfileLoading,
  } = useUser();
  const { isAdmin, loading: roleCheckLoading } = useRole();
  const [filters, setFilters] = useState<FilterValues>({});

  const {
    data: applications,
    isLoading: applicationsLoading,
    error: applicationsError,
  } = useQuery<Application[], Error>({
    queryKey: [
      "applications",
      { ...filters, search: undefined },
      isAdmin,
      user?.id,
    ],
    queryFn: () => {
      if (!user) return Promise.resolve([]);
      return fetchApplications(
        { ...filters, search: undefined },
        isAdmin,
        user.id
      );
    },
    enabled:
      !!user && !userAuthLoading && !userProfileLoading && !roleCheckLoading,
  });

  // Client-side filtering for search since Supabase has issues with joined table or() queries
  const filteredApplications = React.useMemo(() => {
    if (!applications || !filters.search) return applications;

    const searchTerm = filters.search.toLowerCase();
    return applications.filter((app) => {
      const firstName = app.profile?.first_name?.toLowerCase() || "";
      const lastName = app.profile?.last_name?.toLowerCase() || "";
      const email = app.profile?.email?.toLowerCase() || "";
      const jobTitle = app.job?.title?.toLowerCase() || "";

      return (
        firstName.includes(searchTerm) ||
        lastName.includes(searchTerm) ||
        email.includes(searchTerm) ||
        jobTitle.includes(searchTerm)
      );
    });
  }, [applications, filters.search]);

  const { updateStatus, isUpdatingStatus } = useApplicationActions(filters);

  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setDetailsModalVisible(true);
  };

  const handleViewResume = (url: string | null) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      message.info("No resume available for this application.");
    }
  };

  const handleViewProfile = (userId: string) => {
    console.log("Navigate to or show profile for user:", userId);
    navigate(`/employees/${userId}`);
  };

  const handleUpdateApplicationStatus = async (
    id: number,
    status: Application["status"]
  ) => {
    try {
      await updateStatus({ id, status });
      if (selectedApplication?.id === id) {
        setSelectedApplication((prev) =>
          prev ? { ...prev, status: status } : null
        );
      }
    } catch {
      // Error is handled by useMutation's onError callback in useApplicationActions
    }
  };

  const handleAccept = (id: number) => {
    handleUpdateApplicationStatus(id, "accepted");
  };

  const handleReject = (id: number) => {
    handleUpdateApplicationStatus(id, "rejected");
  };

  const handleInterview = (id: number) => {
    handleUpdateApplicationStatus(id, "interviewing");
  };

  // Combined loading state for the main content query boundary
  const mainQueryIsLoading =
    userAuthLoading ||
    userProfileLoading ||
    roleCheckLoading ||
    applicationsLoading;
  const mainQueryError = applicationsError;

  const pageTitle = isAdmin ? "Manage Applications" : "My Applications";
  const pageSubtitle = isAdmin
    ? "Review and manage all job applications"
    : "Track your submitted job applications";

  return (
    <PageLayout title={pageTitle} subtitle={pageSubtitle}>
      <ApplicationFilters
        isAdmin={isAdmin}
        onFilterChange={handleFilterChange}
        defaultValues={filters}
        disabled={
          userAuthLoading ||
          userProfileLoading ||
          roleCheckLoading ||
          applicationsLoading
        }
      />

      <QueryBoundary
        isLoading={mainQueryIsLoading}
        isError={!!mainQueryError}
        error={mainQueryError}
        loadingTip={
          userAuthLoading || userProfileLoading || roleCheckLoading
            ? "Loading user data..."
            : "Loading applications..."
        }
      >
        <ApplicationsTable
          applications={filteredApplications || []}
          loading={isUpdatingStatus}
          isAdmin={isAdmin}
          onViewDetails={handleViewDetails}
          onViewResume={handleViewResume}
          onViewProfile={handleViewProfile}
          onAccept={handleAccept}
          onReject={handleReject}
          onInterview={handleInterview}
        />
      </QueryBoundary>

      <ApplicationDetailsModal
        visible={detailsModalVisible}
        application={selectedApplication}
        isAdmin={isAdmin}
        onClose={() => setDetailsModalVisible(false)}
        onViewResume={handleViewResume}
        onViewProfile={handleViewProfile}
      />
    </PageLayout>
  );
};
export default Applications;
