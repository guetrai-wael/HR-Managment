import React, { useState } from "react";
import { Tooltip, Button } from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
  FilePdfOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Application } from "../../types";
import ConfirmActionModal from "./ConfirmActionModal";

interface ApplicationActionsProps {
  application: Application;
  isAdmin: boolean;
  onViewDetails?: (application: Application) => void;
  onViewResume?: (url: string) => void;
  onViewProfile?: (userId: string) => void;
  onStatusUpdate?: (
    id: number,
    status: "pending" | "accepted" | "rejected" | "interviewing"
  ) => void;
  showLabels?: boolean;
}

/**
 * Component for displaying action icons/buttons for an application
 */
const ApplicationActions: React.FC<ApplicationActionsProps> = ({
  application,
  isAdmin,
  onViewResume,
  onViewProfile,
  onStatusUpdate,
  showLabels = false,
}) => {
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [action, setAction] = useState<"accept" | "reject" | null>(null);
  const [loading, setLoading] = useState(false);

  const handleActionClick = (actionType: "accept" | "reject") => {
    setAction(actionType);
    setConfirmModalVisible(true);
  };

  const handleConfirm = async () => {
    if (!action || !onStatusUpdate) return;

    setLoading(true);
    try {
      const status = action === "accept" ? "accepted" : "rejected";
      await onStatusUpdate(application.id, status as any);
    } finally {
      setLoading(false);
      setConfirmModalVisible(false);
      setAction(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {application.resume_url && onViewResume && (
        <Tooltip title="View Resume">
          <Button
            icon={<FilePdfOutlined />}
            size="small"
            onClick={() => onViewResume(application.resume_url!)}
            type="default"
            className="flex items-center"
          >
            {showLabels && <span>Resume</span>}
          </Button>
        </Tooltip>
      )}

      {isAdmin && (
        <>
          {onViewProfile && (
            <Tooltip title="View Applicant Profile">
              <Button
                icon={<UserOutlined />}
                size="small"
                onClick={() => onViewProfile(application.user_id)}
                type="default"
                className="flex items-center"
              >
                {showLabels && <span>Profile</span>}
              </Button>
            </Tooltip>
          )}

          {application.status?.toLowerCase() === "pending" &&
            onStatusUpdate && (
              <>
                <Tooltip title="Accept Application">
                  <Button
                    icon={<CheckOutlined />}
                    size="small"
                    onClick={() => handleActionClick("accept")}
                    type="primary"
                    className="flex items-center"
                  >
                    {showLabels && <span>Accept</span>}
                  </Button>
                </Tooltip>

                <Tooltip title="Reject Application">
                  <Button
                    icon={<CloseOutlined />}
                    size="small"
                    onClick={() => handleActionClick("reject")}
                    danger
                    className="flex items-center"
                  >
                    {showLabels && <span>Reject</span>}
                  </Button>
                </Tooltip>
              </>
            )}

          {application.status?.toLowerCase() === "accepted" &&
            onStatusUpdate && (
              <Tooltip title="Schedule Interview">
                <Button
                  icon={<MessageOutlined />}
                  size="small"
                  onClick={() => onStatusUpdate(application.id, "interviewing")}
                  type="dashed"
                  className="flex items-center"
                >
                  {showLabels && <span>Interview</span>}
                </Button>
              </Tooltip>
            )}
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmActionModal
        visible={confirmModalVisible}
        title={
          action === "accept" ? "Accept Application" : "Reject Application"
        }
        message={
          action === "accept"
            ? `Are you sure you want to accept the application from ${
                application.profile?.full_name || "this applicant"
              } for ${application.job?.title || "this position"}?`
            : `Are you sure you want to reject the application from ${
                application.profile?.full_name || "this applicant"
              } for ${application.job?.title || "this position"}?`
        }
        confirmButtonText={action === "accept" ? "Accept" : "Reject"}
        confirmButtonDanger={action === "reject"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmModalVisible(false)}
        loading={loading}
      />
    </div>
  );
};

export default ApplicationActions;
