import { useRef, useCallback, useImperativeHandle, forwardRef, Ref } from "react";
import { useShallow } from "zustand/shallow";

import { WaveformVisualizers } from "./visualizers/waveform";
import useAudioStore from "../lib/audio";
import { useAnimationFrame } from "../hooks/use-animation-frame";

const phases = ["π/4", "π/2", "π/6", "3π/4"];

export interface AnomalyMetricsRef {
    handleAnalyze: () => void;
}


export const AnomalyMetrics = forwardRef((props, ref: Ref<AnomalyMetricsRef>) => {
    const stabilityBar = useRef<HTMLDivElement>(null);
    const statusIndicator = useRef<HTMLDivElement>(null);
    const stabilityValueRef = useRef("75%");
    const massValueRef = useRef("1.728");
    const energyValueRef = useRef("5.3e8 J");
    const varianceValueRef = useRef(0.0042);
    const peakValueRef = useRef("127.3 HZ");
    const amplitudeValueRef = useRef(0.56);
    const phaseValueRef = useRef("π/4");

    const { frequencyData, audioAnalyser, audioContext } = useAudioStore(useShallow((s) => ({
        frequencyData: s.frequencyData, audioAnalyser: s.audioAnalyser, audioContext: s.audioContext
    })));

    const calculateAudioMetrics = useCallback(() => {
        if (!audioAnalyser || !frequencyData || !audioContext) return;

        audioAnalyser.getByteFrequencyData(
            frequencyData as Uint8Array<ArrayBuffer>
        );

        let maxValue = 0;
        let maxIndex = 0;
        for (let i = 0; i < frequencyData.length; i++) {
            if (frequencyData[i] > maxValue) {
                maxValue = frequencyData[i];
                maxIndex = i;
            }
        }

        // --- Peak frequency ---
        const sampleRate = audioContext.sampleRate;
        const peakFrequency =
            (maxIndex * sampleRate) / (audioAnalyser.frequencyBinCount * 2);
        peakValueRef.current = (`${Math.round(peakFrequency)} HZ`);

        // --- Amplitude ---
        const sum = frequencyData.reduce((a, b) => a + b, 0);
        const amplitude = sum / (frequencyData.length * 255);
        amplitudeValueRef.current = Math.round((amplitude + Number.EPSILON) * 100) / 100;

        // --- Stability ---
        const stability = 50 + Math.round(amplitude * 50);
        stabilityValueRef.current = `${stability}%`;
        if (stabilityBar.current) {
            stabilityBar.current.style.width = `${stability}%`;
        }
        if (statusIndicator.current) {
            if (stability < 40) {
                statusIndicator.current.style.color = "#ff00a0";
            } else if (stability < 70) {
                statusIndicator.current.style.color = "#ffae00";
            } else {
                statusIndicator.current.style.color = "#ff4e42";
            }
        }

        // --- Occasionally update other values ---
        if (Math.random() < 0.05) {
            massValueRef.current =
                (
                    Math.round((1 + amplitude * 2 + Number.EPSILON) * 1000) / 1000
                ).toString()

            energyValueRef.current = `${Math.round((amplitude * 10 + Number.EPSILON) * 10) / 10}e8 J`;
            varianceValueRef.current = Math.round((amplitude * 0.01 + Number.EPSILON) * 10000) / 10000

            phaseValueRef.current = (phases[Math.floor(Math.random() * phases.length)]);
        }
    }, [audioAnalyser, frequencyData, audioContext,]);

    useAnimationFrame(() => {
        calculateAudioMetrics();
    });
    // Expose functions to the parent via the ref
    useImperativeHandle(ref, () => ({
        handleAnalyze,
    }));

    const handleAnalyze = () => {
        if (stabilityBar.current) stabilityBar.current.style.width = "45%";
        stabilityValueRef.current = "45%";
        if (statusIndicator.current)
            statusIndicator.current.style.color = "#ff00a0";
        setTimeout(() => {
            massValueRef.current = (Math.random() * 2 + 1).toFixed(3);
            energyValueRef.current = ((Math.random() * 9 + 1).toFixed(1) + "e8 J");
            varianceValueRef.current = Math.random() * 0.01;
            peakValueRef.current = ((Math.random() * 200 + 100).toFixed(1) + " HZ");
            amplitudeValueRef.current = Math.random() * 0.5 + 0.3;
        }, 3000)
    }
    return (
        <>
            <div
                className="data-panel"
                style={{ position: "absolute", top: "20px", left: "20px" }}
            >
                <div className="data-panel-title">
                    <span>ANOMALY METRICS</span>
                    <span id="status-indicator" ref={statusIndicator}>
                        ●
                    </span>
                </div>
                <div className="data-bar">
                    <div
                        className="data-bar-fill"
                        id="stability-bar"
                        ref={stabilityBar}
                        style={{ width: "75%" }}
                    ></div>
                </div>
                <div className="data-readouts">
                    <div className="data-row">
                        <span className="data-label">STABILITY INDEX:</span>
                        <span className="data-value" id="stability-value">
                            {stabilityValueRef.current}
                        </span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">MASS COEFFICIENT:</span>
                        <span className="data-value" id="mass-value">
                            {massValueRef.current}
                        </span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">ENERGY SIGNATURE:</span>
                        <span className="data-value" id="energy-value">
                            {energyValueRef.current}
                        </span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">QUANTUM VARIANCE:</span>
                        <span className="data-value" id="variance-value">
                            {varianceValueRef.current.toFixed(4)}
                        </span>
                    </div>
                </div>
            </div>

            <div
                className="data-panel"
                style={{ position: "absolute", top: "20px", right: "20px" }}
            >
                <div className="data-panel-title">ANOMALY METRICS</div>
                <WaveformVisualizers />
                <div className="data-readouts">
                    <div className="data-row">
                        <span className="data-label">PEAK FREQUENCY:</span>
                        <span className="data-value" id="peak-value">
                            {peakValueRef.current}
                        </span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">AMPLITUDE:</span>
                        <span className="data-value" id="amplitude-value">
                            {amplitudeValueRef.current}
                        </span>
                    </div>
                    <div className="data-row">
                        <span className="data-label">PHASE SHIFT:</span>
                        <span className="data-value" id="phase-value">
                            {phaseValueRef.current}
                        </span>
                    </div>
                </div>
            </div>
        </>
    )
})
