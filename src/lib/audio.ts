import { create } from "zustand";
import { useMessage } from "./store/message";
import { PlaylistItem } from "../types";
import { db, DBPlaylistItem } from "./db";
import Dexie from "dexie";

interface AudioState {
  isAudioInitialized: boolean;
  isAudioPlaying: boolean;
  audioContext: AudioContext | null;
  audioAnalyser: AnalyserNode | null;
  audioData: Uint8Array | null;
  frequencyData: Uint8Array | null;
  audioContextStarted: boolean;
  currentAudioSrc: string | null;
  zoomIn: boolean;
  showFavourites: boolean;
  // element-based player
  audioElement: HTMLAudioElement | null;
  mediaElementSource: MediaElementAudioSourceNode | null;

  // playback tracking
  startTime: number; // context time when play started (only for alignment)
  pauseTime: number; // seconds into the track when paused
  currentTime: number; // current playhead seconds
  duration: number; // length of current track in seconds
  playbackRate: number;

  // playlist
  playlist: PlaylistItem[];
  tempPlaylist: PlaylistItem[];
  favourites: DBPlaylistItem[];
  currentTrackIndex: number | null;
  currentTrack: PlaylistItem | null;

  // controls
  isShuffle: boolean;
  isRepeat: boolean;
  status: "idle" | "loading" | "playing" | "paused" | "stopped";

  // shuffle settings
  shuffleOrder: number[]; // permutation of playlist indices when shuffle is on
  shufflePointer: number; // index into shuffleOrder (which item is currently playing)
}

