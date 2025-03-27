import { FC } from "react";
import { Button } from "antd";
import { LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { handleLogout } from "../../../API/Login";

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
  const navigate = useNavigate();

  const handleButtonClick = async () => {
    const success = await handleLogout();
    if (success) {
      navigate("/login");
    }
  };

  return (
    <Button
      type={type}
      size={size}
      className={className}
      icon={showIcon ? <LogoutOutlined /> : null}
      onClick={handleButtonClick}
    >
      {showIcon ? " Logout" : "Logout"}
    </Button>
  );
};

export default LogoutButton;
