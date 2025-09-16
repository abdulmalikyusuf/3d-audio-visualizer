import { useEffect, useRef, type HTMLAttributes } from "react";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";

// register Draggable plugin
if (typeof window !== "undefined" && gsap && Draggable) {
  gsap.registerPlugin(Draggable);
}

interface DraggablePanelProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  selector?: string; // optional selector for drag handle
}

export function DraggablePanel({
  children,
  selector,
  ...props
}: DraggablePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!panelRef.current) return;

    const element = panelRef.current;

    Draggable.create(element, {
      type: "x,y",
      edgeResistance: 0.65,
      bounds: document.body,
      handle: selector ? (element.querySelector(selector) as Element) : element,
      inertia: true,
      throwResistance: 0.85,
      onDragStart: function () {
        const panels = document.querySelectorAll(
          ".terminal-panel, .control-panel, .spectrum-analyzer, .data-panel"
        );
        let maxZ = 10;
        panels.forEach((panel) => {
          const z = parseInt(window.getComputedStyle(panel).zIndex);
          if (z > maxZ) maxZ = z;
        });
        element.style.zIndex = String(maxZ + 1);

        // custom logging hook (replace with your own)
        if (
          typeof window !== "undefined" &&
          (window as any).addTerminalMessage
        ) {
          (window as any).addTerminalMessage(
            `PANEL DRAG INITIATED: ${element.className}`
          );
        }
      },
      onDragEnd: function () {
        if (
          typeof window !== "undefined" &&
          (window as any).addTerminalMessage
        ) {
          (window as any).addTerminalMessage(
            `DRAGGABLE.INERTIA({TARGET: '${
              element.className
            }', VELOCITY: {X: ${this.getVelocity("x").toFixed(
              2
            )}, Y: ${this.getVelocity("y").toFixed(2)}}});`,
            true
          );
        }
      },
    });
  }, [selector]);

  return (
    <div ref={panelRef} {...props}>
      {children}
    </div>
  );
}
