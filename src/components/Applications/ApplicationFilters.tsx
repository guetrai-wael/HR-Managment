import { useState, useEffect } from "react";
import { Form, Input, Select, DatePicker, Button, Drawer } from "antd";
import { FilterOutlined, SearchOutlined } from "@ant-design/icons";
import { fetchJobs } from "../../services/api/jobService";
import { fetchDepartments } from "../../services/api/departmentService";

import { Job } from "../../types";
import { Department } from "../../types/models";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface FilterValues {
  jobId?: number;
  departmentId?: string; // Keep as string if API expects string ID
  status?: string;
  dateRange?: [string, string]; // Assuming date strings are expected
  search?: string;
}

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
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    // Fetch jobs and departments for dropdowns
    const fetchData = async () => {
      try {
        const fetchedJobsResult = await fetchJobs(); // Pass filters if needed, e.g. fetchJobs({})
        setJobs(fetchedJobsResult || []);

        if (isAdmin) {
          const fetchedDepartments = await fetchDepartments();
          setDepartments(fetchedDepartments || []);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      }
    };
    fetchData();
  }, [isAdmin]);

  // Debounced filter change handler
  const handleValuesChange = (
    _changedValues: Partial<FilterValues>,
    allValues: FilterValues
  ) => {
    // Convert date range if present
    const filtersToApply = { ...allValues };
    if (allValues.dateRange && allValues.dateRange.length === 2) {
      filtersToApply.dateRange = [
        allValues.dateRange[0].toString(), // Ensure dates are strings if needed by API
        allValues.dateRange[1].toString(),
      ];
    } else {
      // Ensure dateRange is removed if cleared
      delete filtersToApply.dateRange;
    }

    // Remove empty search string
    if (filtersToApply.search === "") {
      delete filtersToApply.search;
    }

    console.log("Applying filters:", filtersToApply);
    onFilterChange(filtersToApply);
  };

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const filterFormContent = (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      initialValues={defaultValues}
      className="space-y-4"
    >
      {/* Search input */}
      <Form.Item name="search" label="Search Applicant/Job">
        <Input
          placeholder="Search by name, email, or job title"
          prefix={<SearchOutlined />}
          allowClear
        />
      </Form.Item>

      {/* Job filter */}
      <Form.Item name="jobId" label="Job Position">
        <Select placeholder="All Positions" allowClear>
          {jobs.map((job) => (
            <Option key={job.id} value={job.id}>
              {job.title}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {/* Department filter - only for admins */}
      {isAdmin && (
        <Form.Item name="departmentId" label="Department">
          <Select placeholder="All Departments" allowClear>
            {departments.map((dept) => (
              <Option key={dept.id} value={dept.id}>
                {dept.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
      )}

      {/* Status filter - available for all users */}
      <Form.Item name="status" label="Status">
        <Select placeholder="All Statuses" allowClear>
          <Option value="pending">Pending</Option>
          <Option value="accepted">Accepted</Option>
          <Option value="rejected">Rejected</Option>
          <Option value="interviewing">Interviewing</Option>
        </Select>
      </Form.Item>

      {/* Date range filter */}
      <Form.Item name="dateRange" label="Date Range">
        <RangePicker style={{ width: "100%" }} />
      </Form.Item>
    </Form>
  );

  return (
    <>
      {/* Desktop Filters */}
      <div className="hidden md:block bg-white p-4 rounded-lg shadow-sm mb-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Filters</h3>
        {filterFormContent}
      </div>

      {/* Mobile Filter Button */}
      <div className="md:hidden mb-4 flex justify-end">
        <Button icon={<FilterOutlined />} onClick={showDrawer}>
          Filters
        </Button>
      </div>

      {/* Mobile Filter Drawer */}
      <Drawer
        title="Filters"
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={300}
      >
        {filterFormContent}
        <Button type="primary" onClick={closeDrawer} className="mt-4 w-full">
          Apply Filters
        </Button>
      </Drawer>
    </>
  );
};

export default ApplicationFilters;
