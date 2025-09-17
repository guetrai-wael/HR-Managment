import React from "react";
import { useNavigate } from "react-router-dom";
import { Button, Space, Tag, Popconfirm, Tooltip } from "antd";
import { ColumnsType } from "antd/es/table";
import { UserProfile } from "../../types";
import { formatDate } from "../../utils/formatDate";
import { employeeService } from "../../services/api/hr";
import {
  IconEye,
  IconTrash,
  IconBuildingSkyscraper,
} from "@tabler/icons-react";
import { useMutationHandler } from "../../hooks/useMutationHandler";
import { useQueryClient } from "@tanstack/react-query";
import UserAvatar from "../common/UserAvatar";
import DataTable from "../common/DataTable";

interface EmployeeUIData extends UserProfile {
  department_name?: string;
}

interface EmployeeListTableProps {
  employees: EmployeeUIData[];
}

const EmployeeListTable: React.FC<EmployeeListTableProps> = ({ employees }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleViewProfile = (employee: EmployeeUIData) => {
    if (employee.id) {
      navigate(`/employees/${employee.id}`);
    }
  };

  const { mutate: terminateEmployeeMutation, isPending: isTerminating } =
    useMutationHandler<UserProfile, Error, string>({
      mutationFn: employeeService.terminate,
      queryClient,
      successMessage: "Employee terminated successfully.",
      errorMessagePrefix: "Failed to terminate employee",
      invalidateQueries: [["employees"]],
    });

  const handleTerminate = (userId: string) => {
    if (!userId) {
      console.error("User ID is undefined, cannot terminate.");
      return;
    }
    terminateEmployeeMutation(userId);
  };

  const columns: ColumnsType<EmployeeUIData> = [
    {
      title: "Employee",
      key: "employee",
      render: (_, record: EmployeeUIData) => (
        <UserAvatar
          src={record.avatar_url}
          firstName={record.first_name}
          lastName={record.last_name}
          email={record.email}
          showName={true}
          size={32}
          containerClassName="flex items-center space-x-2 py-1"
          nameClassName="font-medium whitespace-nowrap text-sm"
          emailClassName="text-xs text-gray-500 truncate"
        />
      ),
      width: 250,
      fixed: "left",
    },
    {
      title: "Position & Department",
      key: "position_department",
      render: (_, record: EmployeeUIData) => (
        <div className="flex flex-col">
          <span className="whitespace-nowrap text-sm font-medium">
            {record.position || "N/A"}
          </span>
          {record.department_name && (
            <span className="text-xs text-gray-500 flex items-center">
              <IconBuildingSkyscraper size={14} className="mr-1" />
              {record.department_name}
            </span>
          )}
        </div>
      ),
      width: 200,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
      render: (phone) => (
        <span className="whitespace-nowrap text-sm">{phone || "N/A"}</span>
      ),
      width: 130,
      responsive: ["md"],
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
      width: 120,
      responsive: ["xl"],
    },
    {
      title: "Status",
      dataIndex: "employment_status",
      key: "employment_status",
      render: (status) => {
        let color = "grey";
        if (status === "Active") color = "green";
        else if (status === "Terminated") color = "red";
        return (
          <Tag color={color} className="whitespace-nowrap text-xs px-1 py-0.5">
            {status || "Unknown"}
          </Tag>
        );
      },
      width: 100,
      fixed: "right",
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="View Profile">
            <Button
              type="text"
              icon={<IconEye size={16} />}
              onClick={() => handleViewProfile(record)}
              className="p-1"
              disabled={isTerminating}
            />
          </Tooltip>
          {record.employment_status === "Active" && (
            <Tooltip title="Terminate Employee">
              <Popconfirm
                title="Are you sure you want to terminate this employee?"
                onConfirm={() => record.id && handleTerminate(record.id)}
                okText="Yes"
                cancelText="No"
                placement="leftTop"
                disabled={isTerminating}
              >
                <Button
                  type="text"
                  icon={<IconTrash size={16} />}
                  danger
                  className="p-1"
                  loading={isTerminating}
                  disabled={isTerminating}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <DataTable<EmployeeUIData>
        columns={columns}
        dataSource={employees}
        loading={isTerminating}
        tableClassName="employee-list-table min-w-full"
        emptyTextDescription="No employees found"
      />
    </>
  );
};

export default EmployeeListTable;
