import React, { ReactNode } from "react";
import { Header } from "./index"; // Assuming Header is in the same directory or correctly indexed

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  headerActions?: ReactNode; // For elements like buttons next to the page title
  children: ReactNode;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  title,
  subtitle,
  headerActions,
  children,
}) => {
  return (
    <div className="flex flex-col h-full overflow-auto py-4">
      <div className="px-4 md:px-8 mb-6">
        <Header title={title} subtitle={subtitle}>
          {headerActions}
        </Header>
      </div>
      <div className="px-4 md:px-8">{children}</div>
    </div>
  );
};

export default PageLayout;
