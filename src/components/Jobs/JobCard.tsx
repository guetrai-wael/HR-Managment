import React from "react";
import { Divider, Button, Tooltip } from "antd";
import {
  FireFilled,
  StarFilled,
  HeartFilled,
  ClockCircleOutlined,
  SendOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";
import { JobCardProps } from "../../types";

const JobCard: React.FC<JobCardProps> = ({
  title,
  description,
  status,
  deadline,
  icon = "hot",
  onClick,
  onActionClick,
  actionText = "View Details",
  // New action handlers
  onApplyClick,
  onEditClick,
  onDeleteClick,
  // Visibility controls with sensible defaults
  showApplyButton = true,
  showEditButton,
  showDeleteButton,
}) => {
  // Icon mapping
  const iconMap = {
    hot: <FireFilled style={{ color: "#6068CA" }} />,
    star: <StarFilled style={{ color: "#7F56D9" }} />,
    featured: <HeartFilled style={{ color: "#7F56D9" }} />,
  };

  // Status badge color mapping
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open":
        return { bg: "#ECFDF3", text: "#027A48" };
      case "new":
        return { bg: "#EFF8FF", text: "#175CD3" };
      case "featured":
        return { bg: "#FFF6ED", text: "#B93815" };
      default:
        return { bg: "#F9F5FF", text: "#6941C6" };
    }
  };

  const statusColor = status ? getStatusColor(status) : undefined;

  // Format deadline date and calculate days remaining
  const formatDeadline = (deadline: string | Date | undefined) => {
    if (!deadline) return { formatted: null, daysLeft: null };

    const deadlineDate =
      deadline instanceof Date ? deadline : new Date(deadline);

    // Check if valid date
    if (isNaN(deadlineDate.getTime()))
      return { formatted: null, daysLeft: null };

    const today = new Date();
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      formatted: deadlineDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      daysLeft: diffDays,
    };
  };

  const { formatted: formattedDeadline, daysLeft } = formatDeadline(deadline);

  return (
    <div
      className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden h-full border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
      style={{ minHeight: "260px" }}
      onClick={onClick}
    >
      {/* Card Content */}
      <div className="flex flex-col p-4 pb-0 gap-3 flex-grow">
        {/* Header with icon and title */}
        <div className="job-card-header flex justify-between items-center w-full">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 pr-2">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex-shrink-0 flex items-center justify-center bg-gradient-to-r from-[#29359B] to-[#6068CA]">
              {iconMap[icon]}
            </div>
            <h3 className="job-card-title text-base font-medium text-gray-900 truncate">
              {title}
            </h3>
          </div>

          {/* Action icons with guaranteed space */}
          <div className="job-card-actions flex-shrink-0 ml-2">
            {showEditButton && (
              <Tooltip title="Edit job">
                <Button
                  type="text"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick?.();
                  }}
                  className="text-gray-500 hover:text-blue-500"
                />
              </Tooltip>
            )}
            {showDeleteButton && (
              <Tooltip title="Delete job">
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteClick?.();
                  }}
                  className="text-gray-500 hover:text-red-500"
                />
              </Tooltip>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-500 line-clamp-3">{description}</p>

        {/* Deadline - Complete version with days remaining */}
        {formattedDeadline && (
          <div className="flex items-center justify-between text-sm text-gray-500 mt-1">
            <div className="flex items-center">
              <ClockCircleOutlined
                className="mr-1.5"
                style={{ fontSize: "12px" }}
              />
              <span>Apply by: {formattedDeadline}</span>
            </div>
            {daysLeft !== null && daysLeft >= 0 && (
              <span
                className={`text-xs ${
                  daysLeft <= 3 ? "text-red-500 font-medium" : ""
                }`}
              >
                {daysLeft === 0
                  ? "Last day"
                  : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left`}
              </span>
            )}
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <div className="flex mt-auto mb-3">
            <span
              className="px-2 py-0.5 text-xs font-medium rounded-full"
              style={{
                backgroundColor: statusColor?.bg,
                color: statusColor?.text,
              }}
            >
              {status}
            </span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-auto">
        <Divider className="!m-0" />
        <div className="flex flex-wrap justify-between items-center px-4 py-3 gap-2">
          {/* View Details Action */}
          <Button
            type="link"
            className="p-0 h-5 text-[#6941C6] hover:text-[#8662e3]"
            onClick={(e) => {
              e.stopPropagation();
              onActionClick?.();
            }}
          >
            {actionText}
          </Button>

          {/* Apply Button (usually for regular users) */}
          {showApplyButton && (
            <Tooltip title="Apply for this job">
              <Button
                type="primary"
                icon={<SendOutlined />}
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onApplyClick?.();
                }}
                className="bg-[#6941C6] hover:bg-[#8662e3]"
              >
                <span className="hidden sm:inline">Apply</span>
              </Button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
