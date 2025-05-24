import { Song } from "@/types";
import { LocalFile } from "@/app/local/components/LocalFileTable";
import { generateLocalSongId } from "./songUtils";

/**
 * ローカルファイルデータをSong型に変換するヘルパー関数
 *
 * @param {LocalFile} file - 変換するローカルファイル
 * @returns {Song} Song型に変換されたデータ
 */
export function mapFileToSong(file: LocalFile): Song {
  // ファイルパスからタイトルを抽出（メタデータがない場合用）
  const titleFromFile = file.path
    ? file.path.split(/[\\/]/).pop() || "不明なタイトル"
    : "不明なタイトル";

  return {
    id: generateLocalSongId(file.path), // ローカル曲用のIDを生成
    user_id: "local_user", // ローカルファイル用の固定ユーザーID
    author: file.metadata?.common?.artist || "不明なアーティスト",
    title: file.metadata?.common?.title || titleFromFile,
    song_path: file.path,
    image_path: "", // ローカルファイルの画像パスは現在未対応
    video_path: "",
    genre: file.metadata?.common?.genre?.[0] || "",
    duration: file.metadata?.format?.duration || 0,
    created_at: new Date().toISOString(), // 現在時刻を作成日時として使用
    public: false, // ローカルファイルは非公開
  };
}
