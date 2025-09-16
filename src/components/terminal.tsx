import { useEffect, useRef } from "react";

import { DraggablePanel } from "./draggable-panel";
import { useMessage } from "../lib/store/message";

const messageQueue = [
  "SYSTEM INITIALIZED. AUDIO ANALYSIS READY.",
  "SCANNING FOR ANOMALIES IN FREQUENCY SPECTRUM.",
];

export function Terminal() {
  const terminalContent = useRef<HTMLDivElement>(null);
  const typingLine = useRef<HTMLDivElement>(null);
  const {
    terminalMessage: { isCommand, message },
  } = useMessage();

  const addTerminalMessage = (message: string, isCommand = false) => {
    if (!terminalContent.current || !typingLine.current) return;

    const newLine = document.createElement("div");

    const isFilipMessage =
      message.toLowerCase().includes("filip") ||
      message.toLowerCase().includes("webflow");

    if (isCommand) {
      if (isFilipMessage) {
        newLine.className = "terminal-line command-line";
      } else {
        newLine.className = "terminal-line command-line";
      }
    } else {
      newLine.className = "terminal-line";
    }

    newLine.textContent = message;

    terminalContent.current.insertBefore(newLine, typingLine.current);
    terminalContent.current.scrollTop = terminalContent.current.scrollHeight;
  };

  const typeNextMessage = () => {
    if (!typingLine.current || !terminalContent.current) return;
    if (messageQueue.length === 0) return;

    const message = messageQueue.shift() as string;
    let charIndex = 0;

    const typingInterval = setInterval(() => {
      if (!typingLine.current) return;

      if (charIndex < message.length) {
        typingLine.current.textContent = message.substring(0, charIndex + 1);
        charIndex++;
      } else {
        clearInterval(typingInterval);

        const newLine = document.createElement("div");
        newLine.className = "terminal-line command-line";
        newLine.textContent = message;

        terminalContent.current!.insertBefore(newLine, typingLine.current);
        typingLine.current.textContent = "";

        terminalContent.current!.scrollTop =
          terminalContent.current!.scrollHeight;

        // schedule next message after delay
        setTimeout(typeNextMessage, 5000);
      }
    }, 50);
  };

  // Add manual messages when props change
  useEffect(() => {
    if (message) {
      addTerminalMessage(message, isCommand);
    }
  }, [message, isCommand]);

  useEffect(() => {
    let timeout: number;
    // eslint-disable-next-line prefer-const
    timeout = setTimeout(typeNextMessage, 3000);
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  });

  return (
    <DraggablePanel className="terminal-panel">
      <div className="terminal-header">
        <span>SYSTEM TERMINAL</span>
        <span id="terminal-status">ONLINE</span>
      </div>
      <div
        ref={terminalContent}
        className="terminal-content"
        id="terminal-content"
      >
        <div className="terminal-line">
          NEXUS v3.7.2 INITIALIZED. SECURE CONNECTION ESTABLISHED.
        </div>
        <div className="terminal-line command-line">
          gsap.inertia.init(throwProps: true, resistance: 0.35);
        </div>
        <div className="terminal-line regular-line">Draggable.create</div>
        <div className="terminal-line command-line">
          webflow.interactions.trigger
        </div>
        <div ref={typingLine} className="terminal-line typing"></div>
      </div>
    </DraggablePanel>
  );
}
