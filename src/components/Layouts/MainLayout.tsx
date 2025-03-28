import React, { ReactNode } from "react";
import { Sidebar, MobileMenu } from "../common/index";
import { Spin } from "antd";
import { useUser } from "../../hooks";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { loading } = useUser();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {/* Sidebar for desktop */}
      <aside className="bg-white shadow-sm hidden md:block sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Mobile menu */}
      <div className="md:hidden">
        <MobileMenu />
      </div>

      {/* Main Content */}
      <main className="flex-1">
        <div className="flex flex-col bg-white rounded-tl-[40px] min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
