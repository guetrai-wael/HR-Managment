import React from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col } from "antd";
import { useQuery } from "@tanstack/react-query";
import { PageLayout } from "../../components/common";
import {
  useRole,
  useUser,
  useDashboardStats,
  useDashboardActivities,
  type DashboardActivity,
} from "../../hooks";
import {
  StatisticsCards,
  ActivityFeed,
  DashboardSidebar,
} from "../../components/Dashboard";
import { leaveBalanceService } from "../../services/api/hr";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  // 🆕 NEW: Using pure standardized structure
  const {
    data: { isAdmin, isEmployee },
    isLoading: roleLoading,
  } = useRole();

  // Only fetch dashboard data if roles are determined and user has a valid role
  const { data: stats, isLoading: statsLoading } = useDashboardStats(
    isAdmin,
    isEmployee
  );
  const { data: activities, isLoading: activitiesLoading } =
    useDashboardActivities(isAdmin, isEmployee);

  // Fetch leave balance for employees
  const { data: leaveBalance, isLoading: isLoadingBalance } = useQuery<
    number,
    Error
  >({
    queryKey: ["myLeaveBalance"],
    queryFn: leaveBalanceService.getMyLeaveBalance,
    enabled: isEmployee && !isAdmin && !roleLoading, // Only fetch if user is employee and not admin, and roles are loaded
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const handleActivityClick = (activity: DashboardActivity) => {
    switch (activity.type) {
      case "leave_request":
        navigate(`/leaves?highlight=${activity.id}`);
        break;
      case "application":
        navigate(`/applications?highlight=${activity.id}`);
        break;
      case "job":
        navigate(`/jobs/${activity.id}`);
        break;
      default:
        break;
    }
  };

  const getDashboardTitle = () => {
    if (isAdmin) return "Admin Dashboard";
    if (isEmployee) return "Employee Dashboard";
    return "Dashboard";
  };

  const getWelcomeMessage = () => {
    const name =
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
    return `Welcome back, ${name}!`;
  };

  // Show loading state if roles are still being determined
  if (roleLoading) {
    return (
      <PageLayout title="Dashboard" subtitle="Loading...">
        <div className="flex justify-center items-center h-64">
          <span>Loading dashboard...</span>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title={getDashboardTitle()} subtitle={getWelcomeMessage()}>
      <Row gutter={[24, 24]}>
        {/* Main Content - 75% */}
        <Col xs={24} lg={18}>
          <div className="space-y-6">
            {/* Statistics Cards */}
            <StatisticsCards
              stats={stats}
              loading={statsLoading || roleLoading}
              isAdmin={isAdmin}
              isEmployee={isEmployee}
            />

            {/* Activity Feed Section */}
            <ActivityFeed
              activities={activities || []}
              loading={activitiesLoading || roleLoading}
              isAdmin={isAdmin}
              onViewDetails={handleActivityClick}
            />
          </div>
        </Col>

        {/* Right Sidebar - 25% */}
        <Col xs={24} lg={6}>
          <DashboardSidebar
            isAdmin={isAdmin}
            isEmployee={isEmployee}
            leaveBalance={leaveBalance}
            isLoadingBalance={isLoadingBalance}
          />
        </Col>
      </Row>
    </PageLayout>
  );
};

export default Dashboard;
