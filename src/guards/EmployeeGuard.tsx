import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useUser, useRole } from "../hooks";

const EmployeeGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: userLoading } = useUser();
  const { isAdmin, isEmployee, loading: roleLoading } = useRole();

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

  // Allow access only if user is an employee OR admin
  if (!isEmployee && !isAdmin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default EmployeeGuard;
