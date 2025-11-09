import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";
import gsap from "gsap";
// import { Perf } from "r3f-perf";

import { BackgroundParticles } from "./background-particles";
import { AnomalyObject } from "./anomaly-object";
import { useThreeObject } from "../lib/store/object";
import { useThree } from "@react-three/fiber";
import useAudioStore from "../lib/audio";
import { useMessage } from "../lib/store/message";

export function Experience() {
  const { defaultCameraPosition, zoomedCameraPosition } = useThreeObject();
  const { setTerminalMessage } = useMessage();
  const { zoomIn } = useAudioStore();
  const { camera } = useThree();
  const { controlEnabled } = useThreeObject();

  useEffect(() => {
    const { x, y, z } = zoomIn ? zoomedCameraPosition : defaultCameraPosition;
    gsap.to(camera.position, {
      x,
      y,
      z,
      duration: 1.5,
      ease: "power2.inOut",
      onUpdate: () => {
        camera.lookAt(0, 0, 0);
      },
    });
    if (zoomIn) {
      setTerminalMessage(
        "CAMERA.ZOOM(TARGET: 0.7, DURATION: 1.5, EASE: 'POWER2.INOUT');",
        true
      );
    } else {
      setTerminalMessage(
        "CAMERA.ZOOM(TARGET: 1.0, DURATION: 1.5, EASE: 'POWER2.INOUT');",
        true
      );
    }
  }, [
    setTerminalMessage,
    zoomIn,
    camera,
    defaultCameraPosition,
    zoomedCameraPosition,
  ]);

  return (
    <>
      {/* <Perf /> */}
      <ambientLight color={0x404040} intensity={1.5} />
      <directionalLight color={0xffffff} intensity={1.5} position={[1, 1, 1]} />
      <pointLight args={[0xff4e42, 1, 10]} position={[2, 2, 2]} />
      <pointLight args={[0xc2362f, 1, 10]} position={[-2, -2, -2]} />

      <fogExp2
        attach="fog"
        color={new THREE.Color(0x0a0e17)}
        density={0.05}
        args={[0x0a0e17, 0.05]}
      />
      <BackgroundParticles />
      <AnomalyObject />
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.7}
        panSpeed={0.8}
        minDistance={3}
        maxDistance={30}
        enableZoom={false}
        enabled={controlEnabled}
      />
    </>
  );
}
