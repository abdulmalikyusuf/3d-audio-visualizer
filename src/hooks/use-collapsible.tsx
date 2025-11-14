import React, { useRef, useState, useLayoutEffect, ReactNode, CSSProperties } from "react";
import { gsap } from "gsap";

interface CollapseProps {
    defaultOpen?: boolean;
    duration?: number;
    children: (props: {
        isOpen: boolean;
        toggle: () => void;
        bodyRef: React.RefObject<HTMLDivElement | null>;
        stateAttr: Record<string, string>;
        bodyStyles: CSSProperties;
    }) => ReactNode;
}

const Collapse: React.FC<CollapseProps> = ({
    defaultOpen = false,
    duration = 1,
    children,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const bodyRef = useRef<HTMLDivElement>(null);

    const toggle = () => {
        if (!bodyRef.current) return;

        if (isOpen) {
            gsap.to(bodyRef.current, {
                height: 0,
                duration: duration / 1.5,
                ease: "power2.inOut",
            });
        } else {
            gsap.fromTo(
                bodyRef.current,
                { height: 0 },
                {
                    height: bodyRef.current.scrollHeight,
                    duration,
                    ease: "elastic.out(1, 0.6)",
                    onComplete: () => {
                        gsap.set(bodyRef.current, { height: "auto" });
                    },
                }
            );
        }

        setIsOpen((prev) => !prev);
    };

    useLayoutEffect(() => {
        if (bodyRef.current) {
            gsap.set(bodyRef.current, { height: defaultOpen ? "auto" : 0 });
        }
    }, [defaultOpen]);



    // `asChild` allows the user to pass any element as the anchor
    const stateAttr = { "data-state": isOpen ? "open" : "closed" };
    const bodyStyles = { overflow: "hidden", height: "auto" }


    return <>{children({ isOpen, toggle, bodyRef, stateAttr, bodyStyles })}</>;
};

export default Collapse;


export function Trigger({ handleClick, isOpen }: { handleClick: () => void, isOpen: boolean }) {
    return (
        <button type="button" onClick={handleClick} className="collapsible-trigger">
            {isOpen ?
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-maximize2-icon lucide-maximize-2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg> :
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-minimize2-icon lucide-minimize-2">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                </svg>
            }
        </button>
    )
}
