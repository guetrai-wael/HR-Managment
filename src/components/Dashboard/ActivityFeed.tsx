import React from "react";
import { Card, List, Typography, Tag, Empty, Spin, Button } from "antd";
import {
  EyeOutlined,
  FileTextOutlined,
  UserOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import type { DashboardActivity } from "../../hooks/useDashboardData";

const { Text, Title } = Typography;

// Helper function to format time ago
const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString();
};

interface ActivityFeedProps {
  activities: DashboardActivity[];
  loading?: boolean;
  isAdmin?: boolean;
  onViewDetails?: (activity: DashboardActivity) => void;
}

const getActivityIcon = (type: DashboardActivity["type"]) => {
  switch (type) {
    case "leave_request":
      return <CalendarOutlined className="text-blue-500" />;
    case "application":
      return <FileTextOutlined className="text-green-500" />;
    case "job":
      return <UserOutlined className="text-purple-500" />;
    case "registration":
      return <UserOutlined className="text-orange-500" />;
    default:
      return <FileTextOutlined className="text-gray-500" />;
  }
};

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "approved":
      return "green";
    case "accepted":
      return "green";
    case "pending":
      return "orange";
    case "rejected":
      return "red";
    case "active":
      return "blue";
    default:
      return "default";
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  isAdmin = false,
  onViewDetails,
}) => {
  if (loading) {
    return (
      <Card className="h-full">
        <div className="flex items-center justify-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card className="h-full">
        <Empty
          description={
            isAdmin ? "No recent system activities" : "No recent activities"
          }
          className="my-8"
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <Title level={4} className="mb-0">
            {isAdmin ? "Recent System Activity" : "Your Recent Activity"}
          </Title>
          <Text type="secondary" className="text-sm">
            Last 20 activities
          </Text>
        </div>
      }
      className="h-full"
    >
      <List
        itemLayout="horizontal"
        dataSource={activities}
        className="max-h-96 overflow-y-auto"
        renderItem={(activity) => (
          <List.Item
            actions={
              onViewDetails
                ? [
                    <Button
                      key="view"
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => onViewDetails(activity)}
                    >
                      View
                    </Button>,
                  ]
                : undefined
            }
          >
            <List.Item.Meta
              avatar={getActivityIcon(activity.type)}
              title={
                <div className="flex items-center gap-2">
                  <Text strong className="text-sm">
                    {activity.title}
                  </Text>
                  {activity.status && (
                    <Tag color={getStatusColor(activity.status)}>
                      {activity.status.charAt(0).toUpperCase() +
                        activity.status.slice(1)}
                    </Tag>
                  )}
                </div>
              }
              description={
                <div className="space-y-1">
                  <Text className="text-xs text-gray-600">
                    {activity.description}
                  </Text>
                  <div className="flex items-center justify-between">
                    <Text type="secondary" className="text-xs">
                      {formatTimeAgo(activity.created_at)}
                    </Text>
                    {activity.user_name && isAdmin && (
                      <Text type="secondary" className="text-xs">
                        by {activity.user_name}
                      </Text>
                    )}
                  </div>
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );
};

export default ActivityFeed;
