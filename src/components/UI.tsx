import { CSSProperties, useRef, type MouseEvent } from "react";
import * as THREE from "three";
import { useShallow } from "zustand/shallow";

import { DraggablePanel } from "./draggable-panel";
import { useControls } from "../lib/store/controls";
import { useThreeObject } from "../lib/store/object";
import { Terminal } from "./terminal";
import { useMessage } from "../lib/store/message";
import { MediaPlayer } from "./media-player";
import { Interface } from "./interface";
import { AnomalyMetrics, AnomalyMetricsRef } from "./anomaly-metrics";
import Collapse, { Trigger } from "../hooks/use-collapsible";


function UI() {
  const anomalyMetricsRef = useRef<AnomalyMetricsRef>(null);
  const {
    rotation,
    resolution,
    distortion,
    reactivity,
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
      setRotation: state.setRotation,
      setResolution: state.setResolution,
      setDistortion: state.setDistortion,
      setReactivity: state.setReactivity,
      setSensitivity: state.setSensitivity,
    }))
  );
  const { setThreeObjectState } = useThreeObject();
  const { showNotification, setTerminalMessage } = useMessage();

  const analyze = (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
    e.currentTarget.textContent = "ANALYZING...";
    e.currentTarget.disabled = true;
    setTimeout(() => {
      e.currentTarget.textContent = "ANALYZE";
      e.currentTarget.disabled = false;
      setTerminalMessage(
        "ANALYSIS COMPLETE. ANOMALY SIGNATURE IDENTIFIED.",
        true
      );
      showNotification("ANOMALY ANALYSIS COMPLETE");
      if (anomalyMetricsRef.current) {
        anomalyMetricsRef.current.handleAnalyze();
      }
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

  return (
    <>
      <Interface />

      <AnomalyMetrics ref={anomalyMetricsRef} />

      <DraggablePanel
        className="control-panel"
        selector="span#control-panel-handle"
        style={{ top: "50%", left: "20px", transform: "translateY(-50%)", overflow: "hidden" }}
      >
        <Collapse duration={0.6}>
          {({ isOpen, toggle, bodyRef, stateAttr, bodyStyles }) => (
            <>
              <div className="panel-header"{...stateAttr}>
                <span className="data-panel-title">ANOMALY CONTROLS</span>

                <div className="panel-header-buttons">
                  <span className="drag-handle" id="control-panel-handle">
                    ⋮⋮
                  </span>
                  <Trigger isOpen={isOpen} handleClick={toggle} />
                </div>
              </div>
              <div className="" ref={bodyRef} {...stateAttr} style={bodyStyles}>
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
                      style={{ "--progress": (`${(rotation / 5) * 100}%`) } as CSSProperties}
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
                      style={{ "--progress": (`${((resolution - 12) / (64 - 12)) * 100}%`) } as CSSProperties}
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
                      style={{ "--progress": (`${(distortion / 3) * 100}%`) } as CSSProperties}
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
                      style={{ "--progress": (`${(reactivity / 2) * 100}%`) } as CSSProperties}
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

              </div>
            </>
          )}
        </Collapse>
      </DraggablePanel>

      <Terminal />

      <DraggablePanel
        className="spectrum-analyzer"
        selector="span#spectrum-handle"
      >
        <Collapse defaultOpen duration={0.6}>
          {({ isOpen, toggle, bodyRef, stateAttr, bodyStyles }) => (
            <>
              <div className="spectrum-header">
                <span>AUDIO SPECTRUM ANALYZER</span>

                <div className="panel-header-buttons">
                  <span className="drag-handle" id="spectrum-handle">
                    ⋮⋮
                  </span>
                  <Trigger isOpen={isOpen} handleClick={toggle} />
                </div>
              </div>
              <MediaPlayer ref={bodyRef} {...stateAttr} style={bodyStyles} />
            </>
          )}
        </Collapse>
      </DraggablePanel>
    </>
  );
}

export default UI;
