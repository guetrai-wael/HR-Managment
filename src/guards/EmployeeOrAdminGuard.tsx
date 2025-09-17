import { Navigate } from "react-router-dom";
import { useUser, useRole } from "../hooks";
import QueryBoundary from "../components/common/QueryBoundary";

const EmployeeOrAdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading: userAuthLoading } = useUser();

  // Using standardized structure
  const {
    data: { isAdmin, isEmployee },
    isLoading: roleLoading,
  } = useRole();

  const isLoading = userAuthLoading || roleLoading;

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={false}
      error={null}
      loadingTip="Verifying access..."
    >
      {user === null && !isLoading ? (
        <Navigate to="/jobs" />
      ) : user && !isEmployee && !isAdmin && !isLoading ? (
        <Navigate to="/jobs" />
      ) : user && (isEmployee || isAdmin) ? (
        <>{children}</>
      ) : null}
    </QueryBoundary>
  );
};

export default EmployeeOrAdminGuard;
