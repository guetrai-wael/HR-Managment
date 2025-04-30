import React from "react";
import { Modal, Button, Descriptions, Divider, Avatar, Typography } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { Application } from "../../types";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import ApplicationActions from "./ApplicationActions";

const { Title, Text } = Typography;

interface ApplicationDetailsModalProps {
  visible: boolean;
  application: Application | null;
  isAdmin: boolean;
  onClose: () => void;
  onViewResume?: (url: string) => void;
  onViewProfile?: (userId: string) => void;
  onStatusUpdate?: (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => void;
}

/**
 * Modal to display application details
 */
const ApplicationDetailsModal: React.FC<ApplicationDetailsModalProps> = ({
  visible,
  application,
  isAdmin,
  onClose,
  onViewResume,
  onViewProfile,
  onStatusUpdate,
}) => {
  if (!application) {
    return null;
  }

  // Format date for better readability
  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      className="application-details-modal"
    >
      {application && (
        <div className="space-y-6">
          {/* Applicant Information (Admin Only) */}
          {isAdmin && application.profile && (
            <div>
              <Title level={5} className="mb-3">
                <UserOutlined className="mr-2" /> Applicant Information
              </Title>
              <div className="flex items-center mb-4">
                <Avatar
                  size={64}
                  src={application.profile?.avatar_url}
                  icon={<UserOutlined />}
                />
                <div className="ml-4">
                  <div className="text-lg font-medium">
                    {application.profile?.full_name || "Unknown User"}
                  </div>
                  <Text type="secondary">
                    {application.profile?.email || application.user_id}
                  </Text>
                </div>
              </div>
              <Divider className="my-4" />
            </div>
          )}

          {/* Application Details */}
          <div>
            <Title level={5} className="mb-3">
              <CalendarOutlined className="mr-2" /> Application Details
            </Title>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Position">
                {application.job?.title || "Unknown Position"}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {application.job?.department?.name || "Not specified"}
              </Descriptions.Item>
              <Descriptions.Item label="Applied On">
                {formatDate(application.applied_at)}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <ApplicationStatusBadge status={application.status} />
              </Descriptions.Item>
            </Descriptions>
          </div>

          <Divider className="my-4" />

          {/* Cover Letter */}
          <div>
            <Title level={5} className="mb-3">
              <FileOutlined className="mr-2" /> Cover Letter
            </Title>
            <div className="bg-gray-50 p-4 rounded-md whitespace-pre-line max-h-60 overflow-auto border border-gray-200">
              {application.cover_letter || "No cover letter provided."}
            </div>
          </div>

          <Divider className="my-4" />

          {/* Actions */}
          {isAdmin && (
            <div className="flex justify-end">
              <ApplicationActions
                application={application}
                isAdmin={isAdmin}
                onViewResume={onViewResume}
                onViewProfile={onViewProfile}
                onStatusUpdate={onStatusUpdate}
                showLabels={true}
              />
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ApplicationDetailsModal;
