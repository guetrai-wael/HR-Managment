import React from "react";
import { Avatar as AntAvatar, Tooltip } from "antd"; // Import AntAvatar for consistency
import { UserOutlined } from "@ant-design/icons";

interface UserAvatarProps {
  src?: string | null;
  firstName?: string | null; // Changed from name to firstName
  lastName?: string | null; // Added lastName
  email?: string | null; // Added email for secondary text
  size?: number | "small" | "large" | "default"; // Allow Ant Design sizes
  className?: string;
  showName?: boolean; // Prop to control name display
  nameDisplayOrder?: "firstLast" | "lastFirst";
  nameClassName?: string; // Class for the name text
  emailClassName?: string; // Class for the email text
  containerClassName?: string; // Class for the main container div
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  firstName,
  lastName,
  email,
  size = "default",
  className = "",
  showName = false,
  nameDisplayOrder = "firstLast",
  nameClassName = "font-medium",
  emailClassName = "text-xs text-gray-500",
  containerClassName = "flex items-center space-x-3", // Default spacing
}) => {
  const fullName =
    nameDisplayOrder === "firstLast"
      ? `${firstName || ""} ${lastName || ""}`.trim()
      : `${lastName || ""} ${firstName || ""}`.trim();

  const initials = `${firstName ? firstName[0] : ""}${
    lastName ? lastName[0] : ""
  }`.toUpperCase();

  const avatarRenderNode = (
    <AntAvatar
      src={src}
      size={size}
      icon={!src && !initials ? <UserOutlined /> : undefined}
      className={className}
      style={{ verticalAlign: "middle" }}
    >
      {!src && initials ? initials : null}
    </AntAvatar>
  );

  // Determine if the avatar is standalone (no name/email displayed alongside it)
  const isStandaloneAvatar = !showName && !email;

  // Add tooltip only if it's a standalone avatar and not an image source
  const avatarWithTooltipIfNeeded =
    isStandaloneAvatar && !src && fullName ? (
      <Tooltip title={fullName}>{avatarRenderNode}</Tooltip>
    ) : (
      avatarRenderNode
    );

  if (isStandaloneAvatar) {
    return avatarWithTooltipIfNeeded;
  }

  return (
    <div className={containerClassName}>
      {/* Render avatar (potentially with tooltip if it were standalone and no src, but handled by avatarWithTooltipIfNeeded if we decide to use it here too) */}
      {avatarRenderNode}{" "}
      {/* Using avatarRenderNode directly as name/email will be shown */}
      {(showName || email) && (
        <div className="flex flex-col overflow-hidden ml-1">
          {" "}
          {/* Added ml-1 for a slight gap if space-x isn't enough, can be adjusted */}
          {showName && fullName && (
            <span className={`${nameClassName} truncate`}>{fullName}</span>
          )}
          {email && (
            <span className={`${emailClassName} truncate`}>{email}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAvatar;
