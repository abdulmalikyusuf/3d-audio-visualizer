import { useEffect, useRef, type CSSProperties } from "react";

interface Props {
  style: CSSProperties;
}

export function PreloaderCanvas(props: Props) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const animationFrameId = useRef<number>(null);

  useEffect(() => {
    const canvas = canvasEl.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    let time = 0;
    let lastTime = 0;
    const maxRadius = 80;
    const circleCount = 5;
    const dotCount = 24;

    const animate = (timestamp: number) => {
      if (!ctx || !canvas) return;
      if (!lastTime) lastTime = timestamp;
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;
      time += deltaTime * 0.001;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw center dot
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 78, 66, 0.9)";
      ctx.fill();

      // Draw expanding circles + dots
      for (let c = 0; c < circleCount; c++) {
        const circlePhase = (time * 0.3 + c / circleCount) % 1;
        const radius = circlePhase * maxRadius;
        const opacity = 1 - circlePhase;

        // Circle outline
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 78, 66, ${opacity * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Dots + radial lines
        for (let i = 0; i < dotCount; i++) {
          const angle = (i / dotCount) * Math.PI * 2;
          const x = centerX + Math.cos(angle) * radius;
          const y = centerY + Math.sin(angle) * radius;
          const size = 2 * (1 - circlePhase * 0.5);

          // radial line
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(x, y);
          ctx.strokeStyle = `rgba(255, 78, 66, ${opacity * 0.1})`;
          ctx.lineWidth = 1;
          ctx.stroke();

          // dot
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 78, 66, ${opacity * 0.9})`;
          ctx.fill();
        }
      }
      requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, []);

  return (
    <div
      className="loading-overlay"
      id="loading-overlay"
      style={{ ...props.style }}
    >
      <div className="loading-container">
        <div className="preloader-canvas-container">
          <canvas
            ref={canvasEl}
            id="preloader-canvas"
            className="preloader-canvas"
            width="180"
            height="180"
          />
        </div>
        <div className="loading-text">INITIALIZING SCANNER</div>
      </div>
    </div>
  );
}
