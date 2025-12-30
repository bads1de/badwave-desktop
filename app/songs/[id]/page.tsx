"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  memo,
  useCallback,
  use,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Heart,
  Share2,
  Download,
  Edit2,
  Clock,
  Music2,
  Pause,
  ClipboardCopy,
  Cloud,
  CloudOff,
} from "lucide-react";
import { MdLyrics } from "react-icons/md";
import Image from "next/image";
import Link from "next/link";
import useGetSongById from "@/hooks/data/useGetSongById";
import { useUser } from "@/hooks/auth/useUser";
import useGetSongsByGenres from "@/hooks/data/useGetSongGenres";
import EditModal from "@/components/Modals/EditModal";
import { downloadFile } from "@/libs/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import AudioWaveform from "@/components/AudioWaveform";
import { getRandomColor } from "@/libs/utils";
import useAudioWaveStore from "@/hooks/audio/useAudioWave";
import useDownloadSong from "@/hooks/utils/useDownloadSong";
import { electronAPI } from "@/libs/electron";
import { isLocalSong } from "@/libs/songUtils";

interface SongPageProps {
  params: Promise<{
    id: string;
  }>;
}

const SongPage = (props: SongPageProps) => {
  const params = use(props.params);
  const songId = params.id;

  const { song } = useGetSongById(songId);
  const { user } = useUser();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"lyrics" | "similar">("lyrics");
  const [duration, setDuration] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState(getRandomColor());
  const [secondaryColor, setSecondaryColor] = useState(getRandomColor());
  const [audioWaveformKey, setAudioWaveformKey] = useState(0);

  const genres = useMemo(
    () => song?.genre?.split(",").map((g) => g.trim()) || [],
    [song?.genre]
  );

  const { songGenres } = useGetSongsByGenres(genres, songId);

  const { isPlaying, play, pause, currentSongId, initializeAudio } =
    useAudioWaveStore();

  // オフラインキャッシュ用のフック
  const {
    download: cacheLocally,
    remove: removeCache,
    isDownloading: isCaching,
    isDownloaded: isCached,
  } = useDownloadSong(song ?? null);

  const isElectron = electronAPI.isElectron();

  useEffect(() => {
    setPrimaryColor(getRandomColor());
    setSecondaryColor(getRandomColor());
  }, [songId]);

  const handlePlayClick = useCallback(async () => {
    if (!song?.song_path) {
      console.error("曲のパスが存在しません");
      return;
    }

    try {
      console.log("再生を開始します", { songId, currentSongId });

      if (currentSongId !== songId) {
        await initializeAudio(song.song_path, songId);
        await play();
      } else {
        if (isPlaying) {
          pause();
        } else {
          await play();
        }
      }
    } catch (error) {
      console.error("再生処理中にエラーが発生しました:", error);
    }
  }, [
    song?.song_path,
    songId,
    currentSongId,
    isPlaying,
    initializeAudio,
    play,
    pause,
  ]);

  const handlePlaybackEnded = useCallback(() => {
    pause();
    setAudioWaveformKey((prevKey) => prevKey + 1);
  }, [pause]);

  useEffect(() => {
    if (song?.song_path) {
      const audio = new Audio(song.song_path);
      audio.addEventListener("loadedmetadata", () => {
        const minutes = Math.floor(audio.duration / 60);
        const seconds = Math.floor(audio.duration % 60);
        setDuration(`${minutes}:${seconds.toString().padStart(2, "0")}`);
      });
    }
  }, [song?.song_path]);

  const handleDownloadClick = useCallback(async () => {
    setIsLoading(true);

    if (song?.song_path) {
      await downloadFile(song.song_path, `${song.title || "Untitled"}.mp3`);
    }

    setIsLoading(false);
  }, [song?.song_path, song?.title]);

  const copyLyricsToClipboard = useCallback(() => {
    try {
      navigator.clipboard.writeText(song?.lyrics || "");
      toast.success("Lyrics copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy lyrics.");
    }
  }, [song?.lyrics]);

  if (!song) {
    return (
      <div className="bg-[#0d0d0d] rounded-lg w-full h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-theme-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d0d] rounded-lg w-full h-full overflow-hidden overflow-y-auto custom-scrollbar">
      <div className="min-h-screen bg-gradient-to-b bg-black text-white">
        {/* Hero Section */}
        <div className="relative h-[50vh] md:h-[60vh] w-full">
          <Image
            src={song?.image_path || "/images/loading.gif"}
            alt="Song Cover"
            fill
            className="object-cover opacity-40"
            unoptimized
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
          />
          <AudioWaveform
            key={audioWaveformKey}
            audioUrl={song.song_path!}
            isPlaying={isPlaying}
            onPlayPause={handlePlayClick}
            onEnded={handlePlaybackEnded}
            primaryColor={primaryColor}
            secondaryColor={secondaryColor}
            imageUrl={song.image_path!}
            songId={songId}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-7xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-end gap-6">
                {/* Album Art */}
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="hidden md:block w-48 h-48 md:w-64 md:h-64 relative rounded-lg overflow-hidden shadow-2xl flex-shrink-0"
                >
                  <Image
                    src={song?.image_path || "/images/wait.jpg"}
                    alt="Song Cover"
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                  />
                  <motion.div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-all cursor-pointer"
                    onClick={handlePlayClick}
                  >
                    <Play size={48} className="text-white" />
                  </motion.div>
                </motion.div>

                {/* Song Info */}
                <div className="flex-grow">
                  <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-theme-400 to-theme-600">
                    {song.title}
                  </h1>
                  <p className="text-xl md:text-2xl text-gray-300 mb-4">
                    {song.author}
                  </p>

                  {/* Stats */}
                  <div className="flex gap-6 mb-6 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Play size={16} />
                      <span>{song.count} plays</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart size={16} />
                      <span>{song.like_count} likes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{duration}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handlePlayClick}
                      className="bg-theme-600 hover:bg-theme-700"
                    >
                      {isPlaying ? (
                        <Pause className="mr-2" size={16} />
                      ) : (
                        <Play className="mr-2" size={16} />
                      )}
                      {isPlaying ? "Pause" : "Play Now"}
                    </Button>
                    <Button
                      onClick={handleDownloadClick}
                      disabled={isLoading}
                      variant="outline"
                      className="border-theme-600 text-theme-600 hover:bg-theme-600/10"
                    >
                      <Download className="mr-2" size={16} />
                      {isLoading ? "Downloading..." : "Download"}
                    </Button>
                    {/* オフラインキャッシュボタン（Electron環境かつ非ローカル曲のみ） */}
                    {isElectron && !isLocalSong(song) && (
                      <Button
                        onClick={isCached ? removeCache : cacheLocally}
                        disabled={isCaching}
                        variant="outline"
                        className={
                          isCached
                            ? "border-green-500 text-green-500 hover:bg-green-500/10"
                            : "border-theme-500 text-theme-500 hover:bg-theme-500/10"
                        }
                      >
                        {isCached ? (
                          <>
                            <CloudOff className="mr-2" size={16} />
                            {isCaching ? "削除中..." : "キャッシュ削除"}
                          </>
                        ) : (
                          <>
                            <Cloud className="mr-2" size={16} />
                            {isCaching ? "保存中..." : "オフライン保存"}
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="border-theme-700 text-theme-700 hover:bg-theme-700/10"
                    >
                      <Share2 className="mr-2" size={16} />
                      Share
                    </Button>
                    {user?.id === song.user_id && (
                      <Button
                        onClick={() => setIsEditModalOpen(true)}
                        variant="outline"
                        className="border-theme-400 text-theme-400 hover:bg-theme-400/10"
                      >
                        <Edit2 className="mr-2" size={16} />
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Genre Tags */}
          <div className="flex flex-wrap gap-2 mb-12">
            {genres.map((genre) => (
              <Link href={`/genre/${encodeURIComponent(genre)}`} key={genre}>
                <span className="px-4 py-2 rounded-full text-sm bg-white/10 hover:bg-white/20 transition-colors">
                  {genre}
                </span>
              </Link>
            ))}
          </div>

          {/* Tabs */}
          <div className="mb-8">
            <div className="border-b border-white/10">
              <div className="flex gap-8">
                <button
                  onClick={() => setActiveTab("lyrics")}
                  className={`pb-4 relative ${
                    activeTab === "lyrics"
                      ? "text-theme-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MdLyrics size={20} />
                    <span>Lyrics</span>
                  </div>
                  {activeTab === "lyrics" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-400"
                    />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("similar")}
                  className={`pb-4 relative ${
                    activeTab === "similar"
                      ? "text-theme-400"
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Music2 size={20} />
                    <span>Similar Tracks</span>
                  </div>
                  {activeTab === "similar" && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-400"
                    />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === "lyrics" ? (
              <motion.div
                key="lyrics"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white/5 rounded-xl p-8 relative"
              >
                <Button
                  onClick={copyLyricsToClipboard}
                  variant="ghost"
                  className="absolute top-4 right-4 text-gray-400 hover:text-green-400 transition-colors p-2 h-auto"
                  title="Copy lyrics"
                >
                  <ClipboardCopy size={20} />
                </Button>
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-line">{song.lyrics}</div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="similar"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {songGenres.map((similarSong) => (
                  <Link href={`/songs/${similarSong.id}`} key={similarSong.id}>
                    <Card className="group relative overflow-hidden bg-white/5 hover:bg-white/10 transition-colors">
                      <div className="relative aspect-video">
                        <Image
                          src={similarSong.image_path || "/images/liked.png"}
                          alt={similarSong.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 flex items-center justify-center bg-black/40"
                        >
                          <Play size={40} className="text-white" />
                        </motion.div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg mb-1 truncate">
                          {similarSong.title}
                        </h3>
                        <p className="text-gray-400 text-sm truncate">
                          {similarSong.author}
                        </p>
                      </div>
                    </Card>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <EditModal
          song={song}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      </div>
    </div>
  );
};

export default SongPage;
