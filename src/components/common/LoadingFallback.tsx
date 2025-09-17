import React from "react";
import { Spin } from "antd";

/**
 * Full-screen loading spinner component for page-level loading states
 */
const LoadingFallback: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spin size="large" />
  </div>
);

export default LoadingFallback;
