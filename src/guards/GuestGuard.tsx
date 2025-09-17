import { Navigate } from "react-router-dom";
import { useUser, useRole } from "../hooks";
import QueryBoundary from "../components/common/QueryBoundary";

const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading: userAuthLoading } = useUser();

  // Get role loading state
  const { isLoading: roleLoading } = useRole();

  const isLoading = userAuthLoading || roleLoading;

  // Determine where to redirect authenticated users
  const getRedirectPath = () => {
    // Always redirect to dashboard first, let EmployeeOrAdminGuard handle role-based routing
    return "/";
  };

  // Wait for role loading to complete AND have actual role data
  const shouldRedirect = user && !userAuthLoading && !roleLoading;

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={false}
      error={null}
      loadingTip="Loading..."
    >
      {shouldRedirect ? <Navigate to={getRedirectPath()} /> : <>{children}</>}
    </QueryBoundary>
  );
};

export default GuestGuard;