interface AudioActions {
  initAudio: () => boolean;
  ensureAudioContextStarted: () => Promise<boolean>;
  setPlaylist: (playlist: PlaylistItem[], startIndex?: number) => void;
  setFavourites: (items: DBPlaylistItem[] | undefined) => void;
  loadAudioFromURL: (track: PlaylistItem, autoPlay?: boolean) => Promise<void>;
  playPauseAudio: () => void;
  pauseAudio: () => void;
  resumeAudio: () => Promise<void>;
  skipToTime: (timeInSeconds: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  zoomCameraForAudio: (zoomIn: boolean) => void;
  cleanupSource: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  initShuffleOrder: (startIndex: number) => void;
  clearShuffleOrder: () => void;
  syncShufflePointerToIndex: (index: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleFavourites: () => void;
  addItemToIndexedDB: (item: PlaylistItem) => void;
  removeItemFromIndexedDB: (itemId: string, title: string) => void;
}

type AudioStore = AudioState & AudioActions;

const useAudioStore = create<AudioStore>((set, get) => ({
  // ==== STATE ====
  isAudioInitialized: false,
  isAudioPlaying: false,
  audioContext: null,
  audioAnalyser: null,
  audioData: null,
  frequencyData: null,
  audioContextStarted: false,
  audioElement: null,
  mediaElementSource: null,
  currentAudioSrc: null,
  zoomIn: false,
  showFavourites: false,
  audioBuffer: null,
  source: null,
  startTime: 0,
  pauseTime: 0,
  currentTime: 0,
  duration: 0,
  playlist: [],
  currentTrackIndex: null,
  currentTrack: null,
  isShuffle: false,
  isRepeat: false,
  status: "idle",
  shuffleOrder: [],
  shufflePointer: 0,
  playbackRate: 1,
  tempPlaylist: [],
  favourites: [],

  // ==== ACTIONS ====
  setFavourites: (items) => set({ favourites: items ?? [] }),
  toggleFavourites: async () => {
    const { favourites: favItems, showFavourites } = get();
    if (showFavourites) {
      set((s) => ({
        playlist: s.tempPlaylist[0] ? s.tempPlaylist : [],
        tempPlaylist: [],
        showFavourites: false,
      }));
    } else {
      const r = favItems?.map((i) => ({ id: i.id, data: { ...i } }));
      set((s) => ({
        playlist: r ? r : [],
        tempPlaylist: s.playlist,
        showFavourites: true,
      }));
    }
  },

  setPlaybackRate: (rate) => {
    const clampedRate = Math.max(0.25, Math.min(rate, 2)); // prevent extremes
    const { audioElement } = get();

    if (audioElement) {
      audioElement.playbackRate = clampedRate;
    }

    set({ playbackRate: clampedRate });
    useMessage
      .getState()
      .setTerminalMessage(`Playback speed set to ${clampedRate}x`);
  },

  toggleShuffle: () => {
    const {
      isShuffle,
      currentTrackIndex,
      initShuffleOrder,
      clearShuffleOrder,
    } = get();
    if (!isShuffle) {
      // turning ON
      initShuffleOrder(currentTrackIndex ?? 0);
    } else {
      // turning OFF
      clearShuffleOrder();
    }
    set((s) => ({ isShuffle: !s.isShuffle }));
  },
  toggleRepeat: () => set((s) => ({ isRepeat: !s.isRepeat })),

  // create a shuffle order ensuring every track is visited once,
  // placing the current index at the start so the current track continues
  initShuffleOrder: (startIndex) => {
    const { playlist } = get();
    const n = playlist.length;
    if (!n) {
      set({ shuffleOrder: [], shufflePointer: 0 });
      return;
    }
    // create array of remaining indices
    const indices = Array.from({ length: n }, (_, i) => i).filter(
      (i) => i !== startIndex
    );
    // Fisher-Yates shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    // put startIndex first so we continue from the same track
    const order = [startIndex, ...indices];
    set({ shuffleOrder: order, shufflePointer: 0 });
  },

  clearShuffleOrder: () => {
    set({ shuffleOrder: [], shufflePointer: 0 });
  },

  syncShufflePointerToIndex: (index) => {
    const { shuffleOrder } = get();
    if (!shuffleOrder || !shuffleOrder.length) return;
    const p = shuffleOrder.indexOf(index);
    if (p >= 0) set({ shufflePointer: p });
  },

  setPlaylist: (playlist) => {
    set({ playlist });
  },

  initAudio: () => {
    const { isAudioInitialized } = get();
    if (isAudioInitialized) return true;

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const audioAnalyser = audioContext.createAnalyser();
      audioAnalyser.fftSize = 2048;
      audioAnalyser.smoothingTimeConstant = 0.8;
      const audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
      const frequencyData = new Uint8Array(audioAnalyser.frequencyBinCount);

      // create a reusable hidden audio element
      const audioElement = new Audio();
      audioElement.crossOrigin = "anonymous";
      audioElement.preload = "auto";
      audioElement.id = "audio-player";
      audioElement.className = "audio-player";

      // media element source (create now so we can connect it to analyser)
      const mediaElementSource =
        audioContext.createMediaElementSource(audioElement);
      mediaElementSource.connect(audioAnalyser);
      // audioAnalyser should connect to destination
      audioAnalyser.connect(audioContext.destination);

      set({
        audioContext,
        audioAnalyser,
        audioData,
        frequencyData,
        audioElement,
        mediaElementSource,
        isAudioInitialized: true,
      });

      // attach ended handler once
      audioElement.addEventListener("ended", () => {
        const {
          isRepeat,
          isShuffle,
          playlist,
          currentTrackIndex,
          loadAudioFromURL,
          zoomCameraForAudio,
          initShuffleOrder,
          clearShuffleOrder,
          shuffleOrder,
          shufflePointer,
        } = get();

        // No playlist => nothing to do
        if (!playlist || !playlist.length) {
          set({ isAudioPlaying: false, status: "stopped" });
          zoomCameraForAudio(false);
          useMessage.getState().setTerminalMessage("PLAYBACK COMPLETE.");
          return;
        }

        // If shuffle is ON -> follow shuffleOrder (which visits each item once)
        if (isShuffle) {
          // ensure we have an order
          if (!shuffleOrder || shuffleOrder.length === 0) {
            // If currentTrackIndex is null, start from 0
            initShuffleOrder(currentTrackIndex ?? 0);
            return; // initShuffleOrder sets pointer to 0 and we already just finished playing index 0 (current)
          }

          const pointer = shufflePointer ?? 0;
          const nextPointer = pointer + 1;

          // If there is a next item in the shuffle order, play it
          if (nextPointer < shuffleOrder.length) {
            const nextIndex = shuffleOrder[nextPointer];
            set({
              shufflePointer: nextPointer,
              currentTrackIndex: nextIndex,
              currentTrack: playlist[nextIndex],
            });
            loadAudioFromURL(playlist[nextIndex], true);
            return;
          }

          // Reached end of shuffle order -> stop (do not repeat)
          clearShuffleOrder();
          set({ isAudioPlaying: false, status: "stopped" });
          zoomCameraForAudio(false);
          useMessage.getState().setTerminalMessage("PLAYBACK COMPLETE.");
          return;
        }

        // Shuffle is OFF
        // If repeat (meaning "auto-advance") is ON -> go to next sequential item until last, then stop
        if (isRepeat) {
          const idx = currentTrackIndex ?? 0;
          const nextIndex = idx + 1;
          if (nextIndex < playlist.length) {
            set({
              currentTrackIndex: nextIndex,
              currentTrack: playlist[nextIndex],
            });
            loadAudioFromURL(playlist[nextIndex], true);
            return;
          }
          // reached last track -> stop
          set({ isAudioPlaying: false, status: "stopped" });
          zoomCameraForAudio(false);
          useMessage.getState().setTerminalMessage("PLAYBACK COMPLETE.");
          return;
        }

        // No repeat and no shuffle -> just stop after current track
        set({
          isAudioPlaying: false,
          currentTrackIndex: null,
          currentTrack: null,
          currentTime: 0,
          duration: 0,
          status: "stopped",
        });
        zoomCameraForAudio(false);
        useMessage.getState().setTerminalMessage("PLAYBACK COMPLETE.");
      });

      useMessage.getState().setTerminalMessage("AUDIO SYSTEM INITIALIZED.");
      return true;
    } catch (error) {
      console.error("Audio init error:", error);
      useMessage.getState().setTerminalMessage("AUDIO INIT FAILED.");
      return false;
    }
  },

  ensureAudioContextStarted: async () => {
    const { audioContext } = get();
    if (!audioContext) return false;

    if (audioContext.state === "suspended") {
      await audioContext.resume();
      set({ audioContextStarted: true });
    }
    return true;
  },

  cleanupSource: () => {
    const { audioElement } = get();
    try {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.src = "";
        audioElement.removeAttribute("src");
        // audioElement.load(); // not necessary
      }
    } catch (e) {
      console.warn("Error cleaning up audio element:", e);
    } finally {
      // keep mediaElementSource for reuse (don't recreate unnecessarily)
      set({
        isAudioPlaying: false,
        startTime: 0,
        pauseTime: 0,
        currentTime: 0,
        duration: 0,
      });
    }
  },

  loadAudioFromURL: async (track, autoPlay = true) => {
    const {
      audioContext,
      isAudioInitialized,
      ensureAudioContextStarted,
      cleanupSource,
      zoomCameraForAudio,
      playlist,
      currentTrackIndex,
      audioElement,
    } = get();
    if (!isAudioInitialized || !audioContext || !audioElement) return;

    await ensureAudioContextStarted();
    cleanupSource();

    // Stop any current playback
    try {
      audioElement.pause();
    } catch {
      /* empty */
    }
    const fileUrl =
      track.data.file instanceof File
        ? URL.createObjectURL(track.data.file)
        : track.data.file;

    set({ status: "loading" });

    // set track metadata in store
    const idx = playlist.findIndex((item) => item.id === track.id);
    const indexToSet = idx >= 0 ? idx : currentTrackIndex ?? 0;
    set({
      currentTrackIndex: indexToSet,
      currentTrack: playlist[indexToSet] ?? track,
      currentAudioSrc: fileUrl,
    });

    // set source on audio element and try to play (autoPlay param)
    audioElement.src = fileUrl;
    audioElement.load();

    // set duration once metadata available
    const onLoadedMetadata = () => {
      set({ duration: audioElement.duration ?? 0 });
      audioElement.removeEventListener("loadedmetadata", onLoadedMetadata);
    };
    audioElement.addEventListener("loadedmetadata", onLoadedMetadata);

    // on play promise
    if (autoPlay) {
      try {
        await audioElement.play();
        set({
          isAudioPlaying: true,
          status: "playing",
          startTime: audioContext.currentTime,
          pauseTime: 0,
        });
        zoomCameraForAudio(true);
        useMessage
          .getState()
          .setTerminalMessage(
            `PLAYING: ${track.data.title}${
              track.data.artist !== "Unknown" && ` by ${track.data.artist}`
            }${
              track.data.album !== "Unknown" && ` in ${track.data.album} album`
            }`,
            true
          );
      } catch (err) {
        // play prevented by browser; remain loaded but not playing
        console.warn("Play prevented:", err);
        set({ isAudioPlaying: false, status: "paused" });
        useMessage
          .getState()
          .setTerminalMessage("WARNING: AUDIO PLAYBACK PREVENTED BY BROWSER.");
      }
    } else {
      set({ isAudioPlaying: false, status: "paused", currentTime: 0 });
    }

    // start time tracker (reads from audioElement.currentTime)
    const trackTime = () => {
      const { audioElement: el, currentTime, isAudioPlaying } = get();
      if (!el || !isAudioPlaying) return;
      const newTime = el.currentTime;
      if (Math.abs(newTime - currentTime) > 0.05) set({ currentTime: newTime });
      // continue tracking while the element exists and is playing (or even when paused if you want)
      requestAnimationFrame(trackTime);
      // if (status !== "idle") requestAnimationFrame(trackTime);
    };
    requestAnimationFrame(trackTime);
  },

  playPauseAudio: () => {
    const { isAudioPlaying, pauseAudio, resumeAudio } = get();
    if (isAudioPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  },

  pauseAudio: () => {
    const { audioElement } = get();
    if (!audioElement) return;
    audioElement.pause();
    set({
      isAudioPlaying: false,
      pauseTime: audioElement.currentTime,
      status: "paused",
    });
  },

  resumeAudio: async () => {
    const { audioElement, audioContext } = get();
    if (!audioElement || !audioContext) return;
    // ensure context resumed
    if (audioContext.state === "suspended") await audioContext.resume();

    try {
      await audioElement.play();
      set({
        isAudioPlaying: true,
        status: "playing",
      });
    } catch (err) {
      console.warn("Resume play prevented:", err);
      set({ isAudioPlaying: false, status: "paused" });
    }
  },

  skipToTime: (timeInSeconds: number) => {
    const { audioElement } = get();
    if (!audioElement) return;
    const clamped = Math.min(
      Math.max(0, timeInSeconds),
      audioElement.duration || 0
    );
    audioElement.currentTime = clamped;
    set({ currentTime: clamped });
    useMessage
      .getState()
      .setTerminalMessage(`Skipped to ${clamped.toFixed(1)}s`);
  },

  nextTrack: async () => {
    const {
      playlist,
      currentTrackIndex,
      isShuffle,
      shuffleOrder,
      shufflePointer,
      loadAudioFromURL,
      initShuffleOrder,
    } = get();
    if (!playlist[0] || currentTrackIndex === null) return;
    if (isShuffle) {
      // if shuffleOrder exists, find pointer of next value (pointer +1) else init
      if (!shuffleOrder || shuffleOrder.length === 0) {
        initShuffleOrder(currentTrackIndex);
      }
      const pointer = shufflePointer ?? 0;
      const nextPointer = Math.min(pointer + 1, get().shuffleOrder.length - 1);
      const nextIndex = get().shuffleOrder[nextPointer];
      set({
        shufflePointer: nextPointer,
        currentTrackIndex: nextIndex,
        currentTrack: playlist[nextIndex],
      });
      await loadAudioFromURL(playlist[nextIndex], true);
      return;
    }

    // normal sequential next
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    set({ currentTrackIndex: nextIndex });
    await loadAudioFromURL(playlist[nextIndex]);
  },

  previousTrack: async () => {
    const { playlist, currentTrackIndex, loadAudioFromURL } = get();
    if (!playlist[0] || currentTrackIndex === null) return;
    const prevIndex =
      (currentTrackIndex - 1 + playlist.length) % playlist.length;
    set({ currentTrackIndex: prevIndex });
    await loadAudioFromURL(playlist[prevIndex]);
  },

  zoomCameraForAudio: (zoomIn) => set({ zoomIn }),

  addItemToIndexedDB: async (item) => {
    const { id, data } = item;
    const { artist, title, album, cover, duration, file, time } = data;
    await db
      .addAudioItem({
        id,
        artist,
        title,
        album,
        cover,
        duration,
        file,
        time,
      })
      .then(() =>
        useMessage.getState().showNotification(`added ${title} to favourite`)
      )
      .catch((err) => {
        if (err instanceof Dexie.ModifyError) {
          err.failures.forEach((failure) => {
            console.error(failure.stack || failure.message);
          });
        } else if (err instanceof Dexie.ConstraintError) {
          console.log(`${err.name.toLocaleUpperCase()}: ${err.message}`);
          useMessage
            .getState()
            .showNotification(`${title} already in favourites`);
        } else {
          console.log(err);
          throw err;
        }
      });
  },
  removeItemFromIndexedDB: async (id, title) => {
    await db
      .deleteAudioItem(id)
      .then(() =>
        useMessage
          .getState()
          .showNotification(`removed ${title} from favourite`)
      )
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },
}));

export default useAudioStore;
