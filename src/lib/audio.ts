import { create } from "zustand";
import { useMessage } from "./store/message";

interface AudioState {
  isAudioInitialized: boolean;
  audioSourceConnected: boolean;
  isAudioPlaying: boolean;
  audioContext: AudioContext | null;
  audioAnalyser: AnalyserNode | null;
  audioData: Uint8Array | null;
  frequencyData: Uint8Array | null;
  currentAudioElement: HTMLAudioElement | null;
  audioContextStarted: boolean;
  audioSource: MediaElementAudioSourceNode | null;
  currentAudioSrc: string | null;
  zoomIn: boolean;
}

interface AudioActions {
  initAudio: () => boolean;
  loadAudioFromURL: (url: string) => void;
  initAudioFile: (file: File) => void;
  ensureAudioContextStarted: () => boolean;
  setupAudioSource: (el: HTMLAudioElement) => boolean;
  cleanupAudioSource: () => void;
  getNewAudioElement: () => HTMLAudioElement;
  zoomCameraForAudio: (zoomIn: boolean) => void;
}

type AudioStore = AudioState & AudioActions;

const useAudioStore = create<AudioStore>((set, get) => ({
  audioSourceConnected: false,
  isAudioInitialized: false,
  isAudioPlaying: false,
  audioContext: null,
  audioAnalyser: null,
  audioData: null,
  frequencyData: null,
  currentAudioElement: null,
  audioContextStarted: false,
  audioSource: null,
  currentAudioSrc: null,
  zoomIn: false,

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
      audioAnalyser.connect(audioContext.destination);

      set({
        audioContext,
        audioAnalyser,
        audioData,
        frequencyData,
        isAudioInitialized: true,
      });
      useMessage
        .getState()
        .setTerminalMessage("AUDIO ANALYSIS SYSTEM INITIALIZED.");
      useMessage.getState().showNotification("AUDIO ANALYSIS SYSTEM ONLINE");
      return true;
    } catch (error) {
      console.error("Audio initialization error:", error);
      useMessage
        .getState()
        .setTerminalMessage("ERROR: AUDIO SYSTEM INITIALIZATION FAILED.");
      useMessage.getState().showNotification("AUDIO SYSTEM ERROR");
      return false;
    }
  },

  ensureAudioContextStarted: () => {
    const { audioContext, isAudioInitialized, audioContextStarted } = get();

    if (!audioContext) {
      if (!isAudioInitialized) return false;
      return false;
    }
    if (audioContext.state === "suspended") {
      audioContext
        .resume()
        .then(() => {
          if (!audioContextStarted) {
            set({ audioContextStarted: true });
            useMessage.getState().setTerminalMessage("AUDIO CONTEXT RESUMED.");
          }
        })
        .catch((err) => {
          console.error("Failed to resume audio context:", err);
          useMessage
            .getState()
            .setTerminalMessage("ERROR: FAILED TO RESUME AUDIO CONTEXT.");
        });
    } else {
      set({ audioContextStarted: true });
    }
    return true;
  },

  cleanupAudioSource: () => {
    const { audioSource } = get();
    if (audioSource) {
      try {
        audioSource.disconnect();
        set({ audioSourceConnected: false, audioSource: null });
      } catch (e) {
        console.log("Error disconnecting previous source:", e);
      }
    }
  },

  getNewAudioElement: () => {
    const { zoomCameraForAudio } = get();
    const audioEl =
      document.querySelector<HTMLAudioElement>("audio#audio-player")!;

    audioEl.addEventListener("ended", function () {
      set({ isAudioPlaying: false });
      zoomCameraForAudio(false);
      useMessage.getState().setTerminalMessage("AUDIO PLAYBACK COMPLETE.");
    });
    set({ currentAudioElement: audioEl });
    return audioEl;
  },

  setupAudioSource: (audioElement: HTMLAudioElement) => {
    const {
      audioContextStarted,
      cleanupAudioSource,
      audioContext,
      audioAnalyser,
      audioSourceConnected,
    } = get();

    try {
      if (!audioContextStarted || !audioAnalyser) {
        useMessage
          .getState()
          .setTerminalMessage(
            "ERROR: AUDIO CONTEXT NOT AVAILABLE. CLICK ANYWHERE TO ENABLE AUDIO."
          );
        return false;
      }
      cleanupAudioSource();
      try {
        // Only create a new media element source if one doesn't already exist
        if (!audioSourceConnected) {
          const audioSource =
            audioContext.createMediaElementSource(audioElement);
          set({ audioSource });
          audioSource.connect(audioAnalyser);
          set({ audioSourceConnected: true });
        }
        return true;
      } catch (error) {
        console.error("Error creating media element source:", error);
        if (
          error.name === "InvalidStateError" &&
          error.message.includes("already connected")
        ) {
          useMessage
            .getState()
            .setTerminalMessage(
              "AUDIO SOURCE ALREADY CONNECTED. ATTEMPTING TO PLAY ANYWAY."
            );
          return true;
        }
        useMessage
          .getState()
          .setTerminalMessage(
            "ERROR: FAILED TO SETUP AUDIO SOURCE. " + error.message
          );
        return false;
      }
    } catch (error) {
      console.error("Error setting up audio source:", error);
      useMessage
        .getState()
        .setTerminalMessage("ERROR: FAILED TO SETUP AUDIO SOURCE.");
      return false;
    }
  },

  loadAudioFromURL: async (url) => {
    const {
      isAudioInitialized,
      ensureAudioContextStarted,
      getNewAudioElement,
      initAudio,
      setupAudioSource,
      zoomCameraForAudio,
    } = get();
    try {
      if (!isAudioInitialized && !initAudio()) {
        return;
      }
      ensureAudioContextStarted();
      const audioPlayer = getNewAudioElement();
      set({ currentAudioSrc: url });
      audioPlayer.src = url;
      audioPlayer.onloadeddata = () => {
        if (setupAudioSource(audioPlayer)) {
          audioPlayer
            .play()
            .then(() => {
              set({ isAudioPlaying: true });
              zoomCameraForAudio(true);
              useMessage
                .getState()
                .setTerminalMessage(
                  `PLAYING DEMO TRACK: ${url.split("/").pop()}`
                );
              useMessage
                .getState()
                .showNotification(`PLAYING: ${url.split("/").pop()}`);
            })
            .catch((e) => {
              console.warn("Play prevented:", e);
              useMessage
                .getState()
                .setTerminalMessage(
                  "WARNING: AUDIO PLAYBACK PREVENTED BY BROWSER. CLICK PLAY TO START AUDIO."
                );
              useMessage
                .getState()
                .showNotification("CLICK PLAY TO START AUDIO");
            });
        }
      };
      const filename = url.split("/").pop();
      document.getElementById("file-label")!.textContent = filename;
      useMessage
        .getState()
        .setTerminalMessage(
          `LOADING AUDIO FROM URL: ${url.substring(0, 40)}...`
        );
      useMessage.getState().showNotification("AUDIO URL LOADED");
    } catch (error) {
      console.error("Audio URL error:", error);
      useMessage
        .getState()
        .setTerminalMessage("ERROR: AUDIO URL PROCESSING FAILED.");
      useMessage.getState().showNotification("AUDIO URL ERROR");
    }
  },

  initAudioFile: (file) => {
    const {
      isAudioInitialized,
      getNewAudioElement,
      setupAudioSource,
      zoomCameraForAudio,
      initAudio,
      ensureAudioContextStarted,
    } = get();
    try {
      if (!isAudioInitialized && !initAudio()) {
        return;
      }
      ensureAudioContextStarted();

      const audioEl = getNewAudioElement();
      const fileURL = URL.createObjectURL(file);
      set({ currentAudioSrc: fileURL });
      audioEl.src = fileURL;
      audioEl.onloadeddata = async () => {
        console.log(setupAudioSource(audioEl));
        if (setupAudioSource(audioEl)) {
          await audioEl
            .play()
            .then(() => {
              set({ isAudioPlaying: true });
              zoomCameraForAudio(true);
            })
            .catch((e) => {
              console.warn("Auto-play prevented:", e);
              useMessage
                .getState()
                .setTerminalMessage(
                  "WARNING: AUTO-PLAY PREVENTED BY BROWSER. CLICK PLAY TO START AUDIO."
                );
            });
        }
      };
      document.getElementById("file-label")!.textContent = file.name;
      document.querySelectorAll(".demo-track-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      useMessage
        .getState()
        .setTerminalMessage(`AUDIO FILE LOADED: ${file.name}`);
      useMessage.getState().showNotification("AUDIO FILE LOADED");
    } catch (error) {
      console.error("Audio file error:", error);
      useMessage
        .getState()
        .setTerminalMessage("ERROR: AUDIO FILE PROCESSING FAILED.");
      useMessage.getState().showNotification("AUDIO FILE ERROR");
    }
  },

  zoomCameraForAudio: (zoomIn) => set(() => ({ zoomIn })),
}));

export default useAudioStore;
