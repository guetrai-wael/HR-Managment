import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
} from "@ant-design/icons";

interface ApplicationStatusBadgeProps {
  status: string;
}

export const ApplicationStatusBadge: React.FC<ApplicationStatusBadgeProps> = ({
  status,
}) => {
  // Define status display properties
  const statusConfig: Record<
    string,
    { color: string; icon: React.ReactNode; text: string }
  > = {
    pending: {
      color: "orange",
      icon: <ClockCircleOutlined />,
      text: "Pending",
    },
    accepted: {
      color: "green",
      icon: <CheckCircleOutlined />,
      text: "Accepted",
    },
    rejected: {
      color: "red",
      icon: <CloseCircleOutlined />,
      text: "Rejected",
    },
    interviewing: {
      color: "blue",
      icon: <CalendarOutlined />,
      text: "Interview",
    },
  };

  // Default configuration if status is not recognized
  const defaultConfig = {
    color: "default",
    icon: <ClockCircleOutlined />,
    text: status.charAt(0).toUpperCase() + status.slice(1),
  };

  // Get config for this status or use default
  const { color, icon, text } =
    statusConfig[status.toLowerCase()] || defaultConfig;

  return (
    <Tag
      color={color}
      icon={icon}
      className="py-1 px-2 flex items-center gap-1 whitespace-nowrap"
    >
      {text}
    </Tag>
  );
};

export default ApplicationStatusBadge;
