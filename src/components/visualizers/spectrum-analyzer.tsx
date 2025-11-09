import { useRef, useEffect } from "react";
import { useShallow } from "zustand/shallow";
import { useControls } from "../../lib/store/controls";
import useAudioStore from "../../lib/audio";

export function SpectrumAnalyzer() {
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  const { isAudioPlaying, audioAnalyser, audioData, frequencyData } =
    useAudioStore(
      useShallow((s) => ({
        audioAnalyser: s.audioAnalyser,
        frequencyData: s.frequencyData,
        audioData: s.audioData,
        isAudioPlaying: s.isAudioPlaying,
      }))
    );

  const { audioSensitivity } = useControls(
    useShallow((state) => ({
      audioSensitivity: state.sensitivity,
    }))
  );

  useEffect(() => {
    function resizeSpectrumCanvas() {
      if (!spectrumCanvasRef.current) return;
      spectrumCanvasRef.current.width = spectrumCanvasRef.current.offsetWidth;
      spectrumCanvasRef.current.height = spectrumCanvasRef.current.offsetHeight;
    }
    resizeSpectrumCanvas();
    window.addEventListener("resize", resizeSpectrumCanvas);

    return () => {
      window.addEventListener("resize", resizeSpectrumCanvas);
    };
  }, []);

  // Spectrum Analyzer
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas || !audioAnalyser || !frequencyData) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawSpectrumAnalyzer = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);
      audioAnalyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>);
      const barWidth = width / 256;
      let x = 0;
      for (let i = 0; i < 256; i++) {
        const barHeight =
          (frequencyData[i] / 255) * height * (audioSensitivity / 5);
        const hue = (i / 256) * 20 + 0;
        ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
        x += barWidth;
      }
      ctx.strokeStyle = "rgba(255, 78, 66, 0.2)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const y = height * (i / 4);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const x = width * (i / 8);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255, 78, 66, 0.7)";
      ctx.font = '10px "TheGoodMonolith", monospace';
      ctx.textAlign = "center";
      const freqLabels = ["0", "1K", "2K", "4K", "8K", "16K"];
      for (let i = 0; i < freqLabels.length; i++) {
        const x = (width / (freqLabels.length - 1)) * i;
        ctx.fillText(freqLabels[i], x, height - 5);
      }
      animationFrameId.current = requestAnimationFrame(drawSpectrumAnalyzer);
    };

    animationFrameId.current = requestAnimationFrame(drawSpectrumAnalyzer);

    return () => {
      if (!animationFrameId.current) return;
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [
    isAudioPlaying,
    audioAnalyser,
    audioData,
    frequencyData,
    audioSensitivity,
  ]);

  if (!isAudioPlaying) return null;
  return (
    <div className="spectrum-content">
      <canvas
        ref={spectrumCanvasRef}
        id="spectrum-canvas"
        className="spectrum-canvas"
      ></canvas>
    </div>
  );
}
