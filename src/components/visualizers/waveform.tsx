import { useShallow } from "zustand/shallow";
import { useRef, useEffect } from "react";
import useAudioStore from "../../lib/audio";

export function WaveformVisualizers() {
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  const { isAudioPlaying, audioAnalyser, audioData } = useAudioStore(
    useShallow((s) => ({
      audioAnalyser: s.audioAnalyser,
      audioData: s.audioData,
      isAudioPlaying: s.isAudioPlaying,
    }))
  );

  useEffect(() => {
    function resizeCanvas() {
      if (!waveformCanvasRef.current) return;
      waveformCanvasRef.current.width =
        waveformCanvasRef.current.offsetWidth * window.devicePixelRatio;
      waveformCanvasRef.current.height =
        waveformCanvasRef.current.offsetHeight * window.devicePixelRatio;
      waveformCanvasRef.current
        .getContext("2d")!
        .scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  // Waveform Visualizer
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas || !audioAnalyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawWaveform = () => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.fillRect(0, 0, width, height);

      if (audioAnalyser) {
        audioAnalyser.getByteTimeDomainData(audioData);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 78, 66, 0.8)";
        ctx.lineWidth = 2;
        const sliceWidth = width / audioData.length;
        let x = 0;
        for (let i = 0; i < audioData.length; i++) {
          const v = audioData[i] / 128.0;
          const y = (v * height) / 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      } else {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 78, 66, 0.8)";
        ctx.lineWidth = 1;
        const time = Date.now() / 1000;
        const sliceWidth = width / 100;
        let x = 0;
        for (let i = 0; i < 100; i++) {
          const t = i / 100;
          const y =
            height / 2 +
            Math.sin(t * 10 + time) * 5 +
            Math.sin(t * 20 + time * 1.5) * 3 +
            Math.sin(t * 30 + time * 0.5) * 7 +
            (Math.random() - 0.5) * 2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }
      }
      ctx.stroke();
      animationFrameId.current = requestAnimationFrame(drawWaveform);
    };

    animationFrameId.current = requestAnimationFrame(drawWaveform);

    return () => {
      if (!animationFrameId.current) return;
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isAudioPlaying, audioAnalyser, audioData]);

  return (
    <div className="waveform">
      <canvas
        id="waveform-canvas"
        className="waveform-canvas"
        ref={waveformCanvasRef}
      />
    </div>
  );
}
