export type SongType = "regular";

export interface Song {
  id: string;
  user_id: string;
  author: string;
  title: string;
  song_path: string;
  image_path: string;
  local_song_path?: string;
  is_downloaded?: boolean;
  video_path?: string;
  genre?: string;
  count?: string;
  like_count?: string;
  lyrics?: string;
  duration?: number;
  public?: boolean;
  created_at: string;
}

export interface SongWithRecommendation extends Song {
  recommendation_score: string;
}

export interface UserDetails {
  id: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  avatar_url?: string;
  billing_address?: any;
  payment_method?: any;
}

export interface Playlist {
  id: string;
  user_id: string;
  image_path?: string;
  title: string;
  songs?: Song[];
  is_public: boolean;
  created_at: string;
  user_name?: string;
}

export interface PlaylistSong {
  id: string;
  user_id: string;
  playlist_id: string;
  song_id?: string;
  suno_song_id?: string;
  song_type: SongType;
}

export interface Spotlight {
  id: string;
  video_path: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
}

export interface Pulse {
  id: string;
  title: string;
  genre: string;
  music_path: string;
}
