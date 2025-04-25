import React from "react";
import { Modal, Button } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";

interface ConfirmActionModalProps {
  visible: boolean;
  title: string;
  message: React.ReactNode;
  confirmButtonText: string;
  confirmButtonType?:
    | "primary"
    | "default"
    | "dashed"
    | "link"
    | "text"
    | undefined;
  confirmButtonDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * Reusable confirmation modal for actions that need confirmation
 */
const ConfirmActionModal: React.FC<ConfirmActionModalProps> = ({
  visible,
  title,
  message,
  confirmButtonText,
  confirmButtonType = "primary",
  confirmButtonDanger = false,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <QuestionCircleOutlined className="text-yellow-500" />
          <span>{title}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="confirm"
          type={confirmButtonType}
          danger={confirmButtonDanger}
          onClick={onConfirm}
          loading={loading}
        >
          {confirmButtonText}
        </Button>,
      ]}
    >
      <div className="py-2">{message}</div>
    </Modal>
  );
};

export default ConfirmActionModal;
