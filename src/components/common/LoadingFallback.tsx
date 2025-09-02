import { Spin } from "antd";

const LoadingFallback = () => (
  <div className="flex min-h-screen items-center justify-center">
    <Spin size="large" />
  </div>
);

export default LoadingFallback;
