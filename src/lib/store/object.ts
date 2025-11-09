import * as THREE from "three";
import { create } from "zustand";

interface ThreeObjectState {
  isDraggingAnomaly: boolean;
  anomalyVelocity: THREE.Vector2;
  anomalyTargetPosition: THREE.Vector3;
  anomalyOriginalPosition: THREE.Vector3;
  defaultCameraPosition: THREE.Vector3;
  zoomedCameraPosition: THREE.Vector3;
  controlEnabled: boolean;
  anomalyObjectPosition: THREE.Vector3 | null;
}

interface ThreeObjectActions {
  setThreeObjectState: (newState: Partial<ThreeObjectState>) => void;
  disableControls: () => void;
  enableControls: () => void;
}

type ThreeObjectStore = ThreeObjectState & ThreeObjectActions;
export const useThreeObject = create<ThreeObjectStore>((set) => ({
  isDraggingAnomaly: false,
  anomalyVelocity: new THREE.Vector2(0, 0),
  anomalyTargetPosition: new THREE.Vector3(0, 0, 0),
  anomalyOriginalPosition: new THREE.Vector3(0, 0, 0),
  defaultCameraPosition: new THREE.Vector3(0, 0, 10),
  zoomedCameraPosition: new THREE.Vector3(0, 0, 7),
  controlEnabled: true,
  anomalyObjectPosition: null,

  setThreeObjectState: (newState: Partial<ThreeObjectState>) => set(newState),
  disableControls: () => set({ controlEnabled: false }),
  enableControls: () => set({ controlEnabled: true }),
}));
