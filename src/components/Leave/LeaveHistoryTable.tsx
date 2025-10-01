// src/components/Leave/LeaveHistoryTable.tsx
import React, { useState } from "react";
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
  Tooltip,
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
  EyeOutlined,
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

interface LeaveHistoryTableProps {
  leaveRequests?: LeaveRequestDisplay[];
}

const LeaveHistoryTable: React.FC<LeaveHistoryTableProps> = ({
  leaveRequests: propLeaveRequests,
}) => {
  const queryClient = useQueryClient();
  const [selectedReason, setSelectedReason] = useState<{
    visible: boolean;
    reason: string;
    leaveType: string;
  }>({
    visible: false,
    reason: "",
    leaveType: "",
  });

  const {
    data: fetchedLeaveRequests,
    isLoading,
    error,
  } = useQuery<LeaveRequestDisplay[], Error>({
    queryKey: ["myLeaveRequests"],
    queryFn: leaveRequestService.getMyLeaveRequests,
    enabled: !propLeaveRequests, // Only fetch if no props provided
  });

  // Use prop data if provided, otherwise use fetched data
  const leaveRequests = propLeaveRequests || fetchedLeaveRequests;

  // Controlled pagination state to ensure pagination works reliably
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [pageSize, setPageSize] = React.useState<number>(8);

  // Reset page when data changes to avoid empty pages
  React.useEffect(() => {
    setCurrentPage(1);
  }, [leaveRequests]);

  const paginatedData = React.useMemo(() => {
    if (!leaveRequests) return [];
    const start = (currentPage - 1) * pageSize;
    return leaveRequests.slice(start, start + pageSize);
  }, [leaveRequests, currentPage, pageSize]);

  const cancelMutation = useMutation<LeaveRequestDisplay, Error, string>({
    mutationFn: leaveApprovalService.cancelLeaveRequest,
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
      width: 110,
      render: (text) => (
        <Typography.Text className="font-mono text-sm">
          {formatDateNumeric(text)}
        </Typography.Text>
      ),
    },
    {
      title: "Actions",
      key: "actions",
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
                      leaveType: record.leave_type_name || "Leave Request",
                    })
                  }
                  size="small"
                  shape="circle"
                />
              </Tooltip>
              <Tooltip title="Cancel Request">
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancelRequest(record.id)}
                  loading={
                    cancelMutation.isPending &&
                    cancelMutation.variables === record.id
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
                  leaveType: record.leave_type_name || "Leave Request",
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
        dataSource={paginatedData}
        loading={isLoading}
        rowKey="id"
        scroll={{ x: 700 }}
        size="middle"
        className="leave-history-table"
        rowClassName="leave-table-row"
        pagination={{
          current: currentPage,
          pageSize,
          total: (leaveRequests || []).length,
          showSizeChanger: true,
          pageSizeOptions: ["5", "8", "15", "25"],
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
        title={`Leave Reason - ${selectedReason.leaveType}`}
        open={selectedReason.visible}
        onCancel={() =>
          setSelectedReason({
            visible: false,
            reason: "",
            leaveType: "",
          })
        }
        footer={[
          <Button
            key="close"
            onClick={() =>
              setSelectedReason({
                visible: false,
                reason: "",
                leaveType: "",
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

export default LeaveHistoryTable;
