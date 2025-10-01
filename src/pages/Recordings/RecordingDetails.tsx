import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  Table,
  Button,
  Typography,
  Spin,
  Statistic,
  Row,
  Col,
  Tag,
} from "antd";
import {
  ArrowLeftOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import PageLayout from "../../components/common/PageLayout";
import { recordingsService } from "../../services/api/recordingsService";
import type { EmployeePresence } from "../../types/models";
import UserAvatar from "../../components/common/UserAvatar";
import { profileSearchService } from "../../services/api/core/profileSearchService";
import { formatBytes } from "../../utils/formatDate";
import { useRole } from "../../hooks/useRole";
import { useUser } from "../../hooks/useUser";

const { Text } = Typography;

const RecordingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: roleData } = useRole();
  const { user } = useUser();

  const { data: recording, isLoading } = useQuery({
    queryKey: ["recording", id],
    queryFn: () => recordingsService.getRecordingById(id as string),
    enabled: !!id,
  });

  // Filter results based on role
  const filteredResults = React.useMemo(() => {
    if (!recording) return [] as EmployeePresence[];

    // Admin sees all employees' data
    if (roleData.isAdmin) {
      return recording.results_json;
    }

    // Employee sees only their own data
    // Match by employee_id or email
    return recording.results_json.filter((result) => {
      const matchesId =
        result.employee_id && user?.id && result.employee_id === user.id;
      const matchesEmail =
        result.email &&
        user?.email &&
        result.email.toLowerCase() === user.email.toLowerCase();
      return matchesId || matchesEmail;
    });
  }, [recording, roleData.isAdmin, user]);

  // Map of email -> avatar_url
  const [avatars, setAvatars] = React.useState<Record<string, string | null>>(
    {}
  );

  // Fetch avatars for detected emails when recording loads
  React.useEffect(() => {
    if (!recording) return;

    const emails = Array.from(
      new Set(recording.results_json.map((r) => r.email).filter(Boolean))
    );

    // Only fetch for emails we don't already have
    const emailsToFetch = emails.filter((e) => !(e in avatars));
    if (emailsToFetch.length === 0) return;

    (async () => {
      try {
        const results = await Promise.all(
          emailsToFetch.map((email) =>
            profileSearchService
              .searchByCriteria({ email, limit: 1 })
              .catch(() => [])
          )
        );

        const newMap: Record<string, string | null> = {};
        emailsToFetch.forEach((email, idx) => {
          const profiles = results[idx] || [];
          newMap[email] = profiles[0]?.avatar_url ?? null;
        });

        setAvatars((prev) => ({ ...prev, ...newMap }));
      } catch (err) {
        console.error("Failed to fetch avatars for recordings:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  if (isLoading) {
    return (
      <PageLayout title="Loading Recording Details">
        <div
          style={{ display: "flex", justifyContent: "center", padding: "50px" }}
        >
          <Spin size="large" />
        </div>
      </PageLayout>
    );
  }

  if (!recording) {
    return (
      <PageLayout title="Recording Not Found">
        <Card>
          <Text>The requested recording could not be found.</Text>
          <Button
            type="primary"
            onClick={() => navigate("/recordings")}
            style={{ marginTop: 16 }}
          >
            Back to Recordings
          </Button>
        </Card>
      </PageLayout>
    );
  }

  // Calculate statistics
  const totalEmployees = recording.results_json.length;
  const presentEmployees = recording.results_json.filter(
    (emp) => emp.attendance === "Present"
  ).length;
  const absentEmployees = totalEmployees - presentEmployees;
  const attendanceRate =
    totalEmployees > 0 ? (presentEmployees / totalEmployees) * 100 : 0;

  // Table columns for employee presence data
  // Helper: parse duration strings into seconds. Supports formats like '123sec', '1h 2m 3s', 'HH:MM:SS', or plain seconds number/string
  const parseDurationToSeconds = (
    raw?: string | number | null
  ): number | null => {
    if (raw === undefined || raw === null) return null;
    if (typeof raw === "number")
      return Number.isFinite(raw) ? Math.floor(raw) : null;
    const s = String(raw).trim();

    // plain number (seconds)
    if (/^\d+$/.test(s)) return parseInt(s, 10);

    // seconds with 'sec' suffix like '123sec'
    const mSec = s.match(/^(\d+)\s*sec(?:s)?$/i);
    if (mSec) return parseInt(mSec[1], 10);

    // formats like '1h 2m 3s' or '1h2m3s'
    const hmsMatch = s.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i);
    if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
      const hh = parseInt(hmsMatch[1] || "0", 10);
      const mm = parseInt(hmsMatch[2] || "0", 10);
      const ss = parseInt(hmsMatch[3] || "0", 10);
      return hh * 3600 + mm * 60 + ss;
    }

    // HH:MM:SS or MM:SS
    const colonParts = s.split(":").map((p) => p.trim());
    if (colonParts.length >= 2 && colonParts.every((p) => /^\d+$/.test(p))) {
      const parts = colonParts.map(Number).reverse();
      let seconds = 0;
      if (parts[0]) seconds += parts[0]; // seconds
      if (parts[1]) seconds += parts[1] * 60; // minutes
      if (parts[2]) seconds += parts[2] * 3600; // hours
      return seconds;
    }

    return null;
  };

  const formatSeconds = (secs?: number | null) => {
    if (secs === null || secs === undefined || Number.isNaN(secs)) return "—";
    const s = Math.max(0, Math.floor(secs));
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
  };

  const FULL_DAY_THRESHOLD_SECONDS = 8 * 3600; // default to 8 hours
  const columns = [
    {
      title: "Employee",
      key: "employee",
      render: (_: unknown, record: EmployeePresence) => (
        <UserAvatar
          src={record.email ? avatars[record.email] : undefined}
          firstName={record.name?.split(" ")?.[0] || null}
          lastName={record.name?.split(" ")?.slice(1).join(" ") || null}
          email={record.email}
          showName={true}
          size={40}
          containerClassName="flex items-center space-x-3 py-1"
          nameClassName="font-medium whitespace-nowrap text-sm"
          emailClassName="text-xs text-gray-500 truncate"
        />
      ),
      width: 300,
      fixed: "left" as const,
    },
    {
      title: "Hours Spent",
      key: "hours_spent",
      render: (_: unknown, record: EmployeePresence) => {
        const r = record as EmployeePresence & { duration?: string | number };
        const secs = parseDurationToSeconds(r.duration);
        return secs === null ? "—" : formatSeconds(secs);
      },
    },
    {
      title: "Extra Hours",
      key: "extra_hours",
      render: (_: unknown, record: EmployeePresence) => {
        const r = record as EmployeePresence & { duration?: string | number };
        const secs = parseDurationToSeconds(r.duration);
        if (secs === null) return "—";
        const extra = Math.max(0, secs - FULL_DAY_THRESHOLD_SECONDS);
        return extra <= 0 ? formatSeconds(0) : formatSeconds(extra);
      },
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Attendance",
      dataIndex: "attendance",
      key: "attendance",
      render: (attendance: string) => (
        <Tag color={attendance === "Present" ? "green" : "red"}>
          {attendance}
        </Tag>
      ),
    },
  ];

  return (
    <PageLayout
      title="Recording Details"
      subtitle={`Recorded on ${new Date(
        recording.created_at
      ).toLocaleString()}`}
      headerActions={
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate("/recordings")}
        >
          Back to Recordings
        </Button>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Admin Statistics - Only show for admins */}
        {roleData.isAdmin && (
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Employees"
                  value={totalEmployees}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Present"
                  value={presentEmployees}
                  valueStyle={{ color: "#3f8600" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Absent"
                  value={absentEmployees}
                  valueStyle={{ color: "#cf1322" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Attendance Rate"
                  value={attendanceRate}
                  precision={2}
                  suffix="%"
                  prefix={<ClockCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}
        <Card title="Recording Info" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Text strong>{recording.video_name || "Unnamed video"}</Text>
              <Text type="secondary">
                {recording.video_size
                  ? formatBytes(recording.video_size)
                  : "Unknown size"}
              </Text>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <Text strong>Duration: </Text>
              <Text>
                {recording.video_duration !== null || undefined
                  ? formatSeconds(recording.video_duration)
                  : "—"}
              </Text>
            </div>
          </div>
        </Card>

        <Card title="Employee Presence Data">
          <Table
            dataSource={filteredResults}
            columns={columns}
            rowKey={(record: EmployeePresence) => record.email || record.name}
            pagination={{ pageSize: 10 }}
            size="small"
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default RecordingDetails;
