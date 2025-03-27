import { useUser } from "../../hooks/useUser";
import { LogoutButton } from "../../components/Auth";
import { Card, Typography, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

const Jobs = () => {
  const { user } = useUser();

  return (
    <div className="p-6">
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <Avatar
            size={64}
            icon={<UserOutlined />}
            src={user?.user_metadata?.avatar_url}
          />
          <div>
            <Title level={4} className="m-0">
              Welcome,{" "}
              {user?.user_metadata?.full_name ||
                user?.email?.split("@")[0] ||
                "User"}
            </Title>
            <Text type="secondary">{user?.email}</Text>
          </div>
        </div>
      </Card>

      <div className="mt-6">
        <LogoutButton type="primary" className="w-full md:w-auto" />
      </div>
    </div>
  );
};

export default Jobs;
