import { useEffect, useState } from "react";
import { validateToken } from "../API/validatetoken";
import { Spin } from "antd";
import { Navigate } from "react-router-dom";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkToken = async () => {
      const isValid = await validateToken();
      setIsAuthenticated(isValid);
    };
    checkToken();
  }, []);
  if (isAuthenticated === null) {
    return <Spin />;
  }
  if (!isAuthenticated) return <Navigate to="/login" />;
  return <>{children}</>;
};
export default AuthGuard;
