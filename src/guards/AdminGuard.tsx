import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useUser, useRole } from "../hooks";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();

  if (userLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default AdminGuard;
