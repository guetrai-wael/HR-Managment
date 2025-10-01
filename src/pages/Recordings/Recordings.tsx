import React, { useState, useMemo } from "react";
import {
  Button,
  Card,
  Table,
  Space,
  Spin,
  Statistic,
  Row,
  Col,
  Tag,
  Empty,
  Tabs,
} from "antd";
import { EyeOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../components/common/PageLayout";
import { recordingsService } from "../../services/api/recordingsService";
import { useRole, useUser } from "../../hooks";
import type { RecordingResult, EmployeeRecording } from "../../types/models";
import {
  formatBytes,
  formatSeconds,
  formatDateNumeric,
} from "../../utils/formatDate";
import {
  RecordingUpload,
  EmployeeNotifications,
  AnalyticsTabContent,
} from "../../components/Recordings";

const Recordings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>("recordings");

  // Get user role and info
  const {
    data: { isAdmin },
    isLoading: roleLoading,
  } = useRole();

  const { user, profile } = useUser();

  // Fetch admin recordings
  const {
    data: recordings,
    isLoading: adminLoading,
    refetch,
  } = useQuery({
    queryKey: ["recordings"],
    queryFn: recordingsService.getRecordings,
    enabled: isAdmin,
  });

  // Fetch employee recordings
  const { data: employeeRecordings, isLoading: employeeLoading } = useQuery({
    queryKey: ["employee-recordings"],
    queryFn: recordingsService.getEmployeeRecordings,
    enabled: !isAdmin && !roleLoading,
  });

  // Fetch admin analytics (used for both admin dashboard and employee notifications)
  const { data: adminAnalytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: recordingsService.getAdminAnalytics,
    enabled: isAdmin || (!isAdmin && !roleLoading), // Fetch for both admin and employee
  });

  const isLoading =
    roleLoading ||
    (isAdmin ? adminLoading || analyticsLoading : employeeLoading);

  // Calculate employee statistics
  const employeeStatistics = useMemo(() => {
    if (!employeeRecordings || employeeRecordings.length === 0) {
      return {
        totalVideos: 0,
        totalPresenceTime: 0,
        averagePresenceTime: 0,
        presenceRate: 0,
      };
    }

    const totalVideos = employeeRecordings.length;

    // Total time employee was present across all videos (in seconds)
    const totalPresenceTime = employeeRecordings.reduce(
      (sum, r) => sum + (r.person.duration || 0),
      0
    );

    // Average time employee was present per video
    const averagePresenceTime = totalPresenceTime / totalVideos;

    // Total duration of all videos (in seconds)
    const totalVideoDuration = employeeRecordings.reduce(
      (sum, r) => sum + (r.video_duration || 0),
      0
    );

    // Presence rate = (total time present / total video duration) * 100
    const presenceRate =
      totalVideoDuration > 0
        ? (totalPresenceTime / totalVideoDuration) * 100
        : 0;

    return {
      totalVideos,
      totalPresenceTime,
      averagePresenceTime,
      presenceRate,
    };
  }, [employeeRecordings]);

  // Employee notifications - check if current employee is featured in admin analytics
  const employeeNotifications = useMemo(() => {
    if (isAdmin || !adminAnalytics || !user || !profile) {
      return {
        topPerformance: null,
        needsAttention: false,
        attendanceRate: 0,
      };
    }

    const currentUserEmail = user.email;

    // Check if employee is in top performers
    let topPerformance = null;
    if (
      adminAnalytics.topPerformers.highestAttendance.some(
        (emp) => emp.email === currentUserEmail
      )
    ) {
      const employee = adminAnalytics.topPerformers.highestAttendance.find(
        (emp) => emp.email === currentUserEmail
      )!;
      const isTied = adminAnalytics.topPerformers.highestAttendance.length > 1;
      topPerformance = {
        type: "highest_attendance",
        title: "🏆 Top Performer",
        message: isTied
          ? `Congratulations! You're tied for the highest attendance rate at ${
              employee.rate
            }% (shared with ${
              adminAnalytics.topPerformers.highestAttendance.length - 1
            } other${
              adminAnalytics.topPerformers.highestAttendance.length > 2
                ? "s"
                : ""
            })`
          : `Congratulations! You have the highest attendance rate at ${employee.rate}%`,
        color: "#faad14",
      };
    } else if (
      adminAnalytics.topPerformers.mostConsistent.some(
        (emp) => emp.email === currentUserEmail
      )
    ) {
      const employee = adminAnalytics.topPerformers.mostConsistent.find(
        (emp) => emp.email === currentUserEmail
      )!;
      const isTied = adminAnalytics.topPerformers.mostConsistent.length > 1;
      topPerformance = {
        type: "most_consistent",
        title: "🎯 Most Consistent",
        message: isTied
          ? `Great job! You're tied for the most consistent attendance with ${
              employee.consistency
            }% consistency (shared with ${
              adminAnalytics.topPerformers.mostConsistent.length - 1
            } other${
              adminAnalytics.topPerformers.mostConsistent.length > 2 ? "s" : ""
            })`
          : `Great job! You're the most consistent employee with ${employee.consistency}% consistency`,
        color: "#1890ff",
      };
    } else if (
      adminAnalytics.topPerformers.mostImproved.some(
        (emp) => emp.email === currentUserEmail
      )
    ) {
      const employee = adminAnalytics.topPerformers.mostImproved.find(
        (emp) => emp.email === currentUserEmail
      )!;
      const isTied = adminAnalytics.topPerformers.mostImproved.length > 1;
      topPerformance = {
        type: "most_improved",
        title: "📈 Most Improved",
        message: isTied
          ? `Excellent progress! You're tied for the most improved attendance with +${
              employee.improvement
            }% improvement (shared with ${
              adminAnalytics.topPerformers.mostImproved.length - 1
            } other${
              adminAnalytics.topPerformers.mostImproved.length > 2 ? "s" : ""
            })`
          : `Excellent progress! Your attendance improved by ${employee.improvement}%`,
        color: "#52c41a",
      };
    }

    // Check if employee needs attention
    const needsAttentionEmployee = adminAnalytics.attendanceAlerts.find(
      (emp) => emp.email === currentUserEmail
    );
    const needsAttention = !!needsAttentionEmployee;
    const attendanceRate =
      needsAttentionEmployee?.rate || employeeStatistics.presenceRate;

    return {
      topPerformance,
      needsAttention,
      attendanceRate,
    };
  }, [isAdmin, adminAnalytics, user, profile, employeeStatistics.presenceRate]);

  // Handle successful upload
  const handleUploadSuccess = () => {
    refetch();
  };

  // Admin table columns
  const adminColumns = [
    {
      title: "Video Name",
      dataIndex: "video_name",
      key: "video_name",
      render: (v: unknown) => <strong>{String(v || "Unnamed video")}</strong>,
      width: 300,
    },
    {
      title: "Size",
      dataIndex: "video_size",
      key: "video_size",
      render: (v: unknown) =>
        v || v === 0 ? formatBytes(Number(v)) : "Unknown size",
      width: 140,
    },
    {
      title: "Duration",
      key: "video_duration",
      dataIndex: "video_duration",
      render: (_: unknown, record: RecordingResult) => {
        const dur = record.video_duration ?? null;
        return dur ? formatSeconds(dur) : "—";
      },
      width: 140,
    },
    {
      title: "Date",
      key: "date",
      render: (_: unknown, record: RecordingResult) => {
        const r = record as RecordingResult & {
          created_at?: string;
          processed_at?: string;
        };
        const dateStr = r.created_at || r.processed_at;
        if (!dateStr) return "—";
        return formatDateNumeric(dateStr);
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: RecordingResult) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/recordings/${record.id}`);
            }}
            aria-label="View details"
          />
        </Space>
      ),
    },
  ];

  // Employee table columns
  const employeeColumns = [
    {
      title: "Video Name",
      dataIndex: "video_name",
      key: "video_name",
      render: (v: unknown) => <strong>{String(v || "Unnamed video")}</strong>,
      width: 300,
    },
    {
      title: "Date",
      dataIndex: "created_at",
      key: "created_at",
      render: (date: string | null) => {
        if (!date) return "—";
        return formatDateNumeric(date);
      },
      width: 120,
    },
    {
      title: "Duration",
      key: "duration",
      render: (_: unknown, record: EmployeeRecording) => {
        return formatSeconds(record.video_duration || 0);
      },
      width: 140,
    },
    {
      title: "Attendance",
      key: "attendance",
      render: (_: unknown, record: EmployeeRecording) => {
        const attendance = record.person.attendance;
        const color = attendance === "Present" ? "green" : "red";
        return <Tag color={color}>{attendance}</Tag>;
      },
      width: 120,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: EmployeeRecording) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/recordings/${record.id}`);
          }}
          aria-label="View details"
        />
      ),
      width: 80,
    },
  ];

  // Loading state
  if (isLoading) {
    return (
      <PageLayout
        title="Recordings"
        subtitle={
          isAdmin
            ? "Upload and manage employee recordings"
            : "View your attendance recordings"
        }
      >
        <div
          style={{ display: "flex", justifyContent: "center", padding: "50px" }}
        >
          <Spin size="large" />
        </div>
      </PageLayout>
    );
  }

  // Employee view - empty state
  if (!isAdmin && (!employeeRecordings || employeeRecordings.length === 0)) {
    return (
      <PageLayout
        title="My Recordings"
        subtitle="View your attendance recordings"
      >
        <Card>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No recordings found yet"
          >
            <p style={{ color: "#666" }}>
              Your attendance recordings will appear here once they are
              processed.
            </p>
          </Empty>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isAdmin ? "Recordings" : "My Recordings"}
      subtitle={
        isAdmin
          ? "Upload and manage employee recordings"
          : "View your attendance recordings"
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Admin Upload Section */}
        {isAdmin && <RecordingUpload onUploadSuccess={handleUploadSuccess} />}

        {/* Admin Analytics Section */}
        {isAdmin && (
          <>
            {adminAnalytics &&
            (adminAnalytics.activeEmployees > 0 ||
              adminAnalytics.attendanceAlerts.length > 0) ? (
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "recordings",
                    label: "📹 Recording History",
                    children: (
                      <Card title="Recording History">
                        <Table
                          dataSource={recordings || []}
                          columns={adminColumns}
                          rowKey="id"
                          pagination={{ pageSize: 10 }}
                          size="small"
                          onRow={(record) => ({
                            onClick: () => navigate(`/recordings/${record.id}`),
                            style: { cursor: "pointer" },
                          })}
                        />
                      </Card>
                    ),
                  },
                  {
                    key: "analytics",
                    label: "📊 Analytics",
                    children: (
                      <AnalyticsTabContent
                        highestAttendance={
                          adminAnalytics.topPerformers.highestAttendance
                        }
                        mostConsistent={
                          adminAnalytics.topPerformers.mostConsistent
                        }
                        mostImprovement={
                          adminAnalytics.topPerformers.mostImproved
                        }
                        departmentStats={adminAnalytics.departmentStats}
                        attendanceAlerts={adminAnalytics.attendanceAlerts}
                      />
                    ),
                  },
                ]}
              />
            ) : (
              <Card title="📊 Analytics" style={{ marginBottom: 16 }}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No recordings available yet"
                >
                  <p style={{ color: "#666" }}>
                    Upload and process some recordings to see detailed analytics
                    and employee performance insights.
                  </p>
                </Empty>
              </Card>
            )}
          </>
        )}

        {/* Employee Notifications and Statistics */}
        {!isAdmin && (
          <>
            <EmployeeNotifications notifications={employeeNotifications} />

            {employeeRecordings && employeeRecordings.length > 0 && (
              <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Total Time Present"
                      value={formatSeconds(
                        employeeStatistics.totalPresenceTime
                      )}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Avg Time Present"
                      value={formatSeconds(
                        employeeStatistics.averagePresenceTime
                      )}
                      prefix={<ClockCircleOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="Presence Rate"
                      value={employeeStatistics.presenceRate}
                      precision={1}
                      suffix="%"
                      valueStyle={{
                        color:
                          employeeStatistics.presenceRate >= 80
                            ? "#3f8600"
                            : "#cf1322",
                      }}
                    />
                  </Card>
                </Col>
              </Row>
            )}

            <Card title="My Attendance Records">
              <Table
                dataSource={employeeRecordings || []}
                columns={employeeColumns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                size="small"
                onRow={(record) => ({
                  onClick: () => navigate(`/recordings/${record.id}`),
                  style: { cursor: "pointer" },
                })}
              />
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default Recordings;
