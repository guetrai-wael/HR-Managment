import React, { useCallback, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  IconHome,
  IconClipboardText,
  IconUsersPlus,
  IconBriefcase,
  IconVideo,
  IconSettings,
  IconLogout,
  IconCalendarEvent,
} from "@tabler/icons-react";

import { formatRoleForDisplay } from "../../types/roles";
import UserAvatar from "./UserAvatar";
import { useUser, useRole } from "../../hooks";
import { useAuth } from "../../hooks/useAuth";
import Logo from "../../assets/icons/Logo.svg";

const Sidebar: React.FC = () => {
  const { user, profile, profileLoading } = useUser();

  // 🆕 NEW: Using pure standardized structure
  const {
    data: { isAdmin, isEmployee, isJobSeeker, roleName },
  } = useRole();
  const location = useLocation();

  // 🆕 NEW: Using standardized structure
  const { actions } = useAuth();

  const isActive = useCallback(
    (path: string) => {
      // Special handling for dashboard root path
      if (path === "/") {
        return location.pathname === "/";
      }
      return location.pathname === path;
    },
    [location]
  );

  // Create appropriate navigation items based on user role
  const navItems = useMemo(() => {
    const items = [
      // Dashboard only for admin and employee, not job seekers
      ...(isAdmin || isEmployee
        ? [
            {
              icon: <IconHome stroke={1.5} />,
              text: "Dashboard",
              path: "/",
            },
          ]
        : []),
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
              icon: <IconCalendarEvent stroke={1.5} />,
              text: "Leaves",
              path: "/leaves",
            },
          ]
        : []),
      // Jobs is visible to all
      { icon: <IconBriefcase stroke={1.5} />, text: "Jobs", path: "/jobs" },
      // Employee-specific links (if not admin)
      ...(isEmployee && !isAdmin
        ? [
            {
              icon: <IconCalendarEvent stroke={1.5} />,
              text: "Leaves",
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

    // Deduplicate navItems based on path
    const uniqueNavItems = items.reduce((acc, current) => {
      const x = acc.find((item) => item.path === current.path);
      if (!x) {
        return acc.concat([current]);
      }
      return acc;
    }, [] as typeof items);

    return uniqueNavItems;
  }, [isAdmin, isEmployee, isJobSeeker]);
  return (
    <div className="flex flex-col justify-between w-52 h-screen sticky top-0">
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
              className={`flex flex-row items-center p-3 gap-3 w-full h-[40px] rounded-md ${
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

      {/* Footer Section */}
      <div className="flex flex-col items-start pb-8 px-2 gap-6 mt-auto">
        {/* Settings Navigation Link */}
        {user && (
          <div className="flex flex-col items-start w-full">
            <Link
              to="/settings"
              className={`flex flex-row items-center p-3 gap-3 w-full h-[40px] rounded-md ${
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

        {/* User Account Section */}
        <div className="flex flex-row justify-between items-center px-2 w-full gap-2">
          <div className="flex flex-row items-center gap-3 min-w-0">
            {/* Avatar */}
            <UserAvatar
              src={profile?.avatar_url || user?.user_metadata?.avatar_url}
              firstName={
                profile?.first_name ||
                user?.user_metadata?.first_name ||
                user?.email?.split("@")[0]
              }
              lastName={profile?.last_name || user?.user_metadata?.last_name}
              size={40}
            />

            {/* User Info */}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-[#101828] truncate">
                {profileLoading
                  ? "Loading..."
                  : profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.user_metadata?.first_name &&
                    user?.user_metadata?.last_name
                  ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
                  : user?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-sm text-[#667085] truncate">
                {profileLoading
                  ? "Loading role..."
                  : isAdmin 
                    ? "Admin" 
                    : profile?.position || formatRoleForDisplay(roleName)}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => actions.logout()}
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
