import { useEffect, useState, useRef } from "react";
import { useMessage } from "../lib/store/message";

export function Notification() {
  const [visible, setVisible] = useState(false);
  const timerId = useRef<number>(null);
  const { notification } = useMessage();

  useEffect(() => {
    if (notification) {
      setVisible(true);
      timerId.current = setTimeout(() => setVisible(false), 3000);
    }
    return () => {
      if (timerId.current && notification) clearTimeout(timerId.current);
    };
  }, [notification]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.5s ease-in-out",
      }}
      className="notification"
      id="notification"
    >
      {notification ?? "Anomaly detected"}
    </div>
  );
}
