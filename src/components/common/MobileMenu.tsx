import React, { useState } from "react";
import { Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUser, useRole } from "../../hooks";
import Logo from "../../assets/icons/Logo.svg";
import {
  IconUserShare,
  IconHome,
  IconClipboardText,
  IconUsersPlus,
  IconBriefcase,
  IconVideo,
  IconSettings,
  IconLogout,
} from "@tabler/icons-react";

const MobileMenu: React.FC = () => {
  const { user } = useUser();
  const { isAdmin } = useRole();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { logout } = useAuth();
  const isActive = (path: string) => location.pathname === path;

  const showDrawer = () => {
    setOpen(true);
  };

  const onClose = () => {
    setOpen(false);
  };

  // Get current page title based on path
  const getCurrentPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Jobs";
    if (path === "/home") return "Home";
    if (path === "/registrations")
      return isAdmin ? "Applications Management" : "My Applications";
    if (path === "/leaves") return "Leaves";
    if (path === "/employee") return "Employee";
    if (path === "/recordings") return "Recordings";
    if (path === "/settings") return "Settings";

    // Handle job details page
    if (path.startsWith("/jobs/")) return "Job Details";

    return "Dashboard";
  };

  const navItems = [
    { icon: <IconHome stroke={1.5} />, text: "Home", path: "/home" },
    {
      icon: <IconClipboardText stroke={1.5} />,
      text: "Applications",
      path: "/registrations",
    },
    { icon: <IconUserShare stroke={1.5} />, text: "Leaves", path: "/leaves" },
    {
      icon: <IconUsersPlus stroke={1.5} />,
      text: "Employee",
      path: "/employee",
    },
    { icon: <IconBriefcase stroke={1.5} />, text: "Jobs", path: "/" },
    {
      icon: <IconVideo stroke={1.5} />,
      text: "Recordings",
      path: "/recordings",
    },
    {
      icon: <IconSettings stroke={1.5} />,
      text: "Settings",
      path: "/settings",
    },
  ];

  return (
    <>
      {/* Mobile header bar */}
      <div className="fixed top-0 left-0 right-0 z-40 md:hidden bg-white flex items-center h-16 px-4 shadow-sm">
        <button
          onClick={showDrawer}
          className="p-2 rounded-md text-[#6941C6]"
          aria-label="Open menu"
        >
          <MenuOutlined style={{ fontSize: "20px" }} />
        </button>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-medium text-[#101828]">
            {getCurrentPageTitle()}
          </h1>
        </div>
        <div className="w-8">{/* Empty div for balance */}</div>
      </div>

      {/* Add padding to compensate for the fixed header */}
      <div className="md:hidden h-16"></div>

      <Drawer placement="left" onClose={onClose} open={open} width={280}>
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col gap-6">
            {/* Logo */}
            <div className="px-4 py-4">
              <img src={Logo} alt="Logo" className="w-[83px] h-[32px]" />
            </div>

            {/* Navigation Items */}
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={index}
                  to={item.path}
                  className={`flex flex-row items-center p-3 gap-3 rounded-md ${
                    isActive(item.path)
                      ? "bg-[#F9F5FF] text-[#6941C6]"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={onClose}
                >
                  <span
                    className={
                      isActive(item.path) ? "text-[#6941C6]" : "text-[#667085]"
                    }
                  >
                    {item.icon}
                  </span>
                  <span
                    className={`text-sm font-medium ${
                      isActive(item.path) ? "text-[#6941C6]" : "text-[#344054]"
                    }`}
                  >
                    {item.text}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* User Profile */}
          <div className="border-t border-gray-200 mt-4 pt-4 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {user?.user_metadata?.avatar_url ? (
                    <img
                      src={user.user_metadata.avatar_url}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.email?.split("@")[0] || "User"
                      )}&background=6941C6&color=fff`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                {/* User Info */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[#101828]">
                    {user?.email?.split("@")[0] || "User"}
                  </span>
                  <span className="text-sm text-[#667085]">
                    {isAdmin ? "Admin" : "Employee"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => logout()}
                className="p-2 rounded-md hover:bg-gray-100"
                aria-label="Logout"
              >
                <IconLogout stroke={1.5} className="text-[#667085]" />
              </button>
            </div>
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default MobileMenu;
