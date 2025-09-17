import React from "react";
import { Typography } from "antd";

import { HeaderProps } from "../../types";

/**
 * Main page header component with title, subtitle, and optional action content
 */
const Header: React.FC<HeaderProps> = ({ title, subtitle, children }) => {
  return (
    <div className="flex flex-col gap-6">
      <div className="w-full">
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-medium text-gray-900 leading-10">
                {title}
              </h1>
              {subtitle && (
                <Typography.Text type="secondary" className="text-base">
                  {subtitle}
                </Typography.Text>
              )}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
