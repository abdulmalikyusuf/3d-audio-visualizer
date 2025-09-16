import {
  useState,
  useEffect,
  useRef,
  type MouseEvent,
  type ChangeEvent,
} from "react";
import * as THREE from "three";
import { useShallow } from "zustand/shallow";

import { WaveformVisualizers } from "./visualizers/waveform";
import { DraggablePanel } from "./draggable-panel";
import { SpectrumAnalyzer } from "./visualizers/spectrum-analyzer";
import useAudioStore from "../lib/audio";
import { useControls } from "../lib/store/controls";
import { useThreeObject } from "../lib/store/object";
import { Terminal } from "./terminal";
import { useMessage } from "../lib/store/message";

function UI() {
  const timestamp = useRef<HTMLDivElement>(null);
  const audiofileInput = useRef<HTMLInputElement>(null);
  const timestampInterval = useRef<number>(null);
  const audioMetricsRAFId = useRef<number>(null);
  const stabilityBar = useRef<HTMLDivElement>(null);
  const statusIndicator = useRef<HTMLDivElement>(null);
  const [stabilityValue, setStabilityValue] = useState("75%");
  const [massValue, setMassValue] = useState("1.728");
  const [energyValue, setEnergyValue] = useState("5.3e8 J");
  const [varianceValue, setVarianceValue] = useState("0.0042");
  const [peakValue, setPeakValue] = useState("127.3 HZ");
  const [amplitudeValue, setAmplitudeValue] = useState("0.56");
  const [phaseValue, setPhaseValue] = useState("π/4");

  const {
    initAudio,
    isAudioInitialized,
    loadAudioFromURL,
    initAudioFile,
    frequencyData,
    audioAnalyser,
    audioContext,
  } = useAudioStore();
  const {
    rotation,
    resolution,
    distortion,
    reactivity,
    sensitivity,
    setRotation,
    setResolution,
    setDistortion,
    setReactivity,
    setSensitivity,
  } = useControls(
    useShallow((state) => ({
      rotation: state.rotation,
      resolution: state.resolution,
      distortion: state.distortion,
      reactivity: state.reactivity,
      sensitivity: state.sensitivity,
      setRotation: state.setRotation,
      setResolution: state.setResolution,
      setDistortion: state.setDistortion,
      setReactivity: state.setReactivity,
      setSensitivity: state.setSensitivity,
    }))
  );
  const { setThreeObjectState } = useThreeObject();
  const { showNotification, setTerminalMessage } = useMessage();

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

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      initAudioFile(file);
    }
  };

  const handleLoadDemo = (
    e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>
  ) => {
    const url = e.currentTarget.dataset.url;
    if (url) {
      if (!isAudioInitialized) {
        initAudio();
      }
      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }
      document.querySelectorAll(".demo-track-btn").forEach((b) => {
        b.classList.remove("active");
      });
      e.currentTarget.classList.add("active");
      loadAudioFromURL(url);
    }
  };

  const analyze = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.currentTarget.textContent = "ANALYZING...";
    e.currentTarget.disabled = true;
    if (stabilityBar.current) stabilityBar.current.style.width = "45%";
    setStabilityValue("45%");
    if (statusIndicator.current)
      statusIndicator.current.style.color = "#ff00a0";
    setTimeout(() => {
      e.currentTarget.textContent = "ANALYZE";
      e.currentTarget.disabled = false;
      setTerminalMessage(
        "ANALYSIS COMPLETE. ANOMALY SIGNATURE IDENTIFIED.",
        true
      );
      showNotification("ANOMALY ANALYSIS COMPLETE");
      setMassValue((Math.random() * 2 + 1).toFixed(3));
      setEnergyValue((Math.random() * 9 + 1).toFixed(1) + "e8 J");
      setVarianceValue((Math.random() * 0.01).toFixed(4));
      setPeakValue((Math.random() * 200 + 100).toFixed(1) + " HZ");
      setAmplitudeValue((Math.random() * 0.5 + 0.3).toFixed(2));
      const phases = ["π/4", "π/2", "π/6", "3π/4"];
      setPhaseValue(phases[Math.floor(Math.random() * phases.length)]);
    }, 3000);
  };

  const handleReset = () => {
    setRotation(1.0);
    setResolution(32);
    setDistortion(1.0);
    setReactivity(1.0);
    setSensitivity(5.0);
    setThreeObjectState({
      anomalyTargetPosition: new THREE.Vector3(0, 0, 0),
      anomalyVelocity: new THREE.Vector2(0, 0),
      anomalyObjectPosition: new THREE.Vector3(0, 0, 0),
    });
    showNotification("SETTINGS RESET TO DEFAULT VALUES");
  };

  useEffect(() => {
    function calculateAudioMetrics() {
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
      setPeakValue(`${Math.round(peakFrequency)} HZ`);

      // --- Amplitude ---
      const sum = frequencyData.reduce((a, b) => a + b, 0);
      const amplitude = sum / (frequencyData.length * 255);
      setAmplitudeValue(
        (Math.round((amplitude + Number.EPSILON) * 100) / 100).toString()
      );

      // --- Stability ---
      const stability = 50 + Math.round(amplitude * 50);
      setStabilityValue(`${stability}%`);
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
        setMassValue(
          (
            Math.round((1 + amplitude * 2 + Number.EPSILON) * 1000) / 1000
          ).toString()
        );
        setEnergyValue(
          `${Math.round((amplitude * 10 + Number.EPSILON) * 10) / 10}e8 J`
        );
        setVarianceValue(
          (
            Math.round((amplitude * 0.01 + Number.EPSILON) * 10000) / 10000
          ).toString()
        );

        const phases = ["π/4", "π/2", "π/6", "3π/4"];
        setPhaseValue(phases[Math.floor(Math.random() * phases.length)]);
      }
      audioMetricsRAFId.current = requestAnimationFrame(calculateAudioMetrics);
    }
    audioMetricsRAFId.current = requestAnimationFrame(calculateAudioMetrics);

    return () => {
      if (!audioMetricsRAFId.current) return;
      cancelAnimationFrame(audioMetricsRAFId.current);
    };
  }, [audioAnalyser, audioContext, frequencyData]);

  return (
    <>
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
              {stabilityValue}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">MASS COEFFICIENT:</span>
            <span className="data-value" id="mass-value">
              {massValue}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">ENERGY SIGNATURE:</span>
            <span className="data-value" id="energy-value">
              {energyValue}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">QUANTUM VARIANCE:</span>
            <span className="data-value" id="variance-value">
              {varianceValue}
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
              {peakValue}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">AMPLITUDE:</span>
            <span className="data-value" id="amplitude-value">
              {amplitudeValue}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">PHASE SHIFT:</span>
            <span className="data-value" id="phase-value">
              {phaseValue}
            </span>
          </div>
        </div>
      </div>

      <DraggablePanel
        className="control-panel"
        selector="span#control-panel-handle"
        style={{ top: "50%", left: "20px", transform: "translateY(-50%)" }}
      >
        <div className="panel-header">
          <span className="data-panel-title">ANOMALY CONTROLS</span>
          <span className="drag-handle" id="control-panel-handle">
            ⋮⋮
          </span>
        </div>
        <div className="control-group">
          <div className="control-row">
            <span className="control-label">ROTATION SPEED</span>
            <span className="control-value" id="rotation-value">
              {rotation.toFixed(1)}
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="5"
              value={rotation}
              onChange={(e) => setRotation(parseFloat(e.target.value))}
              step="0.1"
              className="slider"
              id="rotation-slider"
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">RESOLUTION</span>
            <span className="control-value" id="resolution-value">
              {resolution}
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="12"
              max="64"
              value={resolution}
              onChange={(e) => setResolution(parseInt(e.target.value))}
              step="4"
              className="slider"
              id="resolution-slider"
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">DISTORTION</span>
            <span className="control-value" id="distortion-value">
              {distortion.toFixed(1)}
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              className="slider"
              id="distortion-slider"
              value={distortion}
              onChange={(e) => setDistortion(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="control-group">
          <div className="control-row">
            <span className="control-label">AUDIO REACTIVITY</span>
            <span className="control-value" id="reactivity-value">
              {reactivity.toFixed(1)}
            </span>
          </div>
          <div className="slider-container">
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              className="slider"
              id="reactivity-slider"
              value={reactivity}
              onChange={(e) => setReactivity(parseFloat(e.target.value))}
            />
          </div>
        </div>

        <div className="buttons">
          <button className="btn" id="reset-btn" onClick={handleReset}>
            RESET
          </button>
          <button className="btn" id="analyze-btn" onClick={analyze}>
            ANALYZE
          </button>
        </div>
      </DraggablePanel>

      <Terminal />

      <DraggablePanel
        className="spectrum-analyzer"
        selector="span#spectrum-handle"
      >
        <div className="spectrum-header">
          <span>AUDIO SPECTRUM ANALYZER</span>
          <span className="drag-handle" id="spectrum-handle">
            ⋮⋮
          </span>
        </div>
        <SpectrumAnalyzer />
        <div className="audio-controls">
          <div className="demo-tracks">
            <span className="demo-tracks-label">DEMO TRACKS:</span>
            <button
              type="button"
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Merkaba.mp3"
              onClick={handleLoadDemo}
            >
              MERKABA
            </button>
            <button
              type="button"
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Dhamika.mp3"
              onClick={handleLoadDemo}
            >
              DHAMIKA
            </button>
            <button
              type="button"
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/Vacant.mp3"
              onClick={handleLoadDemo}
            >
              VACANT
            </button>
            <button
              type="button"
              className="demo-track-btn"
              data-url="https://assets.codepen.io/7558/lxstnght-back_1.mp3"
              onClick={handleLoadDemo}
            >
              LXSTNGHT
            </button>
          </div>

          <input
            type="file"
            id="audio-file-input"
            className="audio-file-input"
            ref={audiofileInput}
            accept="audio/*"
            onChange={handleFileUpload}
          />
          <button
            type="button"
            className="audio-file-btn"
            id="file-btn"
            onClick={() => {
              if (!isAudioInitialized) {
                initAudio();
              }
              if (audioContext && audioContext.state === "suspended") {
                audioContext.resume();
              }
              audiofileInput.current?.click();
            }}
          >
            UPLOAD AUDIO FILE
          </button>
          <div className="audio-file-label" id="file-label">
            NO FILE SELECTED
          </div>

          <audio
            id="audio-player"
            className="audio-player"
            crossOrigin="anonymous"
          ></audio>

          <div className="controls-row">
            <div className="audio-sensitivity" style={{ flex: 1 }}>
              <div className="audio-sensitivity-label">
                <span>SENSITIVITY</span>
                <span
                  className="audio-sensitivity-value"
                  id="sensitivity-value"
                >
                  {sensitivity.toFixed(1)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="0.1"
                className="slider"
                id="sensitivity-slider"
                value={sensitivity}
                onChange={(e) => setSensitivity(parseFloat(e.target.value))}
              />
            </div>
          </div>
        </div>
      </DraggablePanel>
    </>
  );
}

export default UI;
