import { Navigate } from "react-router-dom";
import { useUser, useRole } from "../hooks";
import QueryBoundary from "../components/common/QueryBoundary";

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading: userAuthLoading } = useUser();
  const { isAdmin, loading: roleLoading } = useRole();

  const isLoading = userAuthLoading || roleLoading;

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={false}
      error={null}
      loadingTip="Verifying access..."
    >
      {user === null && !isLoading ? (
        <Navigate to="/login" />
      ) : user && !isAdmin && !isLoading ? (
        <Navigate to="/" />
      ) : user && isAdmin ? (
        <>{children}</>
      ) : null}
    </QueryBoundary>
  );
};

export default AdminGuard;
