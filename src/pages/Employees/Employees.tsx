import React, { useEffect, useState, useMemo } from "react";
import { Typography, Spin, Alert, Input, Select, Row, Col } from "antd";
import { getAllEmployees } from "../../services/api/userService";
import { fetchDepartments } from "../../services/api/departmentService"; // Import fetchDepartments
import { UserProfile, Department } from "../../types"; // Import Department
import EmployeeListTable from "../../components/Employees/EmployeeListTable";
import { handleError } from "../../utils/errorHandler";

const { Title } = Typography;
const { Option } = Select;

// Use UserProfile directly as it should contain all necessary fields (first_name, last_name, avatar_url, etc.)
// Add department_name as it's joined in getAllEmployees
interface EmployeeUIData extends UserProfile {
  department_name?: string;
  // avatar_url is already in UserProfile, ensure UserProfile type is up-to-date
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeUIData[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]); // State for departments
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(
    undefined
  ); // 'Active', 'Terminated', or undefined for all
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>(
    undefined
  ); // State for department filter
  const [jobTitleFilter, setJobTitleFilter] = useState<string | undefined>(
    undefined
  ); // State for job title filter

  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [employeesData, departmentsData] = await Promise.all([
        getAllEmployees(),
        fetchDepartments(),
      ]);
      setEmployees(Array.isArray(employeesData) ? employeesData : []);
      setDepartments(Array.isArray(departmentsData) ? departmentsData : []);
    } catch (err) {
      setError("Failed to fetch initial data. Please try again.");
      handleError(err, {
        userMessage: "Could not load employee or department data.",
      });
      setEmployees([]);
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const uniqueJobTitles = useMemo(() => {
    const titles = new Set(
      employees.map((emp) => emp.position).filter(Boolean)
    );
    return Array.from(titles) as string[];
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (statusFilter) {
      filtered = filtered.filter(
        (emp) => emp.employment_status === statusFilter
      );
    }

    if (departmentFilter) {
      filtered = filtered.filter(
        (emp) => emp.department_id === departmentFilter
      );
    }

    if (jobTitleFilter) {
      filtered = filtered.filter((emp) => emp.position === jobTitleFilter);
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter((emp) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`
          .trim()
          .toLowerCase();
        return (
          fullName.includes(lowerSearchTerm) ||
          (emp.email && emp.email.toLowerCase().includes(lowerSearchTerm))
        );
      });
    }
    return filtered;
  }, [employees, searchTerm, statusFilter, departmentFilter, jobTitleFilter]);

  if (loading) {
    return (
      <Spin
        tip="Loading employees..."
        size="large"
        className="flex justify-center items-center h-screen"
      />
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        className="m-4"
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <Title level={2} className="mb-6">
          Employee Management
        </Title>
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={24} md={10} lg={8} xl={7}>
            <Input
              placeholder="Search by name or email..."
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              style={{ width: "100%" }}
              value={searchTerm}
            />
          </Col>
          <Col xs={24} sm={12} md={4} lg={4} xl={3}>
            <Select
              placeholder="Status"
              onChange={setStatusFilter}
              allowClear
              style={{ width: "100%" }}
              value={statusFilter}
            >
              <Option value="Active">Active</Option>
              <Option value="Terminated">Terminated</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5} lg={4} xl={4}>
            <Select
              placeholder="Department"
              onChange={setDepartmentFilter}
              allowClear
              style={{ width: "100%" }}
              value={departmentFilter}
              loading={loading && departments.length === 0} // Show loading indicator if departments are being fetched
            >
              {departments.map((dept) => (
                <Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={5} lg={4} xl={4}>
            <Select
              placeholder="Job Title"
              onChange={setJobTitleFilter}
              allowClear
              style={{ width: "100%" }}
              value={jobTitleFilter}
              loading={loading && uniqueJobTitles.length === 0}
            >
              {uniqueJobTitles.map((title) => (
                <Option key={title} value={title}>
                  {title}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
        <EmployeeListTable
          employees={filteredEmployees}
          refetchEmployees={fetchInitialData} // Use fetchInitialData to refetch all data
        />
      </div>
    </div>
  );
};

export default Employees;
