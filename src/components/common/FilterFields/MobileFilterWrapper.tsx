import React, { useState } from "react";
import { Button, Drawer } from "antd";
import { FilterOutlined } from "@ant-design/icons";

interface MobileFilterWrapperProps {
  filterButtonText?: string;
  drawerTitle: string;
  children:
    | React.ReactNode
    | (({ closeDrawer }: { closeDrawer: () => void }) => React.ReactNode);
  isLoading?: boolean; // To disable the "Show Filters" button
  buttonClassName?: string;
  drawerWidth?: string | number;
}

export const MobileFilterWrapper: React.FC<MobileFilterWrapperProps> = ({
  filterButtonText = "Show Filters",
  drawerTitle,
  children,
  isLoading,
  buttonClassName = "mb-4 w-full", // Default to w-full for mobile
  drawerWidth = "85%",
}) => {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  return (
    <div className="lg:hidden">
      {/* This wrapper ensures it's only for mobile */}
      <Button
        icon={<FilterOutlined />}
        onClick={showDrawer}
        className={buttonClassName}
        disabled={isLoading}
        block // Ensure button takes full width
      >
        {filterButtonText}
      </Button>
      <Drawer
        title={drawerTitle}
        placement="right"
        onClose={closeDrawer}
        open={drawerVisible}
        width={drawerWidth}
        bodyStyle={{ padding: "16px" }}
      >
        {typeof children === "function" ? children({ closeDrawer }) : children}
      </Drawer>
    </div>
  );
};
