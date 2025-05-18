import React, { useState } from "react";
import { Table, Button, Space, Tag, Popconfirm, message, Tooltip } from "antd"; // Added Tooltip
import { ColumnsType } from "antd/es/table";
import { UserProfile } from "../../types";
import { formatDate } from "../../utils/formatDate";
import { terminateEmployee } from "../../services/api/userService";
import { handleError } from "../../utils/errorHandler";
import { IconEye, IconTrash } from "@tabler/icons-react"; // Added icons
import EmployeeProfileModal from "./EmployeeProfileModal"; // Import the modal component

// Extend UserProfile or create a specific type for the table data
// UserProfile already includes first_name and last_name as string | null
// Omit 'full_name' as it's no longer part of UserProfile after recent changes in types/models.ts
interface EmployeeUIData extends UserProfile {
  // UserProfile now has first_name and last_name
  department_name?: string;
  avatar_url?: string | null; // Ensure avatar_url is part of the interface
  key?: React.Key; // For Ant Design table keys
}

interface EmployeeListTableProps {
  employees: EmployeeUIData[];
  refetchEmployees: () => void;
}

const EmployeeListTable: React.FC<EmployeeListTableProps> = ({
  employees,
  refetchEmployees,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeUIData | null>(null);

  const handleViewProfile = (employee: EmployeeUIData) => {
    setSelectedEmployee(employee);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedEmployee(null);
  };

  const handleTerminate = async (userId: string) => {
    try {
      const success = await terminateEmployee(userId);
      if (success) {
        message.success("Employee terminated successfully.");
        refetchEmployees(); // Refresh the list
      } else {
        // Error should have been handled by terminateEmployee's handleError
        // but a generic message here can be a fallback.
        message.error("Failed to terminate employee. See logs for details.");
      }
    } catch (error) {
      handleError(error, {
        userMessage:
          "An unexpected error occurred while terminating the employee.",
      });
    }
  };

  const columns: ColumnsType<EmployeeUIData> = [
    {
      title: "Name", // Changed from "Full Name"
      // dataIndex is not strictly needed if using a custom render that accesses multiple record fields
      key: "name", // Changed key
      render: (_, record: EmployeeUIData) => {
        const fullName = `${record.first_name || ""} ${
          record.last_name || ""
        }`.trim();
        const initials = `${record.first_name ? record.first_name[0] : ""}${
          record.last_name ? record.last_name[0] : ""
        }`.toUpperCase();
        return (
          <div className="flex items-center py-1">
            <div className="mr-2 flex-shrink-0">
              {record.avatar_url ? (
                <img
                  src={record.avatar_url}
                  alt={fullName || "Avatar"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-semibold">
                  {initials || "?"} {/* Updated to use initials */}
                </div>
              )}
            </div>
            <span className="font-medium whitespace-nowrap text-sm">
              {fullName || "N/A"}
            </span>
          </div>
        );
      },
      width: 200, // Base width, will be primary column on small screens
    },
    {
      title: "Job Title",
      dataIndex: "position",
      key: "position",
      render: (position) => (
        <span className="whitespace-nowrap text-sm">{position || "N/A"}</span>
      ),
      width: 150, // Base width
    },
    {
      title: "Department",
      dataIndex: "department_name",
      key: "department_name",
      render: (departmentName) => (
        <span className="whitespace-nowrap text-sm">
          {departmentName || "N/A"}
        </span>
      ),
      width: 140,
      responsive: ["lg"], // Visible on large screens and up
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      render: (email) => (
        <span className="block truncate text-sm" style={{ maxWidth: "180px" }}>
          {email || "N/A"}
        </span>
      ),
      width: 180,
      responsive: ["xl"], // Visible on extra-large screens and up
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <span className="whitespace-nowrap text-sm">{phone || "N/A"}</span>
      ),
      width: 120,
      responsive: ["md"], // Visible on medium screens and up
    },
    {
      title: "Hiring Date",
      dataIndex: "hiring_date",
      key: "hiring_date",
      render: (date) => (
        <span className="whitespace-nowrap text-sm">
          {date ? formatDate(date) : "N/A"}
        </span>
      ),
      sorter: (a, b) =>
        new Date(a.hiring_date || 0).getTime() -
        new Date(b.hiring_date || 0).getTime(),
      width: 110,
      responsive: ["xl"], // Visible on extra-large screens and up
    },
    {
      title: "Status",
      dataIndex: "employment_status",
      key: "employment_status",
      render: (status) => {
        let color = "grey";
        if (status === "Active") color = "green";
        else if (status === "Terminated") color = "red";
        // Reduced padding and font size for the tag to make it smaller
        return (
          <Tag color={color} className="whitespace-nowrap text-xs px-1 py-0.5">
            {status || "Unknown"}
          </Tag>
        );
      },
      width: 100, // Adjusted width slightly
      fixed: "right",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 80, // Adjusted width slightly
      render: (_, record) => (
        <Space size="small">
          {" "}
          {/* Kept space small */}
          <Tooltip title="View Profile">
            <Button
              type="text"
              icon={<IconEye size={16} />} /* Kept icon size small */
              onClick={() => handleViewProfile(record)} // Updated onClick
              className="p-1" // Kept padding small
            />
          </Tooltip>
          {record.employment_status === "Active" && (
            <Tooltip title="Terminate Employee">
              <Popconfirm
                title="Are you sure you want to terminate this employee?"
                onConfirm={() => record.id && handleTerminate(record.id)}
                okText="Yes, Terminate"
                cancelText="No"
                placement="leftTop"
              >
                <Button
                  type="text"
                  danger
                  icon={<IconTrash size={16} />} /* Kept icon size small */
                  className="p-1" // Kept padding small
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Add key to each employee record for Ant Design Table
  const tableData = employees.map((emp) => ({ ...emp, key: emp.id }));

  return (
    <>
      <Table
        columns={columns}
        dataSource={tableData}
        rowKey="id"
        // scroll={{ x: "calc(1000px + 50%)" }} // Still keeping scroll.x commented out
        pagination={{ pageSize: 10, className: "mt-4" }}
        className="shadow-md rounded-lg bg-white text-sm" // text-sm is already here, will ensure cell content also adheres
        size="small" // Added Ant Design Table size="small" prop for more compact rows
      />
      {selectedEmployee && (
        <EmployeeProfileModal
          employee={selectedEmployee}
          visible={isModalVisible}
          onClose={handleModalClose}
        />
      )}
    </>
  );
};

export default EmployeeListTable;
