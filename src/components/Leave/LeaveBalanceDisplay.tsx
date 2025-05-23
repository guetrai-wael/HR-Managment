// src/components/Leave/LeaveBalanceDisplay.tsx
import React from "react";
import { Card, Typography, Statistic } from "antd";
import { CalendarOutlined } from "@ant-design/icons";

const { Text } = Typography;

interface LeaveBalanceDisplayProps {
  balance?: number; // Balance is now a prop, can be undefined if still loading or error
}

const LeaveBalanceDisplay: React.FC<LeaveBalanceDisplayProps> = ({
  balance,
}) => {
  return (
    <Card
      variant="borderless"
      style={{ boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}
    >
      <Statistic
        title="My Available Leave Balance"
        value={balance ?? 0} // Use the balance prop, default to 0 if undefined
        precision={0}
        prefix={<CalendarOutlined style={{ marginRight: 8 }} />}
        suffix="days"
        valueStyle={{
          color: "#3f8600",
          fontSize: "28px",
        }}
      />
      <Text type="secondary" style={{ display: "block", marginTop: "8px" }}>
        This is your current pool of available leave days.
      </Text>
    </Card>
  );
};

export default LeaveBalanceDisplay;
