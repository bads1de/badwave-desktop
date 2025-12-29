import React, { useState, useRef, memo } from "react";
import { Spotlight } from "@/types";
import useSpotlightModal from "@/hooks/modal/useSpotlightModal";
import ScrollableContainer from "./common/ScrollableContainer";
import useVolumeStore from "@/hooks/stores/useVolumeStore";
import { useNetworkStatus } from "@/hooks/utils/useNetworkStatus";
import { WifiOff } from "lucide-react";

interface SpotlightBoardProps {
  spotlightData: Spotlight[];
}

// コンポーネント関数を定義
const SpotlightBoardComponent: React.FC<SpotlightBoardProps> = ({
  spotlightData,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showArrows, setShowArrows] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef<HTMLVideoElement[]>([]);
  const spotlightModal = useSpotlightModal();
  const { volume } = useVolumeStore();
  const { isOnline } = useNetworkStatus();

  const handleVideoHover = (index: number) => {
    setHoveredIndex(index);
    if (videoRefs.current[index]) {
      videoRefs.current[index]
        .play()
        .catch((error) => console.log("Video play failed:", error));
    }
  };

  const handleVideoLeave = () => {
    setHoveredIndex(null);
    videoRefs.current.forEach((video) => {
      if (video) video.pause();
    });
  };

  const handleMuteToggle = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    if (!newMutedState) {
      // ミュートが解除された場合
      videoRefs.current.forEach((video) => {
        if (video) {
          video.volume = volume;
        }
      });
    }
  };

  return (
    <div
      className="w-full cursor-pointer"
      onMouseEnter={() => setShowArrows(true)}
      onMouseLeave={() => setShowArrows(false)}
    >
      <ScrollableContainer showArrows={showArrows} className="p-4">
        <div className="flex gap-4">
          {spotlightData.map((item, index) => (
            <div
              key={item.id}
              className={`flex-none w-40 relative aspect-[9/16] rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group ${
                !isOnline ? "opacity-50" : ""
              }`}
              onMouseEnter={() => isOnline && handleVideoHover(index)}
              onMouseLeave={handleVideoLeave}
              onClick={() => isOnline && spotlightModal.onOpen(item)}
            >
              {isOnline ? (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current[index] = el;
                      el.volume = volume;
                    }
                  }}
                  src={item.video_path}
                  muted={isMuted}
                  playsInline
                  loop
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                  <WifiOff className="w-8 h-8 text-neutral-500" />
                </div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleMuteToggle();
                }}
                className="absolute bottom-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
              >
                <svg
                  className="w-4 h-4 text-white/80"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMuted ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM16 12l4 4m0-4l-4 4"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                    />
                  )}
                </svg>
              </button>
            </div>
          ))}
        </div>
      </ScrollableContainer>
    </div>
  );
};

// displayName を設定
SpotlightBoardComponent.displayName = "SpotlightBoard";

// memo でラップしてエクスポート
const SpotlightBoard = memo(SpotlightBoardComponent);

export default SpotlightBoard;
