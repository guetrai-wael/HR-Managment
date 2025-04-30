import React from "react";
import { Table, Button, Tooltip, Empty, Avatar } from "antd";
import {
  EyeOutlined,
  FilePdfOutlined,
  UserOutlined,
  MailOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import { Application } from "../../types";
import { ApplicationStatusBadge } from "./index";

interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  isAdmin: boolean;
  onViewDetails: (application: Application) => void;
  onViewResume: (url: string) => void;
  onViewProfile: (userId: string) => void;
  onStatusUpdate?: (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => void;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  isAdmin,
  onViewDetails,
  onViewResume,
  onViewProfile,
}) => {
  const columns = [
    // Applicant Information (with avatar)
    {
      title: "Applicant",
      dataIndex: "profile",
      key: "applicant",
      render: (_, record: Application) => (
        <div className="flex items-center space-x-3">
          {isAdmin && (
            <Avatar
              src={record.profile?.avatar_url}
              icon={<UserOutlined />}
              className="flex-shrink-0"
            />
          )}
          <div className="flex flex-col overflow-hidden">
            <span className="font-medium truncate max-w-[180px]">
              {record.profile?.full_name || "Unknown User"}
            </span>
            {isAdmin && (
              <span className="text-xs text-gray-500 truncate max-w-[180px]">
                {record.profile?.email}
              </span>
            )}
          </div>
        </div>
      ),
    },

    // Job Information - FIXED MISSING IMPLEMENTATION
    {
      title: "Job Position",
      dataIndex: "job",
      key: "job_title",
      render: (_, record: Application) => (
        <div className="flex flex-col">
          <span className="truncate block max-w-[200px] font-medium">
            {record.job?.title || "Unknown Job"}
          </span>
          <span className="text-xs text-gray-500 flex items-center">
            <EnvironmentOutlined className="mr-1" />
            {record.job?.department?.name || "No Department"}
          </span>
        </div>
      ),
      responsive: ["sm"],
    },

    // Application Date - FIXED MISSING IMPLEMENTATION
    {
      title: "Date Applied",
      dataIndex: "applied_at",
      key: "applied_at",
      render: (date: string) => (
        <span className="whitespace-nowrap">
          {new Date(date).toLocaleDateString()}
        </span>
      ),
      width: 110,
      responsive: ["md"],
    },

    // Status
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <ApplicationStatusBadge status={status} />,
      width: 120,
    },

    // Actions - FIXED MISSING IMPLEMENTATION
    {
      title: "Actions",
      key: "actions",
      width: 140,
      render: (_, record: Application) => (
        <div className="flex flex-wrap gap-2">
          <Tooltip title="View Details">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails(record);
              }}
              type="text"
              icon={<EyeOutlined />}
              size="small"
              aria-label="View details"
            />
          </Tooltip>

          {record.resume_url && (
            <Tooltip title="View Resume">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewResume(record.resume_url as string);
                }}
                type="text"
                icon={<FilePdfOutlined />}
                size="small"
                aria-label="View resume"
              />
            </Tooltip>
          )}

          {isAdmin && (
            <Tooltip title="View Profile">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewProfile(record.user_id);
                }}
                type="text"
                icon={<MailOutlined />}
                size="small"
                aria-label="View profile"
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="applications-table-wrapper overflow-hidden">
      <Table
        dataSource={applications}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          hideOnSinglePage: applications.length <= 10,
          showTotal: (total) => `Total ${total} applications`,
          responsive: true,
        }}
        className="applications-table"
        scroll={{ x: "max-content" }}
        size="middle"
        locale={{
          emptyText: (
            <Empty
              description="No applications found"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ),
        }}
        onRow={(record) => ({
          onClick: () => onViewDetails(record),
          style: { cursor: "pointer" },
        })}
      />
    </div>
  );
};

export default ApplicationsTable;
