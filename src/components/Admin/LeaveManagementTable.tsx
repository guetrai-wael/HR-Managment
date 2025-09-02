// src/components/Admin/LeaveManagementTable.tsx
import React, { useEffect } from "react";
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
  Avatar,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
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
      const exhaustiveCheck: never = status;
      return <Tag color="default">{exhaustiveCheck}</Tag>;
    }
  }
};

interface LeaveManagementTableProps {
  leaveRequests?: LeaveRequestDisplay[];
}

const LeaveManagementTable: React.FC<LeaveManagementTableProps> = ({
  leaveRequests: propLeaveRequests,
}) => {
  const queryClient = useQueryClient();

  const {
    data: fetchedLeaveRequests,
    isLoading,
    error: queryError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["allLeaveRequests"],
    queryFn: leaveService.getAllLeaveRequests,
    enabled: !propLeaveRequests, // Only fetch if no props provided
  });

  // Use prop data if provided, otherwise use fetched data
  const leaveRequests = propLeaveRequests || fetchedLeaveRequests;

  // Effect to show error message when queryError changes
  useEffect(() => {
    if (queryError) {
      message.error(`Error loading leave requests: ${queryError.message}`);
    }
  }, [queryError]);

  const approveMutation = useMutation<LeaveRequestDisplay, Error, string>({
    mutationFn: (requestId) => leaveService.approveLeaveRequest(requestId),
    onSuccess: () => {
      message.success("Leave request approved.");
      queryClient.invalidateQueries({ queryKey: ["allLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
    },
    onError: (err) => {
      message.error(`Failed to approve request: ${err.message}`);
    },
  });

  const rejectMutation = useMutation<LeaveRequestDisplay, Error, string>({
    mutationFn: (requestId) => leaveService.rejectLeaveRequest(requestId),
    onSuccess: () => {
      message.success("Leave request rejected.");
      queryClient.invalidateQueries({ queryKey: ["allLeaveRequests"] });
      queryClient.invalidateQueries({ queryKey: ["myLeaveBalance"] });
    },
    onError: (err) => {
      message.error(`Failed to reject request: ${err.message}`);
    },
  });

  const handleRejectWithConfirmation = (requestId: string) => {
    Modal.confirm({
      title: "Are you sure you want to reject this leave request?",
      content: "This action cannot be undone.",
      okText: "Yes, Reject",
      okType: "danger",
      cancelText: "No, Cancel",
      onOk: () => {
        rejectMutation.mutate(requestId);
      },
    });
  };

  const columns: ColumnsType<LeaveRequestDisplay> = [
    {
      title: "Employee",
      dataIndex: "employee_name",
      key: "employee",
      render: (_, record) => (
        <Space>
          <Avatar src={record.employee_avatar_url} icon={<UserOutlined />} />
          <div>
            <Typography.Text>{record.employee_name}</Typography.Text>
            {record.employee_department && (
              <Typography.Text
                type="secondary"
                style={{ display: "block", fontSize: "12px" }}
              >
                {record.employee_department}
              </Typography.Text>
            )}
          </div>
        </Space>
      ),
    },
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
      ellipsis: true,
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
      fixed: "right",
      width: 220,
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <Space>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => approveMutation.mutate(record.id)}
                loading={
                  approveMutation.isPending &&
                  approveMutation.variables === record.id
                }
                size="small"
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleRejectWithConfirmation(record.id)}
                loading={
                  rejectMutation.isPending &&
                  rejectMutation.variables === record.id
                }
                size="small"
              >
                Reject
              </Button>
            </Space>
          );
        }
        return null;
      },
    },
  ];

  return (
    <Card
      variant="borderless"
      style={{ boxShadow: "0 0 10px rgba(0,0,0,0.1)" }}
    >
      <Title level={4} style={{ marginBottom: "20px" }}>
        Manage Leave Requests
      </Title>
      <Table
        columns={columns}
        dataSource={leaveRequests}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: true }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
        }}
      />
    </Card>
  );
};

export default LeaveManagementTable;
