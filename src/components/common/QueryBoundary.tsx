import React from "react";
import { Spin, Alert } from "antd";

interface QueryBoundaryProps {
  isLoading: boolean;
  isError: boolean; // Changed from 'error' to 'isError' to be more boolean
  error?: { message: string } | null; // Keep error object for message
  children: React.ReactNode;
  loadingTip?: string;
  errorMessage?: string; // Fallback error message
  className?: string; // For custom styling of the container
  loadingClassName?: string; // For custom styling of the loading spinner
  errorClassName?: string; // For custom styling of the error alert
}

const QueryBoundary: React.FC<QueryBoundaryProps> = ({
  isLoading,
  isError,
  error,
  children,
  loadingTip = "Loading data...",
  errorMessage = "Failed to fetch data. Please try again.",
  className = "",
  loadingClassName = "", // Default changed from "flex justify-center items-center h-screen"
  errorClassName = "m-4",
}) => {
  if (isLoading) {
    return (
      // This div now handles the layout for the spinner,
      // combining the QueryBoundary's overall className with centering and full-size utilities.
      <div
        className={`${className} flex justify-center items-center h-full w-full`}
      >
        <Spin tip={loadingTip} size="large" className={loadingClassName} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className={className}>
        <Alert
          message="Error"
          description={error?.message || errorMessage}
          type="error"
          showIcon
          className={errorClassName}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default QueryBoundary;
