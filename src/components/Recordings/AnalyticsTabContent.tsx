import React from "react";
import TopPerformersCard from "./TopPerformersCard";
import DepartmentAnalytics from "./DepartmentAnalytics";

interface Employee {
  name: string;
  email: string;
  rate?: number;
  consistency?: number;
  improvement?: number;
  department?: string;
}

interface AnalyticsTabContentProps {
  // Top performers data
  highestAttendance: Employee[];
  mostConsistent: Employee[];
  mostImprovement: Employee[];

  // Department analytics data
  departmentStats: Array<{
    department: string;
    employeeCount: number;
    averageAttendance: number;
    totalHours: number;
  }>;

  // Needs attention data
  attendanceAlerts: Array<{
    name: string;
    email: string;
    rate: number;
    department?: string;
  }>;
}

const AnalyticsTabContent: React.FC<AnalyticsTabContentProps> = ({
  highestAttendance,
  mostConsistent,
  mostImprovement,
  departmentStats,
  attendanceAlerts,
}) => {
  return (
    <div style={{ padding: 16 }}>
      {/* Top Performers Section */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16, color: "#1890ff" }}>
          🏆 Top Performers
        </h3>
        <TopPerformersCard
          topPerformers={{
            highestAttendance,
            mostConsistent,
            mostImproved: mostImprovement,
          }}
        />
      </div>

      {/* Department Analytics Section */}
      <div>
        <h3 style={{ marginBottom: 16, color: "#1890ff" }}>
          📋 Department Overview
        </h3>
        <DepartmentAnalytics
          departmentStats={departmentStats}
          attendanceAlerts={attendanceAlerts}
        />
      </div>
    </div>
  );
};

export default AnalyticsTabContent;
