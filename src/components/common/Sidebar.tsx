import { useCallback, useMemo } from "react";
import { useUser, useRole } from "../../hooks/index";
import { useAuth } from "../../hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
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

import Logo from "../../assets/icons/Logo.svg";

const Sidebar: React.FC = () => {
  const { user } = useUser();
  const { isAdmin, isEmployee, isJobSeeker } = useRole(); // Add isJobSeeker
  const location = useLocation();
  const { logout } = useAuth();
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location]
  );

  // Create appropriate navigation items based on user role
  const navItems = useMemo(() => {
    const items = [
      { icon: <IconHome stroke={1.5} />, text: "Home", path: "/home" },
      // Show Applications to all authenticated users (including job seekers)
      ...(isAdmin || isEmployee || isJobSeeker // Add isJobSeeker here
        ? [
            {
              icon: <IconClipboardText stroke={1.5} />,
              text: "Applications",
              path: "/applications",
            },
          ]
        : []),
      // Only show employee management for admins
      ...(isAdmin
        ? [
            {
              icon: <IconUsersPlus stroke={1.5} />,
              text: "Employee",
              path: "/employee",
            },
          ]
        : []),
      // Jobs is visible to all
      { icon: <IconBriefcase stroke={1.5} />, text: "Jobs", path: "/" },
      // Other menu items based on role
      ...(isAdmin || isEmployee
        ? [
            {
              icon: <IconUserShare stroke={1.5} />,
              text: "Leaves",
              path: "/leaves",
            },
            {
              icon: <IconVideo stroke={1.5} />,
              text: "Recordings",
              path: "/recordings",
            },
          ]
        : []),
    ];
    return items;
  }, [isAdmin, isEmployee, isJobSeeker]);

  return (
    <div className="flex flex-col justify-between w-[242px] h-screen sticky top-0">
      {/* Nav Section */}
      <div className="flex flex-col items-start pt-8 gap-6">
        {/* Logo */}
        <div className="px-4 w-full">
          <div className="w-[83px] h-[32px]">
            <img src={Logo} alt="Logo" className="w-full h-full" />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-start px-2 gap-1 w-full">
          {navItems.map((item, index) => (
            <Link
              key={index}
              to={item.path}
              className={`flex flex-row items-center p-3 gap-3 w-[226px] h-[40px] rounded-md ${
                isActive(item.path)
                  ? "bg-[#F9F5FF]"
                  : "bg-[#FCFCFD] hover:bg-gray-100"
              }`}
            >
              <div className="flex flex-row items-center gap-3">
                <span
                  className={`${
                    isActive(item.path) ? "text-[#6941C6]" : "text-[#667085]"
                  }`}
                >
                  {item.icon}
                </span>
                <span
                  className={`text-sm font-medium ${
                    isActive(item.path)
                      ? "text-[#6941C6] text-base"
                      : "text-[#344054]"
                  }`}
                >
                  {item.text}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Footer Section - No changes to Settings link */}
      <div className="flex flex-col items-start pb-8 px-2 gap-6 mt-auto">
        {/* Settings Navigation Link */}
        <div className="flex flex-col items-start w-full">
          <Link
            to="/settings"
            className={`flex flex-row items-center p-3 gap-3 w-[226px] h-[40px] rounded-md ${
              isActive("/settings")
                ? "bg-[#F9F5FF]"
                : "bg-[#FCFCFD] hover:bg-gray-100"
            }`}
          >
            <div className="flex flex-row items-center gap-3">
              <span
                className={`${
                  isActive("/settings") ? "text-[#6941C6]" : "text-[#667085]"
                }`}
              >
                <IconSettings stroke={1.5} />
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive("/settings")
                    ? "text-[#6941C6] text-base"
                    : "text-[#344054]"
                }`}
              >
                Settings
              </span>
            </div>
          </Link>
        </div>

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#EAECF0]"></div>

        {/* Account - Update to show job seeker role */}
        <div className="flex flex-row justify-between items-center px-2 w-full">
          <div className="flex flex-row items-center gap-3">
            {/* Avatar - No changes */}
            <div className="w-[40px] h-[40px] rounded-full bg-gray-300 overflow-hidden">
              {user?.user_metadata?.avatar_url ? (
                <img
                  src={user.user_metadata.avatar_url}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                    user?.email?.split("@")[0] || "User"
                  )}&background=6941C6&color=fff`}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* User Info - Update role display */}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-[#101828]">
                {user?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-sm text-[#667085]">
                {isAdmin ? "Admin" : isEmployee ? "Employee" : "Job Seeker"}
              </span>
            </div>
          </div>

          {/* Logout Button - No changes */}
          <button
            onClick={() => logout()}
            className="w-[36px] h-[36px] flex items-center justify-center rounded-md hover:bg-gray-100"
            aria-label="Logout"
          >
            <IconLogout stroke={1.5} className="text-[#667085]" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
