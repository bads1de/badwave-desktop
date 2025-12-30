import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useLikeStatus from "@/hooks/data/useLikeStatus";
import useLikeMutation from "@/hooks/mutations/useLikeMutation";
import { Heart } from "lucide-react";
import { memo, useCallback } from "react";

interface LikeButtonProps {
  songId: string;
  songType: "regular";
  size?: number;
  showText?: boolean;
  disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = memo(
  ({ songId, songType, size, showText = false, disabled = false }) => {
    const { user } = useUser();
    const authModal = useAuthModal();

    // いいね状態を取得
    const { isLiked } = useLikeStatus(songId, user?.id);

    // いいね操作のミューテーション
    const likeMutation = useLikeMutation(songId, user?.id);

    // いいねボタンのクリックハンドラーをメモ化
    const handleLike = useCallback(() => {
      if (disabled) return;

      if (!user) {
        return authModal.onOpen();
      }

      likeMutation.mutate(isLiked);
    }, [authModal, likeMutation, user, isLiked, disabled]);

    return (
      <button
        onClick={handleLike}
        className={`text-neutral-400 transition-all duration-300 ${
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        }`}
        aria-label={isLiked ? "Remove like" : "Add like"}
        disabled={likeMutation.isPending || disabled}
      >
        <div className="flex items-center">
          <Heart
            fill={isLiked ? "#FF69B4" : "none"}
            color={isLiked ? "#FF69B4" : "white"}
            size={size || 25}
          />
          {showText && (
            <span className="ml-2">{isLiked ? "いいね済み" : "いいね"}</span>
          )}
        </div>
      </button>
    );
  }
);

// 表示名を設定
LikeButton.displayName = "LikeButton";

export default LikeButton;
