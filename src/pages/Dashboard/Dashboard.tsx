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
import { leaveService } from "../../services/api/leaveService";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { isAdmin, isEmployee } = useRole();

  // Fetch dashboard data
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
    queryFn: leaveService.getMyLeaveBalance,
    enabled: isEmployee && !isAdmin, // Only fetch if user is employee and not admin
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

  return (
    <PageLayout title={getDashboardTitle()} subtitle={getWelcomeMessage()}>
      <Row gutter={[24, 24]}>
        {/* Main Content - 75% */}
        <Col xs={24} lg={18}>
          <div className="space-y-6">
            {/* Statistics Cards */}
            <StatisticsCards
              stats={stats}
              loading={statsLoading}
              isAdmin={isAdmin}
              isEmployee={isEmployee}
            />

            {/* Activity Feed Section */}
            <ActivityFeed
              activities={activities || []}
              loading={activitiesLoading}
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
