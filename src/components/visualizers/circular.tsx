import { useShallow } from "zustand/shallow";
import { useRef, useEffect } from "react";
import useAudioStore from "../../lib/audio";

export function CircularVisualizer() {
  const circularCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  const { isAudioPlaying, audioAnalyser, frequencyData } = useAudioStore(
    useShallow((state) => ({
      audioAnalyser: state.audioAnalyser,
      frequencyData: state.frequencyData,
      isAudioPlaying: state.isAudioPlaying,
    }))
  );

  useEffect(() => {
    function resizeCircularCanvas() {
      if (!circularCanvasRef.current) return;
      circularCanvasRef.current.width = circularCanvasRef.current.offsetWidth;
      circularCanvasRef.current.height = circularCanvasRef.current.offsetHeight;
    }
    resizeCircularCanvas();
    window.addEventListener("resize", resizeCircularCanvas);

    return () => {
      window.removeEventListener("resize", resizeCircularCanvas);
    };
  }, []);
  // Circular Visualizer
  useEffect(() => {
    const canvas = circularCanvasRef.current;
    if (!canvas || !audioAnalyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCircular = () => {
      if (!audioAnalyser) return;
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.clearRect(0, 0, width, height);
      audioAnalyser.getByteFrequencyData(frequencyData);
      const numPoints = 180;
      const baseRadius = Math.min(width, height) * 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 78, 66, 0.05)";
      ctx.fill();
      const numRings = 3;
      for (let ring = 0; ring < numRings; ring++) {
        const ringRadius = baseRadius * (0.7 + ring * 0.15);
        const opacity = 0.8 - ring * 0.2;
        ctx.beginPath();
        for (let i = 0; i < numPoints; i++) {
          const freqRangeStart = Math.floor(
            (ring * audioAnalyser.frequencyBinCount) / (numRings * 1.5)
          );
          const freqRangeEnd = Math.floor(
            ((ring + 1) * audioAnalyser.frequencyBinCount) / (numRings * 1.5)
          );
          const freqRange = freqRangeEnd - freqRangeStart;
          let sum = 0;
          const segmentSize = Math.floor(freqRange / numPoints);
          for (let j = 0; j < segmentSize; j++) {
            const freqIndex =
              freqRangeStart + ((i * segmentSize + j) % freqRange);
            sum += frequencyData[freqIndex];
          }
          const value = sum / (segmentSize * 255);
          const dynamicRadius = ringRadius * (1 + value * 0.5);
          const angle = (i / numPoints) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * dynamicRadius;
          const y = centerY + Math.sin(angle) * dynamicRadius;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(255, 78, 66, ${opacity})`;
        ctx.lineWidth = 2 + (numRings - ring);
        ctx.stroke();
        let gradient;
        if (ring === 0) {
          gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            ringRadius * 0.8,
            centerX,
            centerY,
            ringRadius * 1.2
          );
          gradient.addColorStop(0, `rgba(255, 78, 66, ${opacity})`);
          gradient.addColorStop(1, `rgba(194, 54, 47, ${opacity * 0.7})`);
        } else if (ring === 1) {
          gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            ringRadius * 0.8,
            centerX,
            centerY,
            ringRadius * 1.2
          );
          gradient.addColorStop(0, `rgba(194, 54, 47, ${opacity})`);
          gradient.addColorStop(1, `rgba(255, 179, 171, ${opacity * 0.7})`);
        } else {
          gradient = ctx.createRadialGradient(
            centerX,
            centerY,
            ringRadius * 0.8,
            centerX,
            centerY,
            ringRadius * 1.2
          );
          gradient.addColorStop(0, `rgba(255, 179, 171, ${opacity})`);
          gradient.addColorStop(1, `rgba(255, 78, 66, ${opacity * 0.7})`);
        }
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2 + (numRings - ring);
        ctx.stroke();
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(255, 78, 66, 0.7)";
      }
      ctx.shadowBlur = 0;
      // requestAnimationFrame(drawCircular);
      animationFrameId.current = requestAnimationFrame(drawCircular);
    };

    animationFrameId.current = requestAnimationFrame(drawCircular);

    return () => {
      if (!animationFrameId.current) return;
      cancelAnimationFrame(animationFrameId.current);
    };
  }, [isAudioPlaying, audioAnalyser, frequencyData]);

  return (
    <div className="circular-visualizer">
      <canvas id="circular-canvas" ref={circularCanvasRef}></canvas>
    </div>
  );
}
