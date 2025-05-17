"use client";

interface RightSidebarProps {
  children: React.ReactNode;
}

const RightSidebar: React.FC<RightSidebarProps> = ({ children }) => {
  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      {children}
    </div>
  );
};

export default RightSidebar;
