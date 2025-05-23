// src/components/Leave/LeaveHistoryTable.tsx
import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveService } from "../../services/api/leaveService";
import { LeaveRequestDisplay } from "../../types/models";
import { formatDate } from "../../utils/formatDate";
import {
  Table,
  Button,
  Tag,
  Card,
  Modal,
  message,
  Typography,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

const getStatusTag = (status: LeaveRequestDisplay["status"]) => {
  switch (status) {
    case "pending":
      return (
        <Tag icon={<ClockCircleOutlined />} color="processing">
          Pending
        </Tag>
      );
    case "approved":
      return (
        <Tag icon={<CheckCircleOutlined />} color="success">
          Approved
        </Tag>
      );
    case "rejected":
      return (
        <Tag icon={<CloseCircleOutlined />} color="error">
          Rejected
        </Tag>
      );
    case "cancelled":
      return (
        <Tag icon={<SyncOutlined />} color="default">
          Cancelled
        </Tag>
      );
    default: {
      // Fallback for any unexpected status, though with strict typing this should not be hit.
      const exhaustiveCheck: never = status;
      return <Tag color="default">{exhaustiveCheck}</Tag>;
    }
  }
};

const LeaveHistoryTable: React.FC = () => {
  const queryClient = useQueryClient();

  const {
    data: leaveRequests,
    isLoading,
    error,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["myLeaveRequests"],
    queryFn: leaveService.getMyLeaveRequests,
  });

  const cancelMutation = useMutation<LeaveRequestDisplay, Error, string>({
    mutationFn: leaveService.cancelLeaveRequest,
    onSuccess: () => {
      message.success("Leave request cancelled successfully.");
      queryClient.invalidateQueries({ queryKey: ["myLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
    },
    onError: (err) => {
      message.error(`Failed to cancel request: ${err.message}`);
    },
  });

  const handleCancelRequest = (requestId: string) => {
    Modal.confirm({
      title: "Are you sure you want to cancel this leave request?",
      icon: <ExclamationCircleOutlined />,
      okText: "Yes, Cancel",
      okType: "danger",
      cancelText: "No",
      onOk: () => {
        cancelMutation.mutate(requestId);
      },
    });
  };

  const columns: ColumnsType<LeaveRequestDisplay> = [
    {
      title: "Leave Type",
      dataIndex: "leave_type_name",
      key: "leave_type_name",
      render: (text, record) => (
        <Space>
          {record.leave_type_color_scheme && (
            <Tag
              color={record.leave_type_color_scheme}
              style={{
                marginRight: 8,
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                border: "1px solid #ccc",
                display: "inline-block",
              }}
            />
          )}
          {text}
        </Space>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      render: (text) => formatDate(text),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      render: (text) => formatDate(text),
    },
    {
      title: "Duration",
      dataIndex: "duration_days",
      key: "duration_days",
      render: (days) => `${days} day(s)`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => getStatusTag(status),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      render: (text) => text || "-",
    },
    {
      title: "Submitted On",
      dataIndex: "created_at",
      key: "created_at",
      render: (text) => formatDate(text),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleCancelRequest(record.id)}
              loading={
                cancelMutation.isPending &&
                cancelMutation.variables === record.id
              }
            >
              Cancel
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (error) {
    message.error(`Error loading leave history: ${error.message}`);
  }

  return (
    <Card bordered={false} style={{ boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}>
      <Title level={4} style={{ marginBottom: "20px" }}>
        My Leave Requests
      </Title>
      <Table
        columns={columns}
        dataSource={leaveRequests}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: true }}
        pagination={{
          pageSize: 5,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20"],
        }}
      />
    </Card>
  );
};

export default LeaveHistoryTable;
