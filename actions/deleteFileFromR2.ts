import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { toast } from "react-hot-toast";
import s3Client from "@/libs/s3";

interface DeleteFileFromR2Props {
  bucketName: "spotlight" | "song" | "image" | "video";
  showToast?: boolean;
  filePath: string;
}

/**
 * Cloudflare R2から指定したファイルを削除する
 * @param {Object} params
 * @param {'spotlight' | 'song' | 'image' | 'video'} params.bucketName - バケット名
 * @param {string} params.filePath - 削除するファイルのパス
 * @param {boolean} [params.showToast] - トースト通知を表示するか
 * @returns {Promise<void>}
 */
const deleteFileFromR2 = async ({
  bucketName,
  filePath,
  showToast,
}: DeleteFileFromR2Props) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(command);

    if (showToast) {
      toast.success("ファイルを削除しました");
    }
  } catch (error) {
    console.error("R2 delete error:", error);

    if (showToast) {
      toast.error("ファイルを削除できませんでした");
    }
  }
};

export default deleteFileFromR2;
