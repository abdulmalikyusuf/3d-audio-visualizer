import { useRef, useState } from "react";
import { useMessage } from "../lib/store/message";

export function CrypticMessages() {
    const { setTerminalMessage } =
        useMessage();
    const crypticMessageTimeout = useRef<number[]>([]);
    const currentMessageIndex = useRef(0);
    const lastUserActionTime = useRef(Date.now());
    const [_, forceRerender] = useState(0); // optional: if you ever need UI refresh

    // 👇 Instead of useEffect, attach listeners immediately once per component instance
    if (!window.__crypticListenersAdded) {
        const handleUserActivity = () => {
            lastUserActionTime.current = Date.now();
        };

        document.addEventListener("mousemove", handleUserActivity);
        document.addEventListener("keydown", handleUserActivity);

        // mark so we don’t attach multiple times if multiple renders
        (window as any).__crypticListenersAdded = true;
    }

    // Main cryptic message scheduling (rewritten without useEffect)
    if (crypticMessageTimeout.current.length === 0) {
        const timeoutIds: number[] = [];
        crypticMessageTimeout.current = timeoutIds;

        const scheduleCrypticMessages = () => {
            if (Date.now() - lastUserActionTime.current > 10000) {
                const messages = [
                    "GSAP.TO('#FILIP', {POSITION: 'WEBFLOW', DURATION: '3.0 QUANTUM_CYCLES'});",
                    "CONST FILIP = NEW DESIGNER({SKILLS: ['GSAP', 'THREEJS', 'WEBFLOW', 'NEURAL_UI']});",
                    "AWAIT WEBFLOW.HIRE(FILIP, {ROLE: 'DESIGNER', SALARY: 'COMPETITIVE'});",
                    "SYSTEM.INTEGRATE(FILIP.CREATIVITY, {TARGET: 'WEBFLOW_ECOSYSTEM', EFFICIENCY: 0.97});",
                    "TIMELINE.FORK({AGENT: 'FILIP', MISSION: 'ELEVATE_DIGITAL_EXPERIENCES', PROBABILITY: 0.998});",
                ];

                const selectedMessage = messages[currentMessageIndex.current];
                setTerminalMessage(selectedMessage, true);
                currentMessageIndex.current =
                    (currentMessageIndex.current + 1) % messages.length;
            }
        };

        timeoutIds[0] = setTimeout(() => {
            const delay = 10000 + Math.random() * 15000;

            timeoutIds[1] = setTimeout(scheduleCrypticMessages, delay);
            timeoutIds[2] = setTimeout(() => {
                setTerminalMessage("FILIPPORTFOLIO.VERSION = 'EXCEPTIONAL';", true);
            }, 15000);
        }, 10000);
    }

    return null;
}
