import React from "react";
import { useUser } from "../hooks";
import QueryBoundary from "../components/common/QueryBoundary";

const PublicGuard = ({ children }: { children: React.ReactNode }) => {
  const { authLoading } = useUser();

  return (
    <QueryBoundary
      isLoading={authLoading}
      isError={false}
      error={null}
      loadingTip="Loading page..."
    >
      {children}
    </QueryBoundary>
  );
};

export default PublicGuard;
