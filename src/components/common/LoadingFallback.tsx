import { Spin } from "antd";
import React from "react";

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spin size="large" />
  </div>
);

export default LoadingFallback;
