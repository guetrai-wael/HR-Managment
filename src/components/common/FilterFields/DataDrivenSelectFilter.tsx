// src/components/common/FilterFields/DataDrivenSelectFilter.tsx
import { Form, Select } from "antd";

const { Option } = Select;

interface DataDrivenSelectFilterProps<T = unknown> {
  name: string;
  label: string;
  placeholder: string;
  disabled?: boolean;
  loading?: boolean;
  data: T[];
  valueKey: keyof T;
  labelKey: keyof T;
  className?: string; // For Form.Item
  selectClassName?: string; // For Select
  allowClear?: boolean;
}

export const DataDrivenSelectFilter = <T = unknown,>({
  name,
  label,
  placeholder,
  disabled,
  loading,
  data,
  valueKey,
  labelKey,
  className = "min-w-[180px]",
  selectClassName = "w-full",
  allowClear = true,
}: DataDrivenSelectFilterProps<T>) => {
  return (
    <Form.Item name={name} label={label} className={className}>
      <Select
        placeholder={placeholder}
        allowClear={allowClear}
        disabled={disabled || loading} // Often disable if loading
        loading={loading}
        className={selectClassName}
        style={{ width: "100%" }}
      >
        {(data || []).map((item) => (
          <Option key={String(item[valueKey])} value={item[valueKey]}>
            {String(item[labelKey])}
          </Option>
        ))}
      </Select>
    </Form.Item>
  );
};
