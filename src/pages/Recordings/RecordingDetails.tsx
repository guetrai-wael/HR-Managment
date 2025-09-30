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
//import type { EmployeePresence } from '../../types/models';

const { Text } = Typography;
//const { Title, Text } = Typography;
const RecordingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: recording, isLoading } = useQuery({
    queryKey: ["recording", id],
    queryFn: () => recordingsService.getRecordingById(id as string),
    enabled: !!id,
  });

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
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Duration",
      dataIndex: "duration",
      key: "duration",
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
      title: "Email",
      dataIndex: "email",
      key: "email",
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

        <Card title="Employee Presence Data">
          <Table
            dataSource={recording.results_json}
            columns={columns}
            rowKey="name"
            pagination={{ pageSize: 10 }}
          />
        </Card>
      </div>
    </PageLayout>
  );
};

export default RecordingDetails;
