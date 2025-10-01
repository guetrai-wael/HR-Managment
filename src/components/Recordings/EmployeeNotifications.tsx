import React from "react";
import { Alert } from "antd";

interface EmployeeNotification {
  topPerformance: {
    type: string;
    title: string;
    message: string;
    color: string;
  } | null;
  needsAttention: boolean;
  attendanceRate: number;
}

interface EmployeeNotificationsProps {
  notifications: EmployeeNotification;
}

const EmployeeNotifications: React.FC<EmployeeNotificationsProps> = ({
  notifications,
}) => {
  return (
    <>
      {/* Top Performance Notification */}
      {notifications.topPerformance && (
        <Alert
          style={{ marginBottom: 16 }}
          type="success"
          showIcon
          message={notifications.topPerformance.title}
          description={notifications.topPerformance.message}
          banner={false}
        />
      )}

      {/* Attention Alert */}
      {notifications.needsAttention && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="Attendance Needs Attention"
          description={`Your current attendance rate is ${notifications.attendanceRate.toFixed(
            1
          )}%. Consider improving your attendance to maintain good standing.`}
          banner={false}
        />
      )}
    </>
  );
};

export default EmployeeNotifications;
