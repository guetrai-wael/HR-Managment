import { useCallback, useMemo } from "react";
import { useUser, useRole } from "../../hooks/index";
import { useAuth } from "../../hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import {
  IconHome,
  IconClipboardText,
  IconUsersPlus,
  IconBriefcase,
  IconVideo,
  IconSettings,
  IconLogout,
  IconCalendarEvent, // Used for all Leaves links
} from "@tabler/icons-react";

import Logo from "../../assets/icons/Logo.svg";
import UserAvatar from "./UserAvatar"; // Import UserAvatar

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
      // Show Applications to all authenticated users
      ...(isAdmin || isEmployee || isJobSeeker
        ? [
            {
              icon: <IconClipboardText stroke={1.5} />,
              text: "Applications",
              path: "/applications",
            },
          ]
        : []),
      // Admin-specific links
      ...(isAdmin
        ? [
            {
              icon: <IconUsersPlus stroke={1.5} />,
              text: "Employees",
              path: "/employees",
            },
            {
              icon: <IconCalendarEvent stroke={1.5} />, // Consistent icon
              text: "Leaves", // Consistent label
              path: "/leaves", // Points to the consolidated leave page
            },
          ]
        : []),
      // Jobs is visible to all
      { icon: <IconBriefcase stroke={1.5} />, text: "Jobs", path: "/" },
      // Employee-specific links (if not admin)
      ...(isEmployee && !isAdmin // Show "My Leaves" only if employee AND not admin (admin already has a "Leaves" link)
        ? [
            {
              icon: <IconCalendarEvent stroke={1.5} />,
              text: "Leaves", // Consistent label
              path: "/leaves",
            },
          ]
        : []),
      // Links for both admin and employee (excluding job seekers for recordings)
      ...(isAdmin || isEmployee
        ? [
            {
              icon: <IconVideo stroke={1.5} />,
              text: "Recordings",
              path: "/recordings",
            },
          ]
        : []),
    ];
    // Deduplicate navItems based on path to avoid multiple "Leaves" links for admins who are also employees
    const uniqueNavItems = items.reduce((acc, current) => {
      const x = acc.find((item) => item.path === current.path);
      if (!x) {
        return acc.concat([current]);
      }
      // If admin and employee both have a /leaves path, prioritize the admin one (which is typically earlier in the array)
      // Or, ensure the logic above correctly assigns only one /leaves path for such users.
      // The current logic: admin gets a /leaves. If user is employee AND NOT admin, they get a /leaves.
      // This should prevent duplicates. If an admin is also an employee, the isAdmin block adds the /leaves link,
      // and the (isEmployee && !isAdmin) block is skipped for that user.
      return acc;
    }, [] as typeof items);

    return uniqueNavItems;
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

      {/* Footer Section - Settings link is already present and should be visible to all logged-in users by default */}
      {/* The visibility of the settings link itself is not role-restricted here, but the page it leads to is guarded by EmployeeGuard */}
      <div className="flex flex-col items-start pb-8 px-2 gap-6 mt-auto">
        {/* Settings Navigation Link */}
        {user && ( // Show Settings link if user is logged in
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
        )}

        {/* Divider */}
        <div className="h-[1px] w-full bg-[#EAECF0]"></div>

        {/* Account - Update to show job seeker role */}
        <div className="flex flex-row justify-between items-center px-2 w-full">
          <div className="flex flex-row items-center gap-3">
            {/* Avatar - Use UserAvatar component */}
            <UserAvatar
              src={user?.user_metadata?.avatar_url}
              firstName={
                user?.user_metadata?.first_name || user?.email?.split("@")[0]
              }
              lastName={user?.user_metadata?.last_name}
              email={user?.email}
              size={40}
            />

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
