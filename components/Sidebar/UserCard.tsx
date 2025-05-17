"use client";

import { FaUserCircle } from "react-icons/fa";

interface UserCardProps {
  userDetails?: any;
  isCollapsed?: boolean;
}

const UserCard: React.FC<UserCardProps> = ({
  userDetails,
  isCollapsed = false,
}) => {
  return (
    <div className="flex items-center gap-x-2 p-2 bg-neutral-800/50 rounded-lg mx-2">
      <FaUserCircle size={isCollapsed ? 24 : 32} className="text-neutral-300" />
      {!isCollapsed && (
        <div className="flex flex-col">
          <p className="text-sm font-medium text-white">
            {userDetails?.full_name || "ゲスト"}
          </p>
          {userDetails?.email && (
            <p className="text-xs text-neutral-400 truncate">
              {userDetails.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserCard;
