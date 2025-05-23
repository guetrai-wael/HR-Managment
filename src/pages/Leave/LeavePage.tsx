// src/pages/Leave/LeavePage.tsx
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageLayout, QueryBoundary } from "../../components/common";
import {
  LeaveBalanceDisplay,
  LeaveRequestForm,
  LeaveHistoryTable,
} from "../../components/Leave/";
import LeaveManagementTable from "../../components/Admin/LeaveManagementTable";
import { useRole } from "../../hooks/useRole";
import { leaveService } from "../../services/api/leaveService";
import { LeaveRequestDisplay } from "../../types/models";
import { Alert, Spin, Button, Modal } from "antd";

const LeavePage: React.FC = () => {
  const { isAdmin, isEmployee, loading: roleLoading } = useRole();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data for Admin
  const {
    data: adminLeaveRequests,
    isLoading: isLoadingAdminRequests,
    error: adminRequestsError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["allLeaveRequests"],
    queryFn: leaveService.getAllLeaveRequests,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Fetch data for Employee
  const {
    data: employeeLeaveRequests,
    isLoading: isLoadingEmployeeRequests,
    error: employeeRequestsError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["myLeaveRequests"],
    queryFn: leaveService.getMyLeaveRequests,
    enabled: isEmployee && !isAdmin, // Only fetch if user is employee and not admin
  });

  const {
    data: leaveBalance,
    isLoading: isLoadingLeaveBalance,
    error: leaveBalanceError,
  } = useQuery<number, Error>({
    queryKey: ["myLeaveBalance"],
    queryFn: leaveService.getMyLeaveBalance,
    enabled: isEmployee && !isAdmin, // Only fetch if user is employee and not admin
  });

  const showModal = () => setIsModalOpen(true);
  const handleModalClose = () => setIsModalOpen(false);

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
              <LeaveHistoryTable leaveRequests={employeeLeaveRequests} />
            </>
          )}

          {isAdmin && (
            <LeaveManagementTable leaveRequests={adminLeaveRequests} />
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
