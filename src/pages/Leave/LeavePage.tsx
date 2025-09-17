// src/pages/Leave/LeavePage.tsx
import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, QueryBoundary } from "../../components/common";
import {
  LeaveBalanceDisplay,
  LeaveRequestForm,
  LeaveHistoryTable,
  LeaveFilters,
} from "../../components/Leave/";
import LeaveManagementTable from "../../components/Admin/LeaveManagementTable";
import { useRole } from "../../hooks/useRole";
import {
  leaveRequestService,
  leaveBalanceService,
} from "../../services/api/hr";
import { LeaveRequestDisplay } from "../../types/models";
import { Alert, Spin, Button, Modal } from "antd";

interface LeaveFilterValues {
  leaveTypeId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

const LeavePage: React.FC = () => {
  // 🆕 NEW: Using pure standardized structure
  const {
    data: { isAdmin, isEmployee },
    isLoading: roleLoading,
  } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<LeaveFilterValues>({});

  // Fetch data for Admin
  const {
    data: adminLeaveRequests,
    isLoading: isLoadingAdminRequests,
    error: adminRequestsError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["allLeaveRequests"],
    queryFn: leaveRequestService.getAllLeaveRequests,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Fetch data for Employee
  const {
    data: employeeLeaveRequests,
    isLoading: isLoadingEmployeeRequests,
    error: employeeRequestsError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["myLeaveRequests"],
    queryFn: leaveRequestService.getMyLeaveRequests,
    enabled: isEmployee && !isAdmin, // Only fetch if user is employee and not admin
  });

  const {
    data: leaveBalance,
    isLoading: isLoadingLeaveBalance,
    error: leaveBalanceError,
  } = useQuery<number, Error>({
    queryKey: ["myLeaveBalance"],
    queryFn: leaveBalanceService.getMyLeaveBalance,
    enabled: isEmployee && !isAdmin, // Only fetch if user is employee and not admin
  });

  const showModal = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

  const handleFilterChange = (newFilters: LeaveFilterValues) => {
    setFilters(newFilters);
  };

  // Filter the leave requests based on current filters
  const filteredAdminRequests = useMemo(() => {
    if (!adminLeaveRequests) return [];

    return adminLeaveRequests.filter((request) => {
      // Search filter (employee name)
      if (filters.search?.trim()) {
        const searchLower = filters.search.toLowerCase();
        const employeeName = request.employee_name?.toLowerCase() || "";
        if (!employeeName.includes(searchLower)) {
          return false;
        }
      }

      // Leave type filter
      if (
        filters.leaveTypeId &&
        request.leave_type_id !== String(filters.leaveTypeId)
      ) {
        return false;
      }

      // Status filter
      if (filters.status?.trim() && request.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const requestStart = new Date(request.start_date);
        const requestEnd = new Date(request.end_date);

        if (filters.startDate) {
          const filterStart = new Date(filters.startDate);
          if (requestEnd < filterStart) return false;
        }

        if (filters.endDate) {
          const filterEnd = new Date(filters.endDate);
          if (requestStart > filterEnd) return false;
        }
      }

      return true;
    });
  }, [adminLeaveRequests, filters]);

  const filteredEmployeeRequests = useMemo(() => {
    if (!employeeLeaveRequests) return [];

    return employeeLeaveRequests.filter((request) => {
      // Leave type filter
      if (
        filters.leaveTypeId &&
        request.leave_type_id !== String(filters.leaveTypeId)
      ) {
        return false;
      }

      // Status filter
      if (filters.status?.trim() && request.status !== filters.status) {
        return false;
      }

      // Date range filter
      if (filters.startDate || filters.endDate) {
        const requestStart = new Date(request.start_date);
        const requestEnd = new Date(request.end_date);

        if (filters.startDate) {
          const filterStart = new Date(filters.startDate);
          if (requestEnd < filterStart) return false;
        }

        if (filters.endDate) {
          const filterEnd = new Date(filters.endDate);
          if (requestStart > filterEnd) return false;
        }
      }

      return true;
    });
  }, [employeeLeaveRequests, filters]);

  if (roleLoading) {
    return (
      <PageLayout title="Leaves">
        <div className="flex justify-center items-center h-[50vh]">
          <Spin size="large" tip="Loading user role..." />
        </div>
      </PageLayout>
    );
  }

  const pageTitle = "Leaves";
  let pageSubtitle = "";
  let isLoadingData = false;
  let dataError: Error | null = null;

  if (isAdmin) {
    pageSubtitle = "Review and manage all employee leave requests.";
    isLoadingData = isLoadingAdminRequests;
    dataError = adminRequestsError;
  } else if (isEmployee) {
    pageSubtitle =
      "View your leave balance, request time off, and check your history.";
    isLoadingData = isLoadingEmployeeRequests || isLoadingLeaveBalance;
    dataError = employeeRequestsError || leaveBalanceError;
  }

  return (
    <PageLayout title={pageTitle} subtitle={pageSubtitle}>
      <QueryBoundary
        isLoading={isLoadingData}
        isError={!!dataError}
        error={dataError}
      >
        <div className="space-y-6">
          {isEmployee && !isAdmin && (
            <>
              <div className="flex justify-between items-center">
                <LeaveBalanceDisplay balance={leaveBalance} />
                <Button type="primary" onClick={showModal}>
                  Request Leave
                </Button>
              </div>
              <Modal
                title="Submit Leave Request"
                open={isModalOpen}
                onOk={handleModalClose}
                onCancel={handleModalClose}
                footer={null}
              >
                <LeaveRequestForm onSubmitSuccess={handleModalClose} />
              </Modal>
              <LeaveFilters
                defaultValues={filters}
                onFilterChange={handleFilterChange}
                isAdmin={false}
              />
              <LeaveHistoryTable leaveRequests={filteredEmployeeRequests} />
            </>
          )}

          {isAdmin && (
            <>
              <LeaveFilters
                defaultValues={filters}
                onFilterChange={handleFilterChange}
                isAdmin={true}
              />
              <LeaveManagementTable leaveRequests={filteredAdminRequests} />
            </>
          )}

          {!isEmployee && !isAdmin && (
            <Alert
              message="Access Denied"
              description="You do not have the necessary permissions to view this page. Please contact support if you believe this is an error."
              type="warning"
              showIcon
            />
          )}
        </div>
      </QueryBoundary>
    </PageLayout>
  );
};

export default LeavePage;
