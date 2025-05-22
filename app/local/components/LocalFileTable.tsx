"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Play, Music, Clock, Disc, User } from "lucide-react";
import { formatTime } from "@/libs/helpers";

// Electron APIの型定義 (必要に応じて拡張)
export interface ElectronApi {
  ipc: {
    invoke: (channel: string, ...args: any[]) => Promise<any>;
  };
}

// ローカルファイルの型定義
export interface LocalFile {
  path: string;
  metadata?: any;
  error?: string;
}

interface LocalFileTableProps {
  mp3Files: LocalFile[];
  onPlayFile: (file: LocalFile) => void;
}

const LocalFileTable: React.FC<LocalFileTableProps> = ({
  mp3Files,
  onPlayFile,
}) => {
  // テーブルのカラム定義
  const columns = useMemo<ColumnDef<LocalFile>[]>(
    () => [
      {
        id: "title",
        accessorFn: (row) => {
          // 検索用の値を返す関数
          return (
            row.metadata?.common?.title ||
            (row.path ? row.path.split(/[\\/]/).pop() : "")
          );
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-purple-400" />
            <span>タイトル</span>
          </div>
        ),
        cell: ({ row }) => {
          const file = row.original;
          const title =
            file.metadata?.common?.title ||
            (file.path ? file.path.split(/[\\/]/).pop() : "読み込み中...");

          return (
            <div className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-[#202020] rounded-md flex items-center justify-center mr-2 group-hover:bg-purple-900/30 transition-colors duration-300">
                <Play className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-white truncate max-w-[300px] group-hover:text-purple-300 transition-colors duration-300">
                  {title}
                </span>
                {file.error && (
                  <span className="text-red-400 text-xs">メタデータエラー</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        id: "artist",
        accessorFn: (row) => {
          return row.metadata?.common?.artist || "不明なアーティスト";
        },
        header: () => (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-purple-400" />
            <span>アーティスト</span>
          </div>
        ),
        cell: ({ row }) => {
          const artist =
            row.original.metadata?.common?.artist || "不明なアーティスト";
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300">
                {artist}
              </span>
            </div>
          );
        },
      },
      {
        id: "album",
        accessorFn: (row) => {
          return row.metadata?.common?.album || "不明なアルバム";
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Disc className="h-4 w-4 text-purple-400" />
            <span>アルバム</span>
          </div>
        ),
        cell: ({ row }) => {
          const album =
            row.original.metadata?.common?.album || "不明なアルバム";
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300 truncate max-w-[200px]">
                {album}
              </span>
            </div>
          );
        },
      },
      {
        id: "duration",
        accessorFn: (row) => {
          return row.metadata?.format?.duration || 0;
        },
        header: () => (
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-purple-400" />
            <span>長さ</span>
          </div>
        ),
        cell: ({ row }) => {
          const duration = row.original.metadata?.format?.duration || 0;
          return (
            <div className="flex items-center">
              <span className="text-neutral-300 group-hover:text-white transition-colors duration-300 font-mono">
                {formatTime(duration)}
              </span>
            </div>
          );
        },
      },
      {
        id: "genre",
        accessorFn: (row) => row.metadata?.common?.genre?.[0] || "",
        header: () => (
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-xs">#</span>
            <span>ジャンル</span>
          </div>
        ),
        cell: ({ row }) => {
          const genre = row.original.metadata?.common?.genre?.[0] || "不明";
          return genre !== "不明" ? (
            <div className="flex items-center">
              <span className="px-2 py-1 rounded-full text-xs bg-purple-900/20 text-purple-300 border border-purple-800/30">
                {genre}
              </span>
            </div>
          ) : (
            <span className="text-neutral-500 text-xs">-</span>
          );
        },
      },
    ],
    []
  );

  return (
    <DataTable
      columns={columns}
      data={mp3Files}
      searchKey="title"
      onRowClick={onPlayFile}
    />
  );
};

export default LocalFileTable;
