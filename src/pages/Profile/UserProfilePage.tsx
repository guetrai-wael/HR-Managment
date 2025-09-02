import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserProfile } from "../../services/api/userService"; // Changed to fetchUserProfile
import { getDepartmentById } from "../../services/api/departmentService";
import { UserProfile, Department } from "../../types/models";
import { formatDate } from "../../utils/formatDate";
import { PageLayout, QueryBoundary, UserAvatar } from "../../components/common";
import {
  Card,
  Descriptions,
  Spin,
  Alert,
  Row,
  Col,
  Typography,
  Divider,
  Empty,
} from "antd";
import {
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  IdcardOutlined,
  TeamOutlined,
} from "@ant-design/icons"; // Removed unused icons

const { Title, Text, Paragraph } = Typography;

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();

  const {
    data: user,
    isLoading: userLoading,
    isError: userIsError,
    error: userErrorData,
  } = useQuery<UserProfile | null, Error>({
    queryKey: ["userProfile", userId],
    queryFn: () => (userId ? fetchUserProfile(userId) : Promise.resolve(null)),
    enabled: !!userId,
  });

  const {
    data: department,
    isLoading: departmentLoading,
    isError: departmentIsError,
    error: departmentErrorData,
  } = useQuery<Department | null, Error>({
    queryKey: ["department", user?.department_id],
    queryFn: () =>
      user?.department_id
        ? getDepartmentById(user.department_id.toString())
        : Promise.resolve(null),
    enabled: !!user?.department_id,
  });

  if (!userId) {
    return (
      <PageLayout title="User Profile">
        <Empty description="No user ID provided." />
      </PageLayout>
    );
  }

  const combinedIsLoading = userLoading || departmentLoading;
  const combinedIsError = userIsError || departmentIsError;
  const combinedError = userErrorData || departmentErrorData;

  return (
    <PageLayout
      title={
        user
          ? `${user.first_name || ""} ${user.last_name || ""}'s Profile`
          : "User Profile"
      }
    >
      <QueryBoundary
        isLoading={combinedIsLoading}
        isError={combinedIsError}
        error={combinedError}
        loadingTip="Loading user profile..."
      >
        {" "}
        {user ? (
          <Row gutter={[16, 24]} className="max-w-full">
            <Col xs={24} sm={24} md={10} lg={8} xl={6}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="text-center p-4">
                  <UserAvatar
                    src={user.avatar_url}
                    firstName={user.first_name}
                    lastName={user.last_name}
                    size={128}
                    className="mb-4 border-4 border-blue-500"
                  />
                  <Title level={4} className="mb-1 break-words">{`${
                    user.first_name || ""
                  } ${user.last_name || ""}`}</Title>
                  <Text type="secondary" className="block mb-2 break-all">
                    {user.email}
                  </Text>
                </div>
              </Card>{" "}
            </Col>
            <Col xs={24} sm={24} md={14} lg={16} xl={18}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <Title level={5} className="mb-4 border-b pb-2">
                  Personal Information
                </Title>
                <Descriptions
                  bordered
                  column={{
                    xxl: 2,
                    xl: 2,
                    lg: 2,
                    md: 1,
                    sm: 1,
                    xs: 1,
                  }}
                  size="small"
                  className="responsive-descriptions"
                >
                  <Descriptions.Item
                    label={
                      <>
                        <IdcardOutlined className="mr-2" />
                        Full Name
                      </>
                    }
                  >
                    {`${user.first_name || ""} ${user.last_name || ""}`}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <>
                        <MailOutlined className="mr-2" />
                        Email
                      </>
                    }
                  >
                    {user.email}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <>
                        <PhoneOutlined className="mr-2" />
                        Phone
                      </>
                    }
                  >
                    {user.phone || <Text type="secondary">N/A</Text>}
                  </Descriptions.Item>
                  <Descriptions.Item
                    label={
                      <>
                        <HomeOutlined className="mr-2" />
                        Address
                      </>
                    }
                  >
                    {user.physical_address || <Text type="secondary">N/A</Text>}
                  </Descriptions.Item>
                  {user.hiring_date && (
                    <Descriptions.Item
                      label={
                        <>
                          <CalendarOutlined className="mr-2" />
                          Hiring Date
                        </>
                      }
                    >
                      {formatDate(user.hiring_date)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
                <Divider />{" "}
                <Title level={5} className="mb-4 mt-6 border-b pb-2">
                  Professional Details
                </Title>
                <Descriptions
                  bordered
                  column={{
                    xxl: 2,
                    xl: 2,
                    lg: 2,
                    md: 1,
                    sm: 1,
                    xs: 1,
                  }}
                  size="small"
                  className="responsive-descriptions"
                >
                  <Descriptions.Item
                    label={
                      <>
                        <TeamOutlined className="mr-2" />
                        Department
                      </>
                    }
                  >
                    {department ? (
                      department.name
                    ) : user.department_id ? (
                      <Spin size="small" />
                    ) : (
                      <Text type="secondary">N/A</Text>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="Position">
                    {user.position || <Text type="secondary">N/A</Text>}{" "}
                    {/* Changed from job_title to position */}
                  </Descriptions.Item>
                  <Descriptions.Item label="Employee ID">
                    {user.id /* Assuming user.id is the Employee ID */}
                  </Descriptions.Item>
                </Descriptions>
                {user.bio && (
                  <>
                    <Divider />
                    <Title level={5} className="mb-4 mt-6 border-b pb-2">
                      Biography
                    </Title>
                    <Paragraph className="text-gray-700">{user.bio}</Paragraph>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        ) : (
          <Alert message="User not found." type="error" showIcon />
        )}
      </QueryBoundary>
    </PageLayout>
  );
};

export default UserProfilePage;
