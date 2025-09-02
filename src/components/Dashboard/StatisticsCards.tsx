import { Row, Col, Card, Statistic, Spin } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  FileTextOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { DashboardStats } from "../../hooks/useDashboardData";

// Import images
import vacationIcon from "../../assets/img/vacation.png";
import casualIcon from "../../assets/img/casual.png";
import personalIcon from "../../assets/img/personal.png";
import sickIcon from "../../assets/img/sick.png";

interface StatisticsCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
  isAdmin: boolean;
  isEmployee: boolean;
}

export function StatisticsCards({
  stats,
  loading = false,
  isAdmin,
  isEmployee,
}: StatisticsCardsProps) {
  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card>
              <div className="flex items-center justify-center h-16">
                <Spin />
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (isAdmin) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="New Registrations"
              value={stats?.registrationRequests || 0}
              prefix={<UserOutlined className="text-blue-500" />}
              suffix="this month"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Leave Requests"
              value={stats?.leaveRequests || 0}
              prefix={<CalendarOutlined className="text-orange-500" />}
              suffix="pending"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Applications"
              value={stats?.jobApplications || 0}
              prefix={<FileTextOutlined className="text-green-500" />}
              suffix="pending"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Jobs"
              value={stats?.activeJobs || 0}
              prefix={<TeamOutlined className="text-purple-500" />}
              suffix="open"
            />
          </Card>
        </Col>
      </Row>
    );
  }

  if (isEmployee) {
    return (
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Vacation"
              value={stats?.vacationDays || 0}
              prefix={
                <img src={vacationIcon} alt="Vacation" className="w-6 h-6" />
              }
              suffix="days"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Casual"
              value={stats?.casualDays || 0}
              prefix={<img src={casualIcon} alt="Casual" className="w-6 h-6" />}
              suffix="days"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Personal"
              value={stats?.personalDays || 0}
              prefix={
                <img src={personalIcon} alt="Personal" className="w-6 h-6" />
              }
              suffix="days"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Sick"
              value={stats?.sickDays || 0}
              prefix={<img src={sickIcon} alt="Sick" className="w-6 h-6" />}
              suffix="days"
            />
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Card>
          <div className="text-center py-8">
            <p className="text-gray-500">No statistics available</p>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
