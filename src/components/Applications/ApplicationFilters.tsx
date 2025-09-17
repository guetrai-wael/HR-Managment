import { useEffect } from "react";
import { Form, DatePicker, Button } from "antd";
// Removed Input, Select, Drawer, FilterOutlined, SearchOutlined, ClearOutlined
import { useQuery } from "@tanstack/react-query";
import { jobService } from "../../services/api/recruitment/jobService";
import { departmentService } from "../../services/api/admin/departmentService";
import { Job, FilterValues } from "../../types";
import { Department } from "../../types/models";
import dayjs, { Dayjs } from "dayjs";
import {
  SearchFilterInput,
  SimpleSelectFilter,
  DataDrivenSelectFilter,
  MobileFilterWrapper,
} from "../common/FilterFields"; // Import new components

// const { Option } = Select; // No longer needed
const { RangePicker } = DatePicker;

interface ApplicationFiltersProps {
  isAdmin: boolean;
  onFilterChange: (filters: FilterValues) => void;
  defaultValues?: FilterValues;
  disabled?: boolean; // Added disabled prop
}

interface FormInternalFilterValues {
  jobId?: number;
  departmentId?: number | "all";
  status?: string;
  dateRange?: [Dayjs | null, Dayjs | null];
  search?: string;
}

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  isAdmin,
  onFilterChange,
  defaultValues = {},
  disabled = false, // Added disabled prop with default value
}) => {
  const [form] = Form.useForm<FormInternalFilterValues>();
  // const [drawerVisible, setDrawerVisible] = useState(false); // Managed by MobileFilterWrapper

  const {
    data: jobs = [],
    error: jobsError,
    isLoading: isLoadingJobs,
  } = useQuery<Job[], Error>({
    queryKey: ["jobsListForFilters"],
    queryFn: () => jobService.getAll(),
  });

  const {
    data: departments = [],
    error: departmentsError,
    isLoading: isLoadingDepartments,
  } = useQuery<Department[], Error>({
    queryKey: ["departmentsListForFilters"],
    queryFn: () => departmentService.getAll(),
    enabled: isAdmin,
  });

  useEffect(() => {
    if (jobsError) {
      console.error("Error fetching jobs for filters:", jobsError);
    }
  }, [jobsError]);

  useEffect(() => {
    if (departmentsError) {
      console.error(
        "Error fetching departments for filters:",
        departmentsError
      );
    }
  }, [departmentsError]);

  const initialFormValues: FormInternalFilterValues = {
    search: defaultValues.search,
    jobId: defaultValues.jobId,
    departmentId: defaultValues.departmentId,
    status: defaultValues.status,
    dateRange: defaultValues.dateRange
      ? [
          defaultValues.dateRange[0] ? dayjs(defaultValues.dateRange[0]) : null,
          defaultValues.dateRange[1] ? dayjs(defaultValues.dateRange[1]) : null,
        ]
      : undefined,
  };

  useEffect(() => {
    if (Object.keys(defaultValues).length === 0) {
      form.resetFields();
    } else {
      form.setFieldsValue({
        search: defaultValues.search,
        jobId: defaultValues.jobId,
        departmentId: defaultValues.departmentId,
        status: defaultValues.status,
        dateRange: defaultValues.dateRange
          ? [
              defaultValues.dateRange[0]
                ? dayjs(defaultValues.dateRange[0])
                : null,
              defaultValues.dateRange[1]
                ? dayjs(defaultValues.dateRange[1])
                : null,
            ]
          : undefined,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues]); // Removed form from dependencies as it can cause infinite loops

  const handleFormChange = (
    _: Partial<FormInternalFilterValues>, // changedValues is not used
    allValues: FormInternalFilterValues
  ) => {
    const formattedFilters: FilterValues = {
      ...allValues,
      dateRange: allValues.dateRange
        ? [
            allValues.dateRange[0]?.format("YYYY-MM-DD") || null,
            allValues.dateRange[1]?.format("YYYY-MM-DD") || null,
          ]
        : undefined,
    };
    onFilterChange(formattedFilters);
  };

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "interviewing", label: "Interviewing" },
    { value: "accepted", label: "Accepted" },
    { value: "rejected", label: "Rejected" },
  ];

  const renderDesktopFilters = () => (
    <div className="hidden lg:block">
      <Form
        form={form}
        layout="inline"
        onValuesChange={handleFormChange}
        initialValues={initialFormValues}
        className="flex flex-wrap gap-4 items-center"
      >
        {isAdmin && (
          <SearchFilterInput
            name="search"
            label="Search Applicants"
            placeholder="Search by name or email..."
            disabled={disabled}
          />
        )}

        <DataDrivenSelectFilter
          name="jobId"
          label="Job Title"
          placeholder="All Jobs"
          data={jobs}
          valueKey="id"
          labelKey="title"
          loading={isLoadingJobs}
          disabled={disabled || !!jobsError}
        />

        <DataDrivenSelectFilter
          name="departmentId"
          label="Department"
          placeholder="All Departments"
          data={departments}
          valueKey="id"
          labelKey="name"
          loading={isLoadingDepartments}
          disabled={disabled || !!departmentsError}
        />

        <SimpleSelectFilter
          name="status"
          label="Status"
          placeholder="Any Status"
          options={statusOptions}
          disabled={disabled}
        />

        <Form.Item
          name="dateRange"
          label="Date Applied"
          className="min-w-[280px]"
        >
          <RangePicker className="w-full" disabled={disabled} />
        </Form.Item>
      </Form>
    </div>
  );

  const renderMobileFilters = ({
    closeDrawer,
  }: {
    closeDrawer: () => void;
  }) => (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleFormChange}
      initialValues={initialFormValues}
    >
      {isAdmin && (
        <SearchFilterInput
          name="search"
          label="Search Applicants"
          placeholder="Search by name or email..."
          disabled={disabled}
          className="w-full" // Ensure full width in drawer
        />
      )}

      <DataDrivenSelectFilter
        name="jobId"
        label="Job Title"
        placeholder="All Jobs"
        data={jobs}
        valueKey="id"
        labelKey="title"
        loading={isLoadingJobs}
        disabled={disabled || !!jobsError}
        className="w-full" // Ensure full width in drawer
      />

      <DataDrivenSelectFilter
        name="departmentId"
        label="Department"
        placeholder="All Departments"
        data={departments}
        valueKey="id"
        labelKey="name"
        loading={isLoadingDepartments}
        disabled={disabled || !!departmentsError}
        className="w-full" // Ensure full width in drawer
      />

      <SimpleSelectFilter
        name="status"
        label="Status"
        placeholder="Any Status"
        options={statusOptions}
        disabled={disabled}
        className="w-full" // Ensure full width in drawer
      />

      <Form.Item name="dateRange" label="Date Applied" className="w-full">
        <RangePicker className="w-full" disabled={disabled} />
      </Form.Item>

      <Button
        type="primary"
        onClick={closeDrawer} // Use closeDrawer from props
        block
        className="mt-2"
      >
        Done
      </Button>
    </Form>
  );

  return (
    <div className="mb-2">
      {renderDesktopFilters()}
      <MobileFilterWrapper
        drawerTitle="Filter Applications"
        isLoading={disabled} // Pass overall disabled state
      >
        {({ closeDrawer }) => renderMobileFilters({ closeDrawer })}
      </MobileFilterWrapper>
    </div>
  );
};

export default ApplicationFilters;
