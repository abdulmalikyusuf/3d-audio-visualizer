import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Vector3 } from "three";
import { useShallow } from "zustand/shallow";

import UI from "./components/UI";
import { Experience } from "./components/experience";
import { CircularVisualizer } from "./components/visualizers/circular";
import { AudioWave } from "./components/visualizers/audio-wave";
import { Notification } from "./components/notification";
// import { FloatingParticles } from "./components/floating-particles-html";
import { PreloaderCanvas } from "./components/preloader-canvas";
import { useMessage } from "./lib/store/message";
import { useAnimationFrame } from "./hooks/use-animation-frame";


const messages = [
  "GSAP.TO('#FILIP', {POSITION: 'WEBFLOW', DURATION: '3.0 QUANTUM_CYCLES'});",
  "CONST FILIP = NEW DESIGNER({SKILLS: ['GSAP', 'THREEJS', 'WEBFLOW', 'NEURAL_UI']});",
  "AWAIT WEBFLOW.HIRE(FILIP, {ROLE: 'DESIGNER', SALARY: 'COMPETITIVE'});",
  "SYSTEM.INTEGRATE(FILIP.CREATIVITY, {TARGET: 'WEBFLOW_ECOSYSTEM', EFFICIENCY: 0.97});",
  "TIMELINE.FORK({AGENT: 'FILIP', MISSION: 'ELEVATE_DIGITAL_EXPERIENCES', PROBABILITY: 0.998});",
];

export function App() {
  const [loading, setLoading] = useState(true);
  const lastUserActionTime = useRef(0);
  const currentMessage = useRef(0);
  const lastMessageTime = useRef(performance.now());
  const specialMessageSent = useRef(false);

  const { sendMessage } =
    useMessage(useShallow(s => ({ sendMessage: s.setTerminalMessage })));

  useEffect(() => {
    let timer1: number;
    // eslint-disable-next-line prefer-const
    timer1 = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => {
      clearTimeout(timer1);
    };
  });

  // // Handle cryptic messages
  // useEffect(() => {
  //   if (loading) return;
  //   const timeoutIds: number[] = [];
  //   let currentMessage = 0;
  //   const scheduleCrypticMessages = () => {
  //     if (Date.now() - lastUserActionTime.current > 10000) {
  //       const selectedMessage = messages[currentMessage];
  //       sendMessage(selectedMessage, true);

  //       currentMessage =
  //         (currentMessage + 1) % messages.length;
  //     }
  //     // scheduleCrypticMessages();
  //   };

  //   timeoutIds[0] = setTimeout(() => {
  //     const delay = 10000 + Math.random() * 15000;

  //     timeoutIds[1] = setTimeout(scheduleCrypticMessages, delay);
  //     timeoutIds[2] = setTimeout(() => {
  //       sendMessage("FILIPPORTFOLIO.VERSION = 'EXCEPTIONAL';", true);
  //     }, 15000);
  //   }, 10000);
  //   return () => {
  //     timeoutIds.forEach((timeoutId) => {
  //       clearTimeout(timeoutId);
  //     });
  //   };
  // }, [sendMessage, lastUserActionTime, loading]);

  useAnimationFrame(() => {
    if (loading) return;
    const now = performance.now();
    const idleTime = now - lastUserActionTime.current;
    const timeSinceLastMsg = now - lastMessageTime.current;

    // 1️⃣ If user idle for > 10s, send periodic cryptic messages
    if (idleTime > 10000 && timeSinceLastMsg > 10000 + Math.random() * 15000) {
      const msg = messages[currentMessage.current];
      sendMessage(msg, true);
      currentMessage.current = (currentMessage.current + 1) % messages.length;
      lastMessageTime.current = now;
    }

    // 2️⃣ After 15s total idle, send the special message once
    if (idleTime > 15000 && !specialMessageSent.current) {
      sendMessage("FILIPPORTFOLIO.VERSION = 'EXCEPTIONAL';", true);
      specialMessageSent.current = true;
    }

    // Reset special message if user becomes active again
    if (idleTime < 2000) {
      specialMessageSent.current = false;
    }
  });

  useEffect(() => {
    const handleMouseMoveOrKeydown = () => {
      lastUserActionTime.current = Date.now();
    };
    document.addEventListener("mousemove", handleMouseMoveOrKeydown);
    document.addEventListener("keydown", handleMouseMoveOrKeydown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveOrKeydown);
      document.removeEventListener("keydown", handleMouseMoveOrKeydown);
    };
  });

  return loading ? (
    <PreloaderCanvas style={{ opacity: loading ? "1" : "0" }} />
  ) : (
    <>
      {/* Background elements */}
      <div className="space-background"></div>
      <Notification />
      <div className="grid-overlay"></div>

      <CircularVisualizer />
      <AudioWave />

      {/* Floating Particles Container */}
      {/* <FloatingParticles /> */}

      {/* R3F Canvas for the 3D scene */}
      <Canvas
        id="three-container"
        gl={{
          powerPreference: "high-performance",
          antialias: true,
          stencil: true,
          depth: true,
          alpha: true,
          preserveDrawingBuffer: true,
        }}
        camera={{
          aspect: window.innerWidth / window.innerHeight,
          fov: 60,
          near: 0.1,
          far: 1000,
          position: new Vector3(0, 0, 10),
        }}
        dpr={[1, 2]}
        frameloop="always"
        style={{
          // all: "unset", // removes all inline styles
          position: "absolute",
          width: "100%",
          height: "100%",
          zIndex: 1,
          cursor: "grab",
        }}
      >
        <Experience />
      </Canvas>

      {/* UI and controls */}
      <UI />
    </>
  );
}
