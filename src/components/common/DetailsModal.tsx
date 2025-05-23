import React from "react";
import { Modal, Button } from "antd";

interface DetailsModalProps {
  title: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  width?: number;
  footer?: React.ReactNode[] | null; // To allow custom footer, or pass null for no footer
  children: React.ReactNode;
  className?: string;
}

const DetailsModal: React.FC<DetailsModalProps> = ({
  title,
  visible,
  onClose,
  width = 800, // Default width
  footer,
  children,
  className,
}) => {
  const defaultFooter = [
    <Button key="close" onClick={onClose}>
      Close
    </Button>,
  ];

  const modalFooter = footer === undefined ? defaultFooter : footer;

  return (
    <Modal
      title={title}
      open={visible} // Ant Design v5 uses 'open' instead of 'visible'
      onCancel={onClose}
      width={width}
      footer={modalFooter}
      className={className}
    >
      {children}
    </Modal>
  );
};

export default DetailsModal;
