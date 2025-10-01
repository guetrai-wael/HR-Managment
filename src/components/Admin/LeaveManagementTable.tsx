// src/components/Admin/LeaveManagementTable.tsx
import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  leaveRequestService,
  leaveApprovalService,
} from "../../services/api/hr";
import { LeaveRequestDisplay } from "../../types/models";
import { formatDateNumeric } from "../../utils/formatDate";
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
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  UserOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
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
  const [selectedReason, setSelectedReason] = useState<{
    visible: boolean;
    reason: string;
    employee: string;
  }>({
    visible: false,
    reason: "",
    employee: "",
  });

  const {
    data: fetchedLeaveRequests,
    isLoading,
    error: queryError,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["allLeaveRequests"],
    queryFn: leaveRequestService.getAllLeaveRequests,
    enabled: !propLeaveRequests, // Only fetch if no props provided
  });

  // Use prop data if provided, otherwise use fetched data
  const leaveRequests = propLeaveRequests || fetchedLeaveRequests;

  // Controlled pagination state
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(10);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [leaveRequests]);

  const paginatedData = React.useMemo(() => {
    if (!leaveRequests) return [];
    const start = (currentPage - 1) * pageSize;
    return leaveRequests.slice(start, start + pageSize);
  }, [leaveRequests, currentPage, pageSize]);

  // Effect to show error message when queryError changes
  useEffect(() => {
    if (queryError) {
      message.error(`Error loading leave requests: ${queryError.message}`);
    }
  }, [queryError]);

  const approveMutation = useMutation<LeaveRequestDisplay, Error, string>({
    mutationFn: (requestId) =>
      leaveApprovalService.approveLeaveRequest(requestId),
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
    mutationFn: (requestId) =>
      leaveApprovalService.rejectLeaveRequest(requestId),
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
      width: 180,
      render: (_, record) => (
        <div className="flex items-center space-x-3">
          <Avatar
            src={record.employee_avatar_url}
            icon={<UserOutlined />}
            size={40}
            style={{
              flexShrink: 0,
              border: "2px solid #f0f0f0",
            }}
          />
          <div className="flex flex-col min-w-0 flex-1">
            <Typography.Text
              strong
              className="text-sm truncate"
              style={{ lineHeight: "1.2" }}
            >
              {record.employee_name}
            </Typography.Text>
            {record.employee_department && (
              <Typography.Text
                type="secondary"
                className="text-xs truncate"
                style={{
                  lineHeight: "1.1",
                  marginTop: "2px",
                }}
              >
                {record.employee_department}
              </Typography.Text>
            )}
          </div>
        </div>
      ),
    },
    {
      title: "Leave Type",
      dataIndex: "leave_type_name",
      key: "leave_type_name",
      width: 120,
      render: (text) => (
        <Typography.Text className="text-sm font-medium">
          {text}
        </Typography.Text>
      ),
    },
    {
      title: "Start Date",
      dataIndex: "start_date",
      key: "start_date",
      width: 100,
      render: (text) => (
        <Typography.Text className="font-mono text-sm">
          {formatDateNumeric(text)}
        </Typography.Text>
      ),
    },
    {
      title: "End Date",
      dataIndex: "end_date",
      key: "end_date",
      width: 100,
      render: (text) => (
        <Typography.Text className="font-mono text-sm">
          {formatDateNumeric(text)}
        </Typography.Text>
      ),
    },
    {
      title: "Duration",
      dataIndex: "duration_days",
      key: "duration_days",
      width: 80,
      align: "center" as const,
      render: (days) => (
        <Typography.Text strong className="text-sm">
          {days} {days === 1 ? "day" : "days"}
        </Typography.Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      align: "center" as const,
      render: (status) => getStatusTag(status),
    },
    {
      title: "Submitted On",
      dataIndex: "created_at",
      key: "created_at",
      width: 100,
      render: (text) => (
        <Typography.Text className="font-mono text-sm">
          {formatDateNumeric(text)}
        </Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 100,
      align: "center" as const,
      render: (_, record) => {
        if (record.status === "pending") {
          return (
            <Space size="small">
              <Tooltip title="View Reason">
                <Button
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() =>
                    setSelectedReason({
                      visible: true,
                      reason: record.reason || "No reason provided",
                      employee: record.employee_name || "Unknown Employee",
                    })
                  }
                  size="small"
                  shape="circle"
                />
              </Tooltip>
              <Tooltip title="Approve">
                <Button
                  type="text"
                  icon={<CheckOutlined style={{ color: "#52c41a" }} />}
                  onClick={() => approveMutation.mutate(record.id)}
                  loading={
                    approveMutation.isPending &&
                    approveMutation.variables === record.id
                  }
                  size="small"
                  shape="circle"
                />
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  type="text"
                  icon={<CloseOutlined style={{ color: "#ff4d4f" }} />}
                  onClick={() => handleRejectWithConfirmation(record.id)}
                  loading={
                    rejectMutation.isPending &&
                    rejectMutation.variables === record.id
                  }
                  size="small"
                  shape="circle"
                />
              </Tooltip>
            </Space>
          );
        }
        return (
          <Tooltip title="View Reason">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() =>
                setSelectedReason({
                  visible: true,
                  reason: record.reason || "No reason provided",
                  employee: record.employee_name || "Unknown Employee",
                })
              }
              size="small"
              shape="circle"
            />
          </Tooltip>
        );
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
        dataSource={paginatedData}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 770 }}
        size="middle"
        className="leave-management-table"
        rowClassName="leave-table-row"
        pagination={{
          current: currentPage,
          pageSize,
          total: (leaveRequests || []).length,
          showSizeChanger: true,
          pageSizeOptions: ["5", "10", "20", "50"],
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} requests`,
          onChange: (page, newPageSize) => {
            setCurrentPage(page);
            if (newPageSize && newPageSize !== pageSize) {
              setPageSize(newPageSize);
            }
          },
        }}
      />

      {/* Reason Modal */}
      <Modal
        title={`Leave Reason - ${selectedReason.employee}`}
        open={selectedReason.visible}
        onCancel={() =>
          setSelectedReason({
            visible: false,
            reason: "",
            employee: "",
          })
        }
        footer={[
          <Button
            key="close"
            onClick={() =>
              setSelectedReason({
                visible: false,
                reason: "",
                employee: "",
              })
            }
          >
            Close
          </Button>,
        ]}
        width={500}
      >
        <div style={{ padding: "16px 0" }}>
          <Typography.Text>{selectedReason.reason}</Typography.Text>
        </div>
      </Modal>
    </Card>
  );
};

export default LeaveManagementTable;
