import React from "react";
import {
  Modal,
  Descriptions,
  Avatar,
  Tag,
  Typography,
  Row,
  Col,
  Card,
} from "antd";
import { UserProfile } from "../../types";
import { formatDate } from "../../utils/formatDate";
import { UserOutlined } from "@ant-design/icons";

interface EmployeeUIData extends UserProfile {
  department_name?: string;
  avatar_url?: string | null;
}

interface EmployeeProfileModalProps {
  employee: EmployeeUIData | null;
  visible: boolean;
  onClose: () => void;
}

const { Title, Text } = Typography;

const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  employee,
  visible,
  onClose,
}) => {
  if (!employee) return null;

  const fullName = `${employee.first_name || ""} ${
    employee.last_name || ""
  }`.trim();
  const initials = `${employee.first_name ? employee.first_name[0] : ""}${
    employee.last_name ? employee.last_name[0] : ""
  }`.toUpperCase();

  const getStatusTag = (status?: string) => {
    if (!status) return <Tag color="grey">Unknown</Tag>;
    let color = "grey";
    if (status === "Active") color = "green";
    else if (status === "Terminated") color = "red";
    return <Tag color={color}>{status}</Tag>;
  };

  return (
    <Modal
      title={
        <Title level={4} style={{ margin: 0 }}>
          Employee Profile
        </Title>
      }
      visible={visible}
      onCancel={onClose}
      footer={null} // No OK/Cancel buttons, just close
      width={700} // Wider modal
      bodyStyle={{ paddingTop: "20px" }}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} sm={8} style={{ textAlign: "center" }}>
          <Avatar
            size={120}
            src={employee.avatar_url}
            icon={!employee.avatar_url && (initials || <UserOutlined />)} // Use initials for fallback
            style={{ marginBottom: "16px", border: "2px solid #f0f0f0" }}
          >
            {!employee.avatar_url && initials
              ? initials
              : !employee.avatar_url && <UserOutlined />}{" "}
            {/* Display initials in Avatar if no image, otherwise UserOutlined */}
          </Avatar>
          <Title level={5} style={{ marginBottom: "4px" }}>
            {fullName || "N/A"} {/* Display combined full name */}
          </Title>
          <Text type="secondary">{employee.position || "N/A"}</Text>
        </Col>
        <Col xs={24} sm={16}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Email">
              {employee.email || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {employee.phone || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Department">
              {employee.department_name || "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Hiring Date">
              {employee.hiring_date ? formatDate(employee.hiring_date) : "N/A"}
            </Descriptions.Item>
            <Descriptions.Item label="Employment Status">
              {getStatusTag(employee.employment_status || undefined)}{" "}
              {/* Handle null by passing undefined */}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
      {(employee.bio || employee.physical_address) && (
        <Card
          title="Additional Information"
          style={{ marginTop: "24px" }}
          size="small"
        >
          {employee.physical_address && (
            <Descriptions layout="vertical" column={1} size="small">
              <Descriptions.Item label="Physical Address">
                <Text>{employee.physical_address}</Text>
              </Descriptions.Item>
            </Descriptions>
          )}
          {employee.bio && (
            <Descriptions
              layout="vertical"
              column={1}
              size="small"
              style={{ marginTop: employee.physical_address ? "16px" : "0" }}
            >
              <Descriptions.Item label="Bio">
                <Text>{employee.bio}</Text>
              </Descriptions.Item>
            </Descriptions>
          )}
        </Card>
      )}
    </Modal>
  );
};

export default EmployeeProfileModal;
