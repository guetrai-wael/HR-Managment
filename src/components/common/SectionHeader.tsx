import React, { useState } from "react";
import { Button, Divider } from "antd";

interface TabItem {
  key: string;
  label: string;
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tabs: TabItem[];
  defaultActiveTab?: string;
  onTabChange?: (key: string) => void;
  actionButton?: {
    icon?: React.ReactNode;
    label: string;
    onClick: () => void;
  };
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  tabs,
  defaultActiveTab,
  onTabChange,
  actionButton,
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || tabs[0]?.key);

  const handleTabClick = (key: string) => {
    setActiveTab(key);
    if (onTabChange) onTabChange(key);
  };

  return (
    <div className="flex flex-col items-start gap-5 w-full mb-0 ">
      <div className="flex flex-row justify-between items-start w-full">
        <div className="flex flex-col gap-1 flex-grow">
          <h2 className="font-medium text-lg leading-7 text-gray-900 m-0">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm leading-5 text-gray-500 m-0">{subtitle}</p>
          )}
        </div>

        {actionButton && (
          <div className="flex items-center">
            <Button
              className="!rounded-lg !h-9 !px-4 !py-2 !text-sm !font-medium !leading-5 !text-white !shadow-sm !border-0 !flex items-center gap-2"
              type="primary"
              icon={actionButton.icon}
              onClick={actionButton.onClick}
              style={{
                backgroundColor: "#7F56D9",
                borderColor: "#7F56D9",
              }}
            >
              {actionButton.label}
            </Button>
          </div>
        )}
      </div>

      <div className="relative w-full">
        <div className="flex flex-row gap-4">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className="flex flex-col justify-center items-center cursor-pointer"
              onClick={() => handleTabClick(tab.key)}
            >
              <div className="flex flex-row justify-center items-center px-1 pb-4 pt-1">
                <span
                  className={`text-sm font-medium ${
                    activeTab === tab.key ? "text-[#6941C6]" : "text-[#667085]"
                  }`}
                >
                  {tab.label}
                </span>
              </div>
              <div
                className={`h-0.5 w-full ${
                  activeTab === tab.key ? "bg-[#6941C6]" : "bg-transparent"
                }`}
              ></div>
            </div>
          ))}
        </div>
        <Divider className="!my-0" />
      </div>
    </div>
  );
};

export default SectionHeader;
