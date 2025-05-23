// src/components/common/FilterFields/ResetFilterButton.tsx
import { Button, Form } from "antd";
import { ClearOutlined } from "@ant-design/icons";
import React from "react";

interface ResetFilterButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isDrawerButton?: boolean; // To handle 'block' and 'className' differences
  text?: string;
}

export const ResetFilterButton: React.FC<ResetFilterButtonProps> = ({
  onClick,
  disabled,
  isDrawerButton = false,
  text = "Reset",
}) => {
  return (
    <Form.Item className={isDrawerButton ? "mt-4" : ""}>
      <Button
        onClick={onClick}
        disabled={disabled}
        icon={<ClearOutlined />}
        block={isDrawerButton}
      >
        {text}
      </Button>
    </Form.Item>
  );
};
