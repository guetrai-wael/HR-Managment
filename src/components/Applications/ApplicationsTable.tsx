import React from "react";
import { Button, Tooltip, Modal } from "antd";
import {
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleFilled,
  MessageOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { IconBuildingSkyscraper } from "@tabler/icons-react"; // Added
import { Application } from "../../types";
import { ApplicationStatusBadge } from "./index";
import UserAvatar from "../common/UserAvatar";
import DataTable from "../common/DataTable"; // Added DataTable import

const { confirm } = Modal;

interface ApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  isAdmin: boolean;
  onViewDetails: (application: Application) => void;
  onViewResume: (url: string | null) => void;
  onViewProfile: (userId: string) => void;
  onAccept: (id: number, applicantName: string) => void;
  onReject: (id: number, applicantName: string) => void;
  onInterview: (id: number, applicantName: string) => void;
  onCancel?: (id: number, applicantName: string) => void;
}

const ApplicationsTable: React.FC<ApplicationsTableProps> = ({
  applications,
  loading,
  isAdmin,
  onViewDetails,
  onAccept,
  onReject,
  onInterview,
  onCancel,
}) => {
  // --- Confirmation Modals ---
  const showConfirm = (
    title: string,
    content: string,
    onOk: () => void,
    okType: "primary" | "danger" = "primary" // Add okType parameter
  ) => {
    confirm({
      title,
      icon: <ExclamationCircleFilled />,
      content,
      okText: "Confirm",
      okType: okType,
      cancelText: "Cancel",
      onOk,
    });
  };

  const allColumns = [
    // Only show applicant column for admin users
    ...(isAdmin
      ? [
          {
            title: "Applicant",
            dataIndex: "profile",
            key: "applicant",
            render: (_value: unknown, record: Application) => (
              <UserAvatar
                src={record.profile?.avatar_url}
                firstName={record.profile?.first_name}
                lastName={record.profile?.last_name}
                email={record.profile?.email}
                showName={true}
                size={32}
                containerClassName="flex items-center space-x-2 py-1"
                nameClassName="font-medium truncate max-w-[150px]"
                emailClassName="text-xs text-gray-500 truncate max-w-[150px]"
              />
            ),
          },
        ]
      : []),
    // Job Title Column
    {
      title: "Job Title",
      dataIndex: "job",
      key: "job_title",
      render: (_value: unknown, record: Application) => (
        <span className="font-medium truncate block max-w-[180px]">
          {record.job?.title || "Unknown Job"}
        </span>
      ),
      width: 200,
      responsive: ["sm" as const],
    },
    // Department Column
    {
      title: "Department",
      dataIndex: "job",
      key: "department",
      render: (_value: unknown, record: Application) => (
        <span className="flex items-center text-sm">
          <IconBuildingSkyscraper size={14} className="mr-1" />
          <span className="truncate max-w-[120px]">
            {record.job?.department?.name || "No Department"}
          </span>
        </span>
      ),
      width: 150,
      responsive: ["md" as const],
    },
    // Date Applied (No change)
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
      responsive: ["md" as const],
    },
    // Status (No change)
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <ApplicationStatusBadge status={status} />,
      width: 120,
    },
    // --- MODIFIED Actions Column ---
    {
      title: "Actions",
      key: "actions",
      width: isAdmin ? 150 : 100, // Adjusted width for employee cancel button
      fixed: "right" as const,
      render: (_value: unknown, record: Application) => {
        const applicantName =
          record.profile?.first_name && record.profile?.last_name
            ? `${record.profile.first_name} ${record.profile.last_name}`
            : record.profile?.first_name ||
              record.profile?.last_name ||
              "this applicant";
        return (
          <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
            {/* View Details Button */}
            <Tooltip title="View Details">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails(record); // Call handler to open modal
                }}
                type="text"
                icon={<EyeOutlined />}
                size="small"
                aria-label="View details"
              />
            </Tooltip>

            {/* View Profile Button REMOVED from here */}

            {/* Accept Button (Admin Only) */}
            {isAdmin &&
              (record.status === "pending" ||
                record.status === "interviewing") && (
                <Tooltip title="Accept Application">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      showConfirm(
                        `Accept ${applicantName}?`,
                        "This will mark the application as accepted.",
                        () => onAccept(record.id, applicantName)
                      );
                    }}
                    type="text"
                    icon={<CheckOutlined style={{ color: "#52c41a" }} />} // Green check
                    size="small"
                    aria-label="Accept application"
                  />
                </Tooltip>
              )}

            {/* Reject Button (Admin Only) */}
            {isAdmin &&
              (record.status === "pending" ||
                record.status === "interviewing") && (
                <Tooltip title="Reject Application">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      showConfirm(
                        `Reject ${applicantName}?`,
                        "This will mark the application as rejected.",
                        () => onReject(record.id, applicantName),
                        "danger" // Set okType to danger for reject confirmation
                      );
                    }}
                    type="text"
                    icon={<CloseOutlined style={{ color: "#ff4d4f" }} />} // Red cross
                    size="small"
                    aria-label="Reject application"
                    danger // Use danger style for reject button tooltip/focus
                  />
                </Tooltip>
              )}

            {/* Interview Button (Admin Only) */}
            {isAdmin && record.status === "pending" && (
              <Tooltip title="Mark as Interviewing">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    showConfirm(
                      `Mark ${applicantName} as Interviewing?`,
                      "This will update the application status.",
                      () => onInterview(record.id, applicantName)
                    );
                  }}
                  type="text"
                  icon={<MessageOutlined style={{ color: "#1890ff" }} />} // Blue message icon
                  size="small"
                  aria-label="Mark as interviewing"
                />
              </Tooltip>
            )}

            {/* Cancel Button (Employee Only for their pending applications) */}
            {!isAdmin && record.status === "pending" && onCancel && (
              <Tooltip title="Cancel Application">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    showConfirm(
                      `Cancel your application for ${record.job?.title}?`,
                      "This action cannot be undone. Your application will be permanently removed.",
                      () => onCancel(record.id, applicantName),
                      "danger"
                    );
                  }}
                  type="text"
                  icon={<DeleteOutlined style={{ color: "#ff4d4f" }} />}
                  size="small"
                  aria-label="Cancel application"
                  danger
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  const columns = allColumns;

  return (
    <DataTable<Application>
      dataSource={applications}
      columns={columns}
      loading={loading}
      rowKey="id"
      tableClassName="applications-table"
      emptyTextDescription="No applications found"
      pagination={{
        // Example of overriding default pagination from DataTable
        // pageSize: 5, // If we wanted a different page size
        showTotal: (total) => `Total ${total} applications`, // Custom total message
      }}
      // scroll and size props will use DataTable defaults or can be overridden here
      // size="middle" // This was on Ant Table, can be passed to DataTable if needed
    />
  );
};

export default ApplicationsTable;
