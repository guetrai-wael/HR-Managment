import React, { useState, useEffect } from "react";
import { Form, Select, DatePicker, Input, Button, Divider } from "antd";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
import { fetchDepartments } from "../../services/api/index";
import { fetchJobs } from "../../services/api/jobService";
import { Department, Job } from "../../types";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface FilterValues {
  jobId?: number;
  departmentId?: string;
  status?: string;
  dateRange?: [string, string];
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
  const [form] = Form.useForm();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load departments
        const depts = await fetchDepartments();
        setDepartments(depts);

        // Load jobs if admin
        if (isAdmin) {
          const jobsData = await fetchJobs();
          setJobs(jobsData);
        }
      } catch (error) {
        console.error("Failed to load filter data:", error);
      }
    };

    loadData();
  }, [isAdmin]);

  const handleValuesChange = (_: any, allValues: FilterValues) => {
    onFilterChange(allValues);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Keep search values in sync across filter toggle
  useEffect(() => {
    const searchValue = form.getFieldValue("search");
    if (searchValue) {
      form.setFieldsValue({ search: searchValue });
    }
  }, [showFilters, form]);

  return (
    <div className="application-filters-container mb-6">
      {/* Mobile search and filter toggle */}
      <div className="flex items-center gap-2 mb-3 md:hidden">
        <Form
          form={form}
          onValuesChange={handleValuesChange}
          initialValues={defaultValues}
          className="flex-1"
        >
          <Form.Item name="search" noStyle>
            <Input
              placeholder="Search by name or email..."
              suffix={<SearchOutlined />}
              allowClear
              className="w-full"
            />
          </Form.Item>
        </Form>
        <Button
          type="default"
          icon={<FilterOutlined />}
          onClick={toggleFilters}
          aria-label="Toggle filters"
        />
      </div>

      {/* Desktop filters or expanded mobile filters */}
      <div className={showFilters ? "block" : "hidden md:block"}>
        <Form
          layout="horizontal"
          className="application-filters"
          form={form}
          onValuesChange={handleValuesChange}
          initialValues={defaultValues}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Job filter - available for all users */}
            <Form.Item name="jobId" label="Job">
              <Select
                placeholder="All Jobs"
                allowClear
                showSearch
                optionFilterProp="children"
              >
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
              <RangePicker className="w-full" allowClear />
            </Form.Item>

            {/* Search field - hidden on mobile because we have a separate one above */}
            <Form.Item name="search" label="Search" className="hidden md:block">
              <Input
                placeholder="Search by name or email..."
                suffix={<SearchOutlined />}
                allowClear
              />
            </Form.Item>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default ApplicationFilters;
