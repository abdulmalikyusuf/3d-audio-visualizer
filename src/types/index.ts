export type Track = {
  file: File;
  title: string;
  artist: string;
  album: string;
  duration: string;
  time: number | null;
  cover: string | null;
};

export type Callback = (delta: number) => void;

export type PlaylistItem = { id: string; data: Track };
