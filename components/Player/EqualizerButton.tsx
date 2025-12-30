import React from "react";
import { SlidersVertical } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useEqualizerStore from "@/hooks/stores/useEqualizerStore";
import EqualizerControl from "../Equalizer/EqualizerControl";

const EqualizerButton: React.FC = () => {
  const isEqualizerEnabled = useEqualizerStore((state) => state.isEnabled);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`cursor-pointer transition-all duration-300 hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] ${
            isEqualizerEnabled
              ? "text-theme-500 drop-shadow-[0_0_8px_var(--glow-color)]"
              : "text-neutral-400 hover:text-white"
          }`}
        >
          <SlidersVertical size={20} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="end"
        sideOffset={10}
        className="w-auto p-0 border-none bg-transparent"
      >
        <EqualizerControl />
      </PopoverContent>
    </Popover>
  );
};

export default EqualizerButton;
