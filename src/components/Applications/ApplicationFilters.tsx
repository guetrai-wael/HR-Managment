import { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Drawer } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { fetchJobs } from "../../services/api/jobService";
import { fetchDepartments } from "../../services/api/departmentService";
import { Job, FilterValues } from "../../types";
import { Department } from "../../types/models";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface ApplicationFiltersProps {
  isAdmin: boolean;
  onFilterChange: (filters: FilterValues) => void;
  defaultValues?: FilterValues;
}

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({
  isAdmin,
  onFilterChange,
  defaultValues = {},
}) => {
  const [form] = Form.useForm<FilterValues>();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false); // Mobile drawer visibility

  // Fetch options for select dropdowns on mount and when admin status changes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedJobsResult = await fetchJobs();
        setJobs(fetchedJobsResult || []);
        if (isAdmin) {
          // Only fetch departments if user is admin
          const fetchedDepartments = await fetchDepartments();
          setDepartments(fetchedDepartments || []);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchData();
  }, [isAdmin]);

  // Prepare initial form values, converting date strings to Dayjs for RangePicker
  const initialFormValues = {
    ...defaultValues,
    dateRange: defaultValues.dateRange
      ? [
          defaultValues.dateRange[0] ? dayjs(defaultValues.dateRange[0]) : null,
          defaultValues.dateRange[1] ? dayjs(defaultValues.dateRange[1]) : null,
        ]
      : undefined,
  };

  // Sync form state if defaultValues change externally (e.g., parent clears filters)
  useEffect(() => {
    if (Object.keys(defaultValues).length === 0) {
      form.resetFields(); // Reset if parent cleared filters
    } else {
      form.setFieldsValue(initialFormValues); // Update form if parent provided new filters
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValues, form]);

  /**
   * Processes form changes, cleans data, converts dates, and notifies parent.
   * @param _changedValues - Specific fields that changed (unused).
   * @param allValues - All current form values (includes Dayjs objects).
   */
  const handleValuesChange = (
    _changedValues: Partial<FilterValues>,
    allValues: FilterValues
  ) => {
    // 1. Copy values to work with
    const cleanedFilters: Partial<FilterValues> = { ...allValues };

    // 2. Remove empty/null values before sending to parent
    Object.keys(cleanedFilters).forEach((key) => {
      const filterKey = key as keyof FilterValues;
      if (
        cleanedFilters[filterKey] === undefined ||
        cleanedFilters[filterKey] === null ||
        cleanedFilters[filterKey] === "" ||
        // Check if dateRange array is effectively empty ([null, null])
        (filterKey === "dateRange" &&
          Array.isArray(cleanedFilters[filterKey]) &&
          (cleanedFilters[filterKey] as (dayjs.Dayjs | null)[]).every(
            (item) => item === null
          ))
      ) {
        delete cleanedFilters[filterKey];
      }
    });

    // 3. Prepare the object for the parent callback
    const filtersForParent: Partial<FilterValues> = { ...cleanedFilters };

    // 4. Convert Dayjs date range back to ISO strings for parent component
    if (
      filtersForParent.dateRange &&
      Array.isArray(filtersForParent.dateRange)
    ) {
      const dateRangeAsDayjs = filtersForParent.dateRange as [
        dayjs.Dayjs | null,
        dayjs.Dayjs | null
      ];
      filtersForParent.dateRange = [
        dateRangeAsDayjs[0] ? dateRangeAsDayjs[0].toISOString() : null,
        dateRangeAsDayjs[1] ? dateRangeAsDayjs[1].toISOString() : null,
      ] as any; // Type assertion needed here or adjust FilterValues
    }

    // 5. Trigger parent callback
    onFilterChange(filtersForParent);
  };

  // Drawer visibility handlers
  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Clears form fields visually and notifies parent
  const clearFilters = () => {
    form.setFieldsValue({
      // Use setFieldsValue for immediate UI update
      search: undefined,
      jobId: undefined,
      departmentId: undefined,
      status: undefined,
      dateRange: undefined,
    });
    onFilterChange({}); // Send empty object to parent
  };

  /**
   * Renders the Form UI, adapting layout based on isInline flag.
   * @param isInline - True for desktop inline layout, false for mobile vertical layout.
   */
  const filterFormContent = (isInline: boolean) => (
    <Form
      form={form}
      layout={isInline ? "inline" : "vertical"} // Dynamic layout
      onValuesChange={handleValuesChange} // Apply filters on any change
      initialValues={initialFormValues} // Set initial state
      className={
        // Apply layout-specific styling
        isInline ? "flex flex-wrap gap-x-4 gap-y-2 items-center" : "space-y-4"
      }
    >
      {/* Search Input */}
      <Form.Item name="search" label={isInline ? null : "Search Applicant/Job"}>
        <Input
          placeholder="Search name, email, job..."
          prefix={<SearchOutlined />}
          allowClear
          style={{ minWidth: isInline ? "200px" : "100%" }}
        />
      </Form.Item>

      {/* Job Filter */}
      <Form.Item name="jobId" label={isInline ? null : "Job Position"}>
        <Select
          placeholder="All Positions"
          allowClear
          style={{ minWidth: isInline ? "180px" : "100%" }}
        >
          {jobs.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Department Filter (Admin Only) */}
      {isAdmin && (
        <Form.Item name="departmentId" label={isInline ? null : "Department"}>
          <Select
            placeholder="All Departments"
            allowClear
            style={{ minWidth: isInline ? "180px" : "100%" }}
          >
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>
                {dept.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/* Status Filter */}
      <Form.Item name="status" label={isInline ? null : "Status"}>
        <Select
          placeholder="All Statuses"
          allowClear
          style={{ minWidth: isInline ? "150px" : "100%" }}
        >
          <Option value="pending">Pending</Option>
          <Option value="accepted">Accepted</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="interviewing">Interviewing</Option>
        </Select>
      </Form.Item>

      {/* Date Range Filter */}
      <Form.Item name="dateRange" label={isInline ? null : "Date Range"}>
        <RangePicker style={{ width: isInline ? "auto" : "100%" }} />
      </Form.Item>

      {/* Clear Button (Desktop Only) */}
      {isInline && (
        <Form.Item>
          <Button onClick={clearFilters}>Clear</Button>
        </Form.Item>
      )}
    </Form>
  );

  return (
    <>
      {/* Desktop: Inline filters, hidden on mobile */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        {filterFormContent(true)}
      </div>

      {/* Mobile: Filter button to open drawer, hidden on desktop */}
      <div className="md:hidden mb-4 flex justify-end">
        <Button icon={<FilterOutlined />} onClick={showDrawer}>
          Filters
        </Button>
      </div>

      {/* Mobile: Drawer containing vertical filters */}
      <Drawer
        title="Filters"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={300}
        footer={
          // Standard drawer footer actions
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => {
                clearFilters();
                closeDrawer();
              }}
              style={{ marginRight: 8 }}
            >
              Clear
            </Button>
            {/* Apply button just closes drawer as filters apply on change */}
            <Button type="primary" onClick={closeDrawer}>
              Apply Filters
            </Button>
          </div>
        }
      >
        {filterFormContent(false)}
      </Drawer>
    </>
  );
};

export default ApplicationFilters;
