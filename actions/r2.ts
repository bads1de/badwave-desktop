"use server";

import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { sanitizeTitle } from "@/libs/utils";
import s3Client from "@/libs/s3";
import { requireAdmin } from "@/libs/admin";

// ============================================================================
// Types
// ============================================================================

/**
 * R2のバケット名
 */
export type BucketName = "spotlight" | "song" | "image" | "video" | "pulse";

/**
 * アップロード結果
 */
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * 削除結果
 */
export interface DeleteResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// Upload
// ============================================================================

/**
 * R2にファイルをアップロードし、アップロードされたファイルのURLを返します。
 * これはServer Actionです - クライアントから直接呼び出せます。
 *
 * @param formData - アップロードするファイルとメタデータを含むFormData
 * @returns {Promise<UploadResult>} - アップロード結果
 */
export async function uploadFileToR2(
  formData: FormData
): Promise<UploadResult> {
  try {
    // 管理者権限チェック
    await requireAdmin();

    const file = formData.get("file") as File | null;
    const bucketName = formData.get("bucketName") as BucketName | null;
    const fileNamePrefix = formData.get("fileNamePrefix") as string | null;

    if (!file || !bucketName) {
      return {
        success: false,
        error: "ファイルとバケット名は必須です",
      };
    }

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      return {
        success: false,
        error: "ファイルのサイズが50MBを超えています",
      };
    }

    // ファイル名から拡張子を抽出
    const originalName = file.name;
    const lastDotIndex = originalName.lastIndexOf(".");
    const extension =
      lastDotIndex !== -1 ? originalName.slice(lastDotIndex) : "";
    const baseName =
      lastDotIndex !== -1 ? originalName.slice(0, lastDotIndex) : originalName;

    const fileName = `${fileNamePrefix || "file"}-${sanitizeTitle(
      baseName
    )}-${Date.now()}${extension}`;

    // FileをBuffer/Uint8Arrayに変換
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      ACL: "public-read",
    });

    await s3Client.send(command);

    let url: string;
    switch (bucketName) {
      case "spotlight":
        url = `${process.env.R2_SPOTLIGHT_URL}/${fileName}`;
        break;
      case "song":
        url = `${process.env.R2_SONG_URL}/${fileName}`;
        break;
      case "image":
        url = `${process.env.R2_IMAGE_URL}/${fileName}`;
        break;
      case "video":
        url = `${process.env.R2_VIDEO_URL}/${fileName}`;
        break;
      case "pulse":
        url = `${process.env.R2_PULSE_URL}/${fileName}`;
        break;
      default:
        return {
          success: false,
          error: "不正なバケット名です",
        };
    }

    return {
      success: true,
      url,
    };
  } catch (error: any) {
    console.error("R2 upload error:", error);
    return {
      success: false,
      error: error.message || "ファイルのアップロードに失敗しました",
    };
  }
}

// ============================================================================
// Delete
// ============================================================================

/**
 * Cloudflare R2から指定したファイルを削除する
 * これはServer Actionです - クライアントから直接呼び出せます。
 *
 * @param bucketName - バケット名
 * @param filePath - 削除するファイルのパス（ファイル名のみ）
 * @returns {Promise<DeleteResult>} - 削除結果
 */
export async function deleteFileFromR2(
  bucketName: BucketName,
  filePath: string
): Promise<DeleteResult> {
  try {
    // 管理者権限チェック
    await requireAdmin();

    if (!bucketName || !filePath) {
      return {
        success: false,
        error: "バケット名とファイルパスは必須です",
      };
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: filePath,
    });

    await s3Client.send(command);

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("R2 delete error:", error);
    return {
      success: false,
      error: error.message || "ファイルの削除に失敗しました",
    };
  }
}
