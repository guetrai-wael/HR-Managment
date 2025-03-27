import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/index";

const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useUser();

  if (loading) {
    return null; // The loading state is already handled by the UserContext
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default GuestGuard;
