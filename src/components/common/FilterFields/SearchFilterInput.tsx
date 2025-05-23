// src/components/common/FilterFields/SearchFilterInput.tsx
import { Form, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import React from "react";

interface SearchFilterInputProps {
  name: string;
  label: string;
  placeholder: string;
  disabled?: boolean;
  className?: string; // For Form.Item
  inputClassName?: string; // For Input if needed
}

export const SearchFilterInput: React.FC<SearchFilterInputProps> = ({
  name,
  label,
  placeholder,
  disabled,
  className = "flex-grow min-w-[200px]",
}) => {
  return (
    <Form.Item name={name} label={label} className={className}>
      <Input
        placeholder={placeholder}
        prefix={<SearchOutlined />}
        allowClear
        disabled={disabled}
      />
    </Form.Item>
  );
};
