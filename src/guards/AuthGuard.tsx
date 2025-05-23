import { Navigate } from "react-router-dom";
import { useUser } from "../hooks/index";
import QueryBoundary from "../components/common/QueryBoundary";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { user, authLoading } = useUser();

  return (
    <QueryBoundary
      isLoading={authLoading}
      isError={false}
      error={null}
      loadingTip="Verifying authentication..."
    >
      {!user && !authLoading ? <Navigate to="/login" /> : <>{children}</>}
    </QueryBoundary>
  );
};

export default AuthGuard;
