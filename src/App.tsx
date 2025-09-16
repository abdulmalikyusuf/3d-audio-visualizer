import { useState, useEffect, useRef } from "react";
import { Canvas } from "@react-three/fiber";
import UI from "./components/UI";
import useAudioStore from "./lib/audio";
import { Experience } from "./components/experience";
import { CircularVisualizer } from "./components/visualizers/circular";
import { AudioWave } from "./components/visualizers/audio-wave";
import { Notification } from "./components/notification";
import { useMessage } from "./lib/store/message";
import { FloatingParticles } from "./components/floating-particles-html";
import { PreloaderCanvas } from "./components/preloader-canvas";

export function App() {
  const [loading, setLoading] = useState(true);
  const crypticMessageTimeout = useRef<number[]>(null);
  const { lastUserActionTime, setLastUserActionTime, setTerminalMessage } =
    useMessage();

  const { initAudio, isAudioPlaying, isAudioInitialized, audioContext } =
    useAudioStore();

  useEffect(() => {
    let timer1: number, timer2: number;
    // eslint-disable-next-line prefer-const
    timer1 = setTimeout(() => {
      setLoading(false);
      timer2 = setTimeout(() => {
        if (!isAudioPlaying || !isAudioInitialized) {
          initAudio();
        }
        setLoading(false);
      }, 500);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [initAudio, isAudioPlaying, isAudioInitialized]);

  const currentMessageIndex = useRef(0);

  // Handle cryptic messages
  useEffect(() => {
    if (loading) return;
    const timeoutIds = crypticMessageTimeout.current;
    const scheduleCrypticMessages = () => {
      if (Date.now() - lastUserActionTime > 10000) {
        const messages = [
          "GSAP.TO('#FILIP', {POSITION: 'WEBFLOW', DURATION: '3.0 QUANTUM_CYCLES'});",
          "CONST FILIP = NEW DESIGNER({SKILLS: ['GSAP', 'THREEJS', 'WEBFLOW', 'NEURAL_UI']});",
          "AWAIT WEBFLOW.HIRE(FILIP, {ROLE: 'DESIGNER', SALARY: 'COMPETITIVE'});",
          "SYSTEM.INTEGRATE(FILIP.CREATIVITY, {TARGET: 'WEBFLOW_ECOSYSTEM', EFFICIENCY: 0.97});",
          "TIMELINE.FORK({AGENT: 'FILIP', MISSION: 'ELEVATE_DIGITAL_EXPERIENCES', PROBABILITY: 0.998});",
        ];
        const selectedMessage = messages[currentMessageIndex.current];
        setTerminalMessage(selectedMessage, true);

        currentMessageIndex.current =
          (currentMessageIndex.current + 1) % messages.length;
      }
    };
    if (!timeoutIds) return;

    timeoutIds![0] = setTimeout(() => {
      const delay = 10000 + Math.random() * 15000;
      console.log(Date.now() - lastUserActionTime > 10000, delay);
      timeoutIds![1] = setTimeout(scheduleCrypticMessages, delay);
      timeoutIds![2] = setTimeout(() => {
        setTerminalMessage("FILIPPORTFOLIO.VERSION = 'EXCEPTIONAL';", true);
      }, 15000);
    }, 10000);
    return () => {
      if (!timeoutIds) return;
      timeoutIds.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
    };
  }, [setTerminalMessage, lastUserActionTime, loading]);

  useEffect(() => {
    const handleMouseMoveOrKeydown = () => {
      setLastUserActionTime(Date.now());
    };
    const handleClick = () => {
      setLastUserActionTime(Date.now());
      if (!isAudioInitialized) {
        initAudio();
      } else if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
    };
    document.addEventListener("mousemove", handleMouseMoveOrKeydown);
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", handleMouseMoveOrKeydown);

    return () => {
      document.removeEventListener("mousemove", handleMouseMoveOrKeydown);
      document.removeEventListener("click", handleClick);
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
        dpr={[1, 2]}
        frameloop="always"
        style={{
          // all: "unset", // removes all inline styles
          position: "absolute !important",
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
