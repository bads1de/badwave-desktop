"use client";

import { isElectron } from "@/libs/electron-utils";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-y-6 bg-gradient-to-b from-neutral-900 to-black">
      <div className="flex flex-col items-center gap-y-4">
        <h1 className="text-4xl font-bold text-white">BadWave</h1>
        <p className="text-neutral-400 text-lg">
          音楽を聴くための最高のプラットフォーム
        </p>
        {isElectron() && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <p className="text-white">
              Electronデスクトップアプリで実行中です！
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
