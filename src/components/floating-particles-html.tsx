import { useEffect, useMemo, useRef } from "react";

type Particle = {
  element: HTMLDivElement;
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  angleSpeed: number;
  amplitude: number;
  pulseSpeed: number;
  pulsePhase: number;
};
const numParticles = 1000;

export function FloatingParticles() {
  const animationFrameId = useRef<number>(null);
  const container = useRef<HTMLDivElement>(null);
  const floatingParticles: Particle[] = [];

  const animateFloatingParticles = () => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    let time = 0;

    function updateParticles() {
      time += 0.01;

      floatingParticles.forEach((particle) => {
        // Update angle
        particle.angle += particle.angleSpeed;

        // Calculate orbit around center with some drift
        const orbitX = centerX + Math.cos(particle.angle) * particle.amplitude;
        const orbitY = centerY + Math.sin(particle.angle) * particle.amplitude;

        // Add some noise movement
        const noiseX = Math.sin(time * particle.speed + particle.angle) * 5;
        const noiseY =
          Math.cos(time * particle.speed + particle.angle * 0.7) * 5;

        // Apply movement without audio reactivity
        const newX = orbitX + noiseX;
        const newY = orbitY + noiseY;

        // Update position
        particle.element.style.left = newX + "px";
        particle.element.style.top = newY + "px";

        // Pulse size slightly without audio
        const pulseFactor =
          1 + Math.sin(time * particle.pulseSpeed + particle.pulsePhase) * 0.3;
        const newSize = particle.size * pulseFactor;

        particle.element.style.width = newSize + "px";
        particle.element.style.height = newSize + "px";

        // Adjust opacity based on pulse
        const baseOpacity =
          0.2 +
          Math.sin(time * particle.pulseSpeed + particle.pulsePhase) * 0.1;
        particle.element.style.opacity = Math.min(0.8, baseOpacity);
      });

      requestAnimationFrame(updateParticles);
    }

    requestAnimationFrame(updateParticles);
  };

  const initFloatingParticles = () => {
    if (!container.current) return;
    container.current.textContent = "";
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;

    for (let i = 0; i < numParticles; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.position = "absolute";

      // Make all particles the same small size
      particle.style.width = "1.5px";
      particle.style.height = "1.5px";
      particle.style.backgroundColor = `rgba(255, ${
        Math.floor(Math.random() * 100) + 78
      }, ${Math.floor(Math.random() * 100) + 66}, ${
        Math.random() * 0.5 + 0.2
      })`;
      particle.style.borderRadius = "50%";

      const minDistance = 200;
      const maxDistance = Math.max(windowWidth, windowHeight) * 0.8;
      const angle = Math.random() * Math.PI * 2;
      const distanceFactor = Math.sqrt(Math.random());
      const distance =
        minDistance + distanceFactor * (maxDistance - minDistance);

      const x = Math.cos(angle) * distance + centerX;
      const y = Math.sin(angle) * distance + centerY;

      particle.style.left = x + "px";
      particle.style.top = y + "px";

      const particleObj = {
        element: particle,
        x,
        y,
        size: 1.5,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        angleSpeed: (Math.random() - 0.5) * 0.02,
        amplitude: Math.random() * 50 + 20,
        pulseSpeed: Math.random() * 0.04 + 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      };
      floatingParticles.push(particleObj);
      container.current.appendChild(particle);
    }
    animateFloatingParticles();
  };

  useEffect(() => {
    initFloatingParticles();

    // animationFrameId.current = requestAnimationFrame(animateParticles);

    // return () => {
    //   // Cleanup animation frame and DOM elements
    //   if (animationFrameId.current) {
    //     cancelAnimationFrame(animationFrameId.current);
    //   }
    // };
  });

  return (
    <div
      ref={container}
      className="floating-particles"
      id="floating-particles"
    />
  );
}
