import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useLikeStatus from "@/hooks/data/useLikeStatus";
import useLikeMutation from "@/hooks/data/useLikeMutation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { memo, useCallback } from "react";

interface LikeButtonProps {
  songId: string;
  songType: "regular";
  size?: number;
  showText?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = memo(
  ({ songId, songType, size, showText = false }) => {
    const { user } = useUser();
    const authModal = useAuthModal();

    // いいね状態を取得
    const { isLiked } = useLikeStatus(songId, user?.id);

    // いいね操作のミューテーション
    const likeMutation = useLikeMutation(songId, user?.id);

    const Icon = isLiked ? AiFillHeart : AiOutlineHeart;

    // いいねボタンのクリックハンドラーをメモ化
    const handleLike = useCallback(() => {
      if (!user) {
        return authModal.onOpen();
      }

      likeMutation.mutate(isLiked);
    }, [authModal, likeMutation, user]);

    return (
      <button
        onClick={handleLike}
        className="text-neutral-400 cursor-pointer hover:text-white hover:filter hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all duration-300"
        aria-label={isLiked ? "Remove like" : "Add like"}
        disabled={likeMutation.isPending}
      >
        <div className="flex items-center">
          <Icon color={isLiked ? "#FF69B4" : "white"} size={size || 25} />
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
