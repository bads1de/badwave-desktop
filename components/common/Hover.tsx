import React from "react";
import { memo } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Portal } from "@radix-ui/react-portal";

interface HoverCardProps {
  children: React.ReactNode;
  description?: string;
  contentSize?: string;
  side?: "left" | "right" | "top" | "bottom";
  isCollapsed?: boolean;
}

// コンポーネント関数を定義
const HoverComponent = ({
  children,
  description,
  contentSize,
  side = "bottom",
  isCollapsed = false,
}: HoverCardProps) => {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCardTrigger>
      <Portal>
        <HoverCardContent
          side={side}
          className={`${contentSize} rounded-xl transition-all duration-300 pointer-events-auto ${
            isCollapsed ? "translate-x-2" : "translate-x-0"
          }`}
          sideOffset={isCollapsed ? 10 : 5}
        >
          <div className="flex items-center justify-center h-full">
            <p className="text-sm">{description}</p>
          </div>
        </HoverCardContent>
      </Portal>
    </HoverCard>
  );
};

// displayName を設定
HoverComponent.displayName = "Hover";

// memo でラップしてエクスポート
const Hover = memo(HoverComponent);

export default Hover;
