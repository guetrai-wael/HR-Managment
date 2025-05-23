// src/components/common/FilterFields/SimpleSelectFilter.tsx
import { Form, Select } from "antd";
import React from "react";

const { Option } = Select;

interface SelectOption {
  value: string | number;
  label: string;
}

interface SimpleSelectFilterProps {
  name: string;
  label: string;
  placeholder: string;
  disabled?: boolean;
  options: SelectOption[];
  className?: string; // For Form.Item
  selectClassName?: string; // For Select
  allowClear?: boolean;
}

export const SimpleSelectFilter: React.FC<SimpleSelectFilterProps> = ({
  name,
  label,
  placeholder,
  disabled,
  options,
  className = "min-w-[150px]",
  selectClassName = "w-full",
  allowClear = true,
}) => {
  return (
    <Form.Item name={name} label={label} className={className}>
      <Select
        placeholder={placeholder}
        allowClear={allowClear}
        disabled={disabled}
        className={selectClassName}
        style={{ width: "100%" }} // Explicitly set for consistency
      >
        {options.map((opt) => (
          <Option key={opt.value} value={opt.value}>
            {opt.label}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};
