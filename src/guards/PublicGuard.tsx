import React from "react";
import { useUser } from "../hooks";
import { Spin } from "antd";

const PublicGuard = ({ children }: { children: React.ReactNode }) => {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  return <>{children}</>;
};

export default PublicGuard;
