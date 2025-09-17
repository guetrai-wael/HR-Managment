import { FC } from "react";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";

interface LogoutButtonProps {
  type?: "primary" | "default" | "text";
  size?: "small" | "middle" | "large";
  showIcon?: boolean;
  className?: string;
}

const LogoutButton: FC<LogoutButtonProps> = ({
  type = "default",
  size = "middle",
  showIcon = true,
  className = "",
}) => {
  // 🆕 NEW: Using standardized structure
  const { actions, isLoading } = useAuth();

  return (
    <Button
      type={type}
      size={size}
      className={className}
      icon={showIcon ? <LogoutOutlined /> : null}
      onClick={actions.logout}
      loading={isLoading}
    >
      {showIcon ? " Logout" : "Logout"}
    </Button>
  );
};

export default LogoutButton;
