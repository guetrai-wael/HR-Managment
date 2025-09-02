import React from "react";
import { useNavigate } from "react-router-dom"; // Added useNavigate
import { Button, Descriptions, Divider, Avatar, Typography, Empty } from "antd";
import {
  UserOutlined,
  CalendarOutlined,
  FileOutlined,
  FilePdfOutlined,
} from "@ant-design/icons";
import { Application } from "../../types";
import ApplicationStatusBadge from "./ApplicationStatusBadge";
import { formatDate } from "../../utils/formatDate";
import DetailsModal from "../common/DetailsModal";

const { Title, Text, Paragraph } = Typography;

interface ApplicationDetailsModalProps {
  visible: boolean;
  application: Application | null;
  isAdmin: boolean;
  onClose: () => void;
  onViewResume?: (url: string | null) => void;
  onViewProfile?: (userId: string) => void;
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
}) => {
  const navigate = useNavigate(); // Added useNavigate hook

  if (!application) {
    return null;
  }

  const applicantFullName = application.profile
    ? `${application.profile.first_name || ""} ${
        application.profile.last_name || ""
      }`.trim()
    : "Unknown User";

  return (
    <DetailsModal
      visible={visible} // Corrected: DetailsModal expects 'visible'
      onClose={onClose}
      width={800}
      className="application-details-modal"
      title={`Application Details - ${application.job?.title || "Unknown Job"}`}
      // Default footer (Close button) will be used from DetailsModal
    >
      {/* Check if application exists before trying to render details */}
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
                    {
                      applicantFullName // Use constructed full name
                    }
                  </div>
                  <Text type="secondary">
                    {application.profile?.email || application.user_id}
                  </Text>
                  {/* View Profile Button */}
                  {isAdmin && application.profile && (
                    <Button
                      size="small"
                      type="link"
                      icon={<UserOutlined />}
                      onClick={() =>
                        onViewProfile
                          ? onViewProfile(application.user_id)
                          : navigate(`/employees/${application.user_id}`)
                      }
                      className="p-0 ml-2"
                    >
                      View Profile
                    </Button>
                  )}
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
                {/* Use imported formatDate */}
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
            {application.cover_letter ? (
              <Paragraph className="whitespace-pre-line bg-gray-50 p-4 rounded border border-gray-200 max-h-60 overflow-auto">
                {application.cover_letter}
              </Paragraph>
            ) : (
              <Text type="secondary">No cover letter provided.</Text>
            )}
          </div>

          <Divider className="my-4" />

          {/* Resume Section */}
          <div>
            <Title level={5} className="mb-3">
              <FilePdfOutlined className="mr-2" /> Resume/CV
            </Title>
            {application.resume_url && onViewResume ? (
              <Button
                icon={<FilePdfOutlined />}
                onClick={() => onViewResume(application.resume_url)}
              >
                View Resume
              </Button>
            ) : (
              <Empty
                description="No resume uploaded"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>
      )}
    </DetailsModal>
  );
};

export default ApplicationDetailsModal;
