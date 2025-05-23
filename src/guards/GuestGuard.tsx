import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/index";
import QueryBoundary from "../components/common/QueryBoundary";

const GuestGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading } = useUser();

  return (
    <QueryBoundary
      isLoading={authLoading}
      isError={false}
      error={null}
      loadingTip="Loading..."
    >
      {user && !authLoading ? <Navigate to="/" /> : <>{children}</>}
    </QueryBoundary>
  );
};

export default GuestGuard;
