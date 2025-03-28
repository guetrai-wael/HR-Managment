import React, { useState } from "react";
import { Drawer } from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useUser } from "../../hooks";
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

  const navItems = [
    { icon: <IconHome stroke={1.5} />, text: "Home", path: "/home" },
    {
      icon: <IconClipboardText stroke={1.5} />,
      text: "Registrations",
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
      <button
        onClick={showDrawer}
        className="fixed bottom-4 right-4 z-50 md:hidden bg-[#6941C6] text-white p-3 rounded-full shadow-lg"
        aria-label="Open menu"
      >
        <MenuOutlined style={{ fontSize: "20px" }} />
      </button>

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
                    {user?.email || ""}
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
