import { useEffect, useRef } from "react";

export function Interface() {
  const timestamp = useRef<HTMLDivElement>(null);
  const timestampInterval = useRef<number>(null);

  useEffect(() => {
    function updateTimestamp() {
      if (!timestamp.current) return;
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");
      timestamp.current.textContent = `TIME: ${hours}:${minutes}:${seconds}`;
    }
    timestampInterval.current = setInterval(updateTimestamp, 1000);
    updateTimestamp();

    return () => {
      if (timestampInterval.current) {
        clearInterval(timestampInterval.current);
      }
    };
  }, []);
  return (
    <div className="interface-container">
      <div className="header">
        <div className="header-item"></div>
        <div className="header-item">
          GSAP.INERTIA.WEBFLOW.TIMELINE
          <br />
          v3.13.0
        </div>
        <div className="header-item" id="timestamp" ref={timestamp}>
          TIME: 00:00:00
        </div>
      </div>

      <div className="scanner-frame">
        <div className="corner-tl"></div>
        <div className="corner-tr"></div>
        <div className="corner-bl"></div>
        <div className="corner-br"></div>
        <div className="scanner-id">GSAP.TIMELINE</div>
        <div className="scanner-id-right">IX2.ANIMATION.SEQUENCE(0x4F2E)</div>
      </div>
    </div>
  );
}
