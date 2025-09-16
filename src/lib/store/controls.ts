import { create } from "zustand";
import { combine } from "zustand/middleware";

export const useControls = create(
  combine(
    {
      rotation: 1.0,
      resolution: 32.0,
      distortion: 1.0,
      reactivity: 1.0,
      sensitivity: 5.0,
    },
    (set) => ({
      setRotation: (val: number) => set({ rotation: val }),
      setResolution: (val: number) => set({ resolution: val }),
      setDistortion: (val: number) => set({ distortion: val }),
      setReactivity: (val: number) => set({ reactivity: val }),
      setSensitivity: (val: number) => set({ sensitivity: val }),
    })
  )
);
