import * as THREE from "three";
import { create } from "zustand";
import { combine } from "zustand/middleware";
import { OrbitControls } from "@react-three/drei";

type OrbitControlsType = React.ComponentRef<typeof OrbitControls>;

interface ThreeObjectState {
  isDraggingAnomaly: boolean;
  anomalyVelocity: THREE.Vector2;
  anomalyTargetPosition: THREE.Vector3;
  anomalyOriginalPosition: THREE.Vector3;
  defaultCameraPosition: THREE.Vector3;
  zoomedCameraPosition: THREE.Vector3;
  controlsRef: OrbitControlsType | null;
  anomalyObjectPosition: THREE.Vector3 | null;
}

interface ThreeObjectActions {
  setThreeObjectState: (newState: Partial<ThreeObjectState>) => void;
  setControlsRef: (ref: OrbitControlsType | null) => void;
}

export const useThreeObject = create<ThreeObjectState & ThreeObjectActions>(
  combine(
    {
      isDraggingAnomaly: false,
      anomalyVelocity: new THREE.Vector2(0, 0),
      anomalyTargetPosition: new THREE.Vector3(0, 0, 0),
      anomalyOriginalPosition: new THREE.Vector3(0, 0, 0),
      defaultCameraPosition: new THREE.Vector3(0, 0, 10),
      zoomedCameraPosition: new THREE.Vector3(0, 0, 7),
      controlsRef: null,
      anomalyObjectPosition: null,
    },
    (set): ThreeObjectActions => ({
      setThreeObjectState: (newState: Partial<ThreeObjectState>) =>
        set(newState),
      setControlsRef: (ref) => set({ controlsRef: ref }),
    })
  )
);
