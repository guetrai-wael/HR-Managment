import React, { useState, useMemo } from "react";
import { Form, Button } from "antd";
import { useQuery } from "@tanstack/react-query";
import { employeeService } from "../../services/api/hr";
import { departmentService } from "../../services/api/admin";
import { UserProfile, Department } from "../../types";
import EmployeeListTable from "../../components/Employees/EmployeeListTable";
import QueryBoundary from "../../components/common/QueryBoundary";
import { PageLayout } from "../../components/common/index";
import {
  SearchFilterInput,
  SimpleSelectFilter,
  DataDrivenSelectFilter,
  MobileFilterWrapper,
} from "../../components/common/FilterFields";

interface EmployeeUIData extends UserProfile {
  department_name?: string;
}

// Define a type for the filter values
interface EmployeePageFilterValues {
  searchTerm?: string;
  statusFilter?: string;
  departmentFilter?: number;
  jobTitleFilter?: string;
}

const Employees: React.FC = () => {
  const [form] = Form.useForm<EmployeePageFilterValues>();
  const [filters, setFilters] = useState<EmployeePageFilterValues>({});

  const {
    data: employees = [],
    isLoading: isLoadingEmployees,
    error: errorEmployees,
  } = useQuery<EmployeeUIData[], Error>({
    queryKey: ["employees"],
    queryFn: employeeService.getAll,
  });

  const {
    data: departments = [],
    isLoading: isLoadingDepartments,
    error: errorDepartments,
  } = useQuery<Department[], Error>({
    queryKey: ["departments"],
    queryFn: departmentService.getAll,
  });

  const uniqueJobTitles = useMemo(() => {
    const titles = new Set(
      (employees as EmployeeUIData[])
        .map((emp: EmployeeUIData) => emp.position)
        .filter(Boolean)
    );
    // Transform for DataDrivenSelectFilter
    return Array.from(titles).map((title) => ({ value: title, label: title }));
  }, [employees]);

  // Update filteredEmployees to use the 'filters' state object
  const filteredEmployees = useMemo(() => {
    console.log(
      "[Employees] Recalculating filteredEmployees. Current filters:",
      filters
    );
    console.log(
      "[Employees] Raw employees before filtering:",
      JSON.parse(JSON.stringify(employees))
    );

    let filtered: EmployeeUIData[] = employees as EmployeeUIData[];

    if (filters.statusFilter) {
      console.log(`[Employees] Filtering by status: "${filters.statusFilter}"`);
      filtered = filtered.filter((emp: EmployeeUIData) => {
        const isMatch = emp.employment_status === filters.statusFilter;
        return isMatch;
      });
    }

    if (filters.departmentFilter) {
      console.log(
        `[Employees] Filtering by departmentId: "${filters.departmentFilter}"`
      );
      filtered = filtered.filter(
        (emp: EmployeeUIData) => emp.department_id === filters.departmentFilter
      );
    }

    if (filters.jobTitleFilter) {
      console.log(
        `[Employees] Filtering by jobTitle: "${filters.jobTitleFilter}"`
      );
      filtered = filtered.filter(
        (emp: EmployeeUIData) => emp.position === filters.jobTitleFilter
      );
    }

    if (filters.searchTerm) {
      const lowerSearchTerm = filters.searchTerm.toLowerCase();
      console.log(`[Employees] Filtering by searchTerm: "${lowerSearchTerm}"`);
      filtered = filtered.filter((emp: EmployeeUIData) => {
        const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`
          .trim()
          .toLowerCase();
        const emailMatch =
          emp.email && emp.email.toLowerCase().includes(lowerSearchTerm);
        const nameMatch = fullName.includes(lowerSearchTerm);
        return nameMatch || emailMatch;
      });
    }
    console.log(
      "[Employees] Resulting filteredEmployees:",
      JSON.parse(JSON.stringify(filtered))
    );
    return filtered;
  }, [employees, filters]); // Dependency array updated to 'filters'

  const isLoading = isLoadingEmployees || isLoadingDepartments;

  const employeeStatusOptions = [
    { value: "Active", label: "Active" },
    { value: "Terminated", label: "Terminated" },
  ];

  const renderFiltersContent = (
    isDrawer: boolean,
    closeDrawer?: () => void
  ) => (
    <Form
      form={form}
      layout={isDrawer ? "vertical" : "inline"}
      className={isDrawer ? "" : "flex flex-wrap gap-4 items-center"}
      initialValues={filters}
      onValuesChange={(_, allValues) => setFilters(allValues)}
    >
      <SearchFilterInput
        name="searchTerm"
        label={isDrawer ? "Search by Name or Email" : "Search"}
        placeholder="Name or email..."
        disabled={isLoading}
        className={isDrawer ? "w-full" : "flex-grow min-w-[200px]"}
      />
      <SimpleSelectFilter
        name="statusFilter"
        label="Status"
        placeholder="Any Status"
        options={employeeStatusOptions}
        disabled={isLoading}
        className={isDrawer ? "w-full" : "min-w-[150px]"}
      />
      <DataDrivenSelectFilter
        name="departmentFilter"
        label="Department"
        placeholder="Any Department"
        data={departments}
        valueKey="id"
        labelKey="name"
        loading={isLoadingDepartments}
        disabled={isLoading}
        className={isDrawer ? "w-full" : "min-w-[180px]"}
      />
      <DataDrivenSelectFilter
        name="jobTitleFilter"
        label="Job Title"
        placeholder="Any Job Title"
        data={uniqueJobTitles} // Use transformed data
        valueKey="value" // Key for the value in {value: string, label: string}
        labelKey="label" // Key for the label in {value: string, label: string}
        loading={isLoadingEmployees && uniqueJobTitles.length === 0}
        disabled={isLoading}
        className={isDrawer ? "w-full" : "min-w-[180px]"}
      />

      {isDrawer && closeDrawer && (
        <Button
          type="primary"
          onClick={closeDrawer} // Use closeDrawer from props
          block
          className="mt-2"
          disabled={isLoading}
        >
          Done
        </Button>
      )}
    </Form>
  );

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={!!errorEmployees || !!errorDepartments}
      error={errorEmployees || errorDepartments}
    >
      <PageLayout
        title="Employee Management"
        subtitle="View and manage all employees."
      >
        {/* Desktop Filters */}
        <div className="hidden lg:block mb-2">
          {renderFiltersContent(false)}
        </div>

        {/* Mobile Filters */}
        <MobileFilterWrapper
          drawerTitle="Filter Employees"
          isLoading={isLoading}
        >
          {({ closeDrawer }) => renderFiltersContent(true, closeDrawer)}
        </MobileFilterWrapper>

        <EmployeeListTable employees={filteredEmployees} />
      </PageLayout>
    </QueryBoundary>
  );
};

export default Employees;
