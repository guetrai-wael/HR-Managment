import { Card, Button, Avatar, Typography, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../hooks";
import balanceIcon from "../../assets/img/balance.png";

const { Text, Title } = Typography;

interface DashboardSidebarProps {
  isAdmin: boolean;
  isEmployee: boolean;
  leaveBalance?: number;
  isLoadingBalance?: boolean;
}

export function DashboardSidebar({
  isAdmin,
  isEmployee,
  leaveBalance,
  isLoadingBalance = false,
}: DashboardSidebarProps) {
  const { user } = useUser();
  const navigate = useNavigate();

  const getUserName = () => {
    return (
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
    );
  };

  const getUserRole = () => {
    if (isAdmin) return "Admin";
    if (isEmployee) return "Software Developer"; // You can customize this based on user profile
    return "User";
  };

  const handleViewProfileClick = () => {
    navigate("/profile");
  };

  return (
    <div className="space-y-4">
      {/* User Profile Card */}
      <Card className="text-center">
        <Space direction="vertical" size="middle" className="w-full">
          <Avatar
            size={80}
            src={user?.user_metadata?.avatar_url}
            icon={<UserOutlined />}
            className="mx-auto"
          />
          <div>
            <Title level={4} className="mb-1">
              {getUserName()}
            </Title>
            <Text type="secondary">{getUserRole()}</Text>
          </div>

          <div className="w-full">
            <Button
              type="primary"
              block
              size="large"
              onClick={handleViewProfileClick}
            >
              View profile
            </Button>
          </div>
        </Space>
      </Card>

      {/* Employee-specific Balance Card */}
      {isEmployee && (
        <Card>
          <div className="text-center">
            <Text type="secondary" className="block mb-2">
              Current Leave Balance
            </Text>
            <div className="flex items-center justify-around gap-2 mb-2">
              <Title level={2} className="text-green-600 mb-0">
                {isLoadingBalance ? "..." : leaveBalance || 0}
              </Title>
              <img src={balanceIcon} alt="Balance" className="w-9 h-9" />
            </div>
            <div className="text-xs text-gray-500 mb-3">
              Anniversary-based • 24 days/year + carryover
            </div>
            <Button
              type="primary"
              block
              size="large"
              className="bg-purple-600 border-purple-600 hover:bg-purple-700"
              onClick={() => navigate("/leaves")}
            >
              Apply for leave
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

export default DashboardSidebar;
