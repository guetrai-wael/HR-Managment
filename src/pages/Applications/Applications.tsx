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
import { applicationCrudService } from "../../services/api/recruitment";

const Applications: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    authLoading: userAuthLoading,
    profileLoading: userProfileLoading,
  } = useUser();

  // 🆕 NEW: Using pure standardized structure
  const {
    data: { isAdmin },
    isLoading: roleCheckLoading,
  } = useRole();
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
      return applicationCrudService.getAll({
        ...filters,
        search: undefined,
        isAdmin,
        userId: user.id,
      });
    },
    enabled:
      !!user && !userAuthLoading && !userProfileLoading && !roleCheckLoading,
  });

  // Client-side filtering for job and search filters
  const filteredApplications = React.useMemo(() => {
    if (!applications) return applications;

    let filtered = applications;

    // Filter by job ID if selected
    if (filters.jobId) {
      filtered = filtered.filter((app) => app.job?.id === filters.jobId);
    }

    // Filter by department ID if selected
    if (filters.departmentId) {
      // Coerce both sides to number when possible to avoid type mismatches
      filtered = filtered.filter((app) => {
        const appDeptId = app.job?.department?.id;
        const filterDeptId =
          typeof filters.departmentId === "string"
            ? parseInt(filters.departmentId, 10)
            : (filters.departmentId as number);
        return (
          typeof appDeptId !== "undefined" &&
          !Number.isNaN(filterDeptId) &&
          appDeptId === filterDeptId
        );
      });
    }

    // Filter by search term (admin only - for applicant names/emails)
    if (filters.search && isAdmin) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter((app) => {
        const firstName = app.profile?.first_name?.toLowerCase() || "";
        const lastName = app.profile?.last_name?.toLowerCase() || "";
        const email = app.profile?.email?.toLowerCase() || "";

        return (
          firstName.includes(searchTerm) ||
          lastName.includes(searchTerm) ||
          email.includes(searchTerm)
        );
      });
    }

    return filtered;
  }, [
    applications,
    filters.jobId,
    filters.departmentId,
    filters.search,
    isAdmin,
  ]);

  // 🆕 NEW: Using standardized useApplicationActions structure
  const { actions, isLoading: applicationActionsLoading } =
    useApplicationActions(filters);

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
      // 🆕 NEW: Using actions.updateStatus instead of direct updateStatus
      await actions.updateStatus({ id, status });
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

  const handleCancel = async (id: number, _applicantName: string) => {
    try {
      await actions.deleteApplication(id);
      message.success(`Application cancelled successfully`);
    } catch (error) {
      // Error is handled by useMutation's onError callback in useApplicationActions
      console.error("Failed to cancel application:", error);
    }
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
          loading={applicationActionsLoading}
          isAdmin={isAdmin}
          onViewDetails={handleViewDetails}
          onViewResume={handleViewResume}
          onViewProfile={handleViewProfile}
          onAccept={handleAccept}
          onReject={handleReject}
          onInterview={handleInterview}
          onCancel={handleCancel}
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
