import React, { ReactNode } from "react";
import { Sidebar, MobileMenu } from "../common/index";
import { Button } from "antd";
import { useUser } from "../../hooks";
import { Link } from "react-router-dom";
import Logo from "../../assets/icons/Logo.svg";
import QueryBoundary from "../common/QueryBoundary";

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, authLoading } = useUser();

  return (
    <QueryBoundary
      isLoading={authLoading}
      isError={false}
      error={null}
      loadingTip="Loading user information..."
    >
      {!user ? (
        <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
          {/* Public Header */}
          <header className="bg-white shadow-sm h-16 flex items-center px-4 md:px-8">
            <div className="flex-1">
              <Link to="/" className="flex items-center">
                <div className="w-[83px] h-[32px]">
                  <img src={Logo} alt="Logo" className="w-full h-full" />
                </div>
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button type="default">Login</Button>
              </Link>
              <Link to="/signup">
                <Button type="primary">Sign Up</Button>
              </Link>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">
            <div className="flex flex-col bg-white min-h-screen">
              {children}
            </div>
          </main>
        </div>
      ) : (
        // For authenticated users, show the normal sidebar layout
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
      )}
    </QueryBoundary>
  );
};

export default MainLayout;
