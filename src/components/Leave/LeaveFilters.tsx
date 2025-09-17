import { useEffect, useMemo } from "react";
import { Form, DatePicker, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { leaveTypeService } from "../../services/api/hr";
import { LeaveType } from "../../types/models";
import dayjs, { Dayjs } from "dayjs";
import {
  SearchFilterInput,
  SimpleSelectFilter,
  DataDrivenSelectFilter,
  MobileFilterWrapper,
} from "../common/FilterFields";

const { RangePicker } = DatePicker;

interface LeaveFilterValues {
  leaveTypeId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

interface LeaveFiltersProps {
  isAdmin: boolean;
  onFilterChange: (filters: LeaveFilterValues) => void;
  defaultValues?: LeaveFilterValues;
  disabled?: boolean;
}

interface FormInternalFilterValues {
  leaveTypeId?: number;
  status?: string;
  dateRange?: [Dayjs | null, Dayjs | null];
  search?: string;
}

const LeaveFilters: React.FC<LeaveFiltersProps> = ({
  isAdmin,
  onFilterChange,
  defaultValues = {},
  disabled = false,
}) => {
  const [form] = Form.useForm<FormInternalFilterValues>();

  const {
    data: leaveTypes = [],
    error: leaveTypesError,
    isLoading: isLoadingLeaveTypes,
  } = useQuery<LeaveType[], Error>({
    queryKey: ["leaveTypes"],
    queryFn: leaveTypeService.getLeaveTypes,
  });

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const initialFormValues: FormInternalFilterValues = useMemo(
    () => ({
      leaveTypeId: defaultValues.leaveTypeId,
      status: defaultValues.status,
      dateRange:
        defaultValues.startDate && defaultValues.endDate
          ? [dayjs(defaultValues.startDate), dayjs(defaultValues.endDate)]
          : undefined,
      search: defaultValues.search,
    }),
    [defaultValues]
  );

  useEffect(() => {
    if (Object.keys(defaultValues).length > 0) {
      form.setFieldsValue(initialFormValues);
    }
  }, [defaultValues, form, initialFormValues]);

  const handleFormChange = (
    _: unknown,
    allValues: FormInternalFilterValues
  ) => {
    const filters: LeaveFilterValues = {};

    if (allValues.leaveTypeId) {
      filters.leaveTypeId = allValues.leaveTypeId;
    }

    if (allValues.status) {
      filters.status = allValues.status;
    }

    if (allValues.search && isAdmin) {
      filters.search = allValues.search;
    }

    if (
      allValues.dateRange &&
      allValues.dateRange[0] &&
      allValues.dateRange[1]
    ) {
      filters.startDate = allValues.dateRange[0].toISOString();
      filters.endDate = allValues.dateRange[1].toISOString();
    }

    onFilterChange(filters);
  };

  const renderFiltersContent = (isDrawer = false, closeDrawer?: () => void) => (
    <Form
      form={form}
      layout={isDrawer ? "vertical" : "inline"}
      onValuesChange={handleFormChange}
      initialValues={initialFormValues}
      className={isDrawer ? "" : "flex flex-wrap gap-4 items-center"}
    >
      {isAdmin && (
        <SearchFilterInput
          name="search"
          label="Search Employees"
          placeholder="Search by employee name..."
          disabled={disabled}
          className={isDrawer ? "w-full" : ""}
        />
      )}

      <DataDrivenSelectFilter
        name="leaveTypeId"
        label="Leave Type"
        placeholder="All Leave Types"
        data={leaveTypes}
        valueKey="id"
        labelKey="name"
        loading={isLoadingLeaveTypes}
        disabled={disabled || !!leaveTypesError}
        className={isDrawer ? "w-full" : ""}
      />

      <SimpleSelectFilter
        name="status"
        label="Status"
        placeholder="Any Status"
        options={statusOptions}
        disabled={disabled}
        className={isDrawer ? "w-full" : ""}
      />

      <Form.Item
        name="dateRange"
        label="Date Range"
        className={isDrawer ? "w-full" : ""}
      >
        <RangePicker
          className={isDrawer ? "w-full" : ""}
          disabled={disabled}
          placeholder={["Start Date", "End Date"]}
        />
      </Form.Item>

      {isDrawer && closeDrawer && (
        <div className="flex gap-2 mt-4">
          <Button type="primary" onClick={closeDrawer} block className="flex-1">
            Apply Filters
          </Button>
        </div>
      )}
    </Form>
  );

  return (
    <div className="mb-6">
      {/* Desktop Filters */}
      <div className="hidden lg:block">{renderFiltersContent(false)}</div>

      {/* Mobile Filters */}
      <MobileFilterWrapper
        drawerTitle="Filter Leave Requests"
        isLoading={disabled}
      >
        {({ closeDrawer }) => renderFiltersContent(true, closeDrawer)}
      </MobileFilterWrapper>
    </div>
  );
};

export default LeaveFilters;
