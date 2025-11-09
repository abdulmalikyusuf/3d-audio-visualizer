import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useShallow } from "zustand/shallow";

import { useThreeObject } from "../lib/store/object";
import { useControls } from "../lib/store/controls";
import sphereVertexShader from "../shaders/anomaly.vert";
import sphereFragmentShader from "../shaders/anomaly.frag";
import useAudioStore from "../lib/audio";
import { useMessage } from "../lib/store/message";
import type { ThreeEvent } from "@react-three/fiber";

const glowVertexShader = /*glsl*/ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform float audioLevel;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPosition = position * (1.0 + audioLevel * 0.2);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(vPosition, 1.0);
        }
      `;

const glowFragmentShader = /*glsl*/ `
        varying vec3 vNormal;
        varying vec3 vPosition;
        uniform vec3 color;
        uniform float time;
        uniform float audioLevel;

        void main() {
          vec3 viewDirection = normalize(cameraPosition - vPosition);
          float fresnel = 1.0 - max(0.0, dot(viewDirection, vNormal));
          fresnel = pow(fresnel, 3.0 + audioLevel * 3.0);

          float pulse = 0.5 + 0.5 * sin(time * 2.0);
          float audioFactor = 1.0 + audioLevel * 3.0;

          vec3 finalColor = color * fresnel * (0.8 + 0.2 * pulse) * audioFactor;

          float alpha = fresnel * (0.3 * audioFactor) * (1.0 - audioLevel * 0.2);

          gl_FragColor = vec4(finalColor, alpha);
        }
      `;

export function AnomalyObject() {
  const { isAudioPlaying, audioAnalyser, frequencyData } = useAudioStore(
    useShallow((state) => ({
      audioAnalyser: state.audioAnalyser,
      frequencyData: state.frequencyData,
      isAudioPlaying: state.isAudioPlaying,
    }))
  );
  const {
    resolution,
    distortion,
    rotation: rotationSpeed,
    reactivity: audioReactivity,
    sensitivity: audioSensitivity,
  } = useControls();
  const {
    disableControls,
    enableControls,
    isDraggingAnomaly,
    anomalyVelocity,
    anomalyTargetPosition,
    anomalyObjectPosition,
    setThreeObjectState,
  } = useThreeObject();
  const { setTerminalMessage, showNotification } = useMessage();

  const radius = 2;
  const anomalyObject = useRef<THREE.Group>(null);
  const outerMaterial = React.useRef<THREE.ShaderMaterial>(null);
  const glowMaterial = React.useRef<THREE.ShaderMaterial>(null);
  const mouse = new THREE.Vector2();
  const target = useRef(anomalyTargetPosition ?? new THREE.Vector3(0, 0, 0));
  const velocity = useRef(anomalyVelocity ?? new THREE.Vector2(0, 0));
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosition = useRef(new THREE.Vector2());
  const maxDragDistance = 3;

  const outerSphereUniforms = useMemo(
    () => ({
      time: {
        value: 0,
      },
      color: {
        value: new THREE.Color(0xff4e42),
      },
      audioLevel: {
        value: 0,
      },
      distortion: {
        value: distortion,
      },
    }),
    [distortion]
  );

  const glowUniforms = {
    time: {
      value: 0,
    },
    color: {
      value: new THREE.Color(0xff4e42),
    },
    audioLevel: {
      value: 0,
    },
  };

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    let audioLevel = 0;
    if (isAudioPlaying && audioAnalyser && frequencyData) {
      audioAnalyser.getByteFrequencyData(frequencyData as Uint8Array<ArrayBuffer>);
      let sum = 0;
      for (let i = 0; i < frequencyData.length; i++) {
        sum += frequencyData[i];
      }
      audioLevel = ((sum / frequencyData.length / 255) * audioSensitivity) / 5;
    }

    if (anomalyObject.current) {
      const audioRotationFactor = 1 + audioLevel * audioReactivity;
      anomalyObject.current.rotation.y +=
        0.005 * rotationSpeed * audioRotationFactor;
      anomalyObject.current.rotation.z +=
        0.002 * rotationSpeed * audioRotationFactor;
    }
    updateAnomalyPosition();

    if (outerMaterial.current) {
      outerMaterial.current.uniforms.time.value = time;
      outerMaterial.current.uniforms.audioLevel.value = audioLevel;
      outerMaterial.current.uniforms.distortion.value = distortion;
    }
    if (glowMaterial.current) {
      glowMaterial.current.uniforms.time.value = time;
      glowMaterial.current.uniforms.audioLevel.value = audioLevel;
    }
  });

  const updateAnomalyPosition = () => {
    if (!anomalyObject.current) return;
    if (!isDraggingAnomaly) {
      velocity.current.x *= 0.95;
      velocity.current.y *= 0.95;
      target.current.x += velocity.current.x * 0.1;
      target.current.y += velocity.current.y * 0.1;
      const springStrength = 0.1;
      velocity.current.x -= target.current.x * springStrength;
      velocity.current.y -= target.current.y * springStrength;
      if (
        Math.abs(target.current.x) < 0.05 &&
        Math.abs(target.current.y) < 0.05
      ) {
        target.current.set(0, 0, 0);
        velocity.current.set(0, 0);
      }
      const bounceThreshold = 3;
      const bounceDamping = 0.8;
      if (Math.abs(target.current.x) > bounceThreshold) {
        // console.log(target.current);
        velocity.current.x = -velocity.current.x * bounceDamping;
        target.current.x = Math.sign(target.current.x) * bounceThreshold;
        if (Math.abs(velocity.current.x) > 0.1) {
          setTerminalMessage(
            "ANOMALY BOUNDARY COLLISION DETECTED. ENERGY TRANSFER: " +
            (Math.abs(velocity.current.x) * 100).toFixed(0) +
            " UNITS"
          );
        }
      }
      if (Math.abs(target.current.y) > bounceThreshold) {
        velocity.current.y = -velocity.current.y * bounceDamping;
        target.current.y = Math.sign(target.current.y) * bounceThreshold;
        if (Math.abs(velocity.current.y) > 0.1) {
          setTerminalMessage(
            "ANOMALY BOUNDARY COLLISION DETECTED. ENERGY TRANSFER: " +
            (Math.abs(velocity.current.y) * 100).toFixed(0) +
            " UNITS"
          );
        }
      }
    }

    anomalyObject.current.position.x +=
      (target.current.x - anomalyObject.current.position.x) * 0.2;
    anomalyObject.current.position.y +=
      (target.current.y - anomalyObject.current.position.y) * 0.2;
    if (!isDraggingAnomaly) {
      anomalyObject.current.rotation.x += velocity.current.y * 0.01;
      anomalyObject.current.rotation.y += velocity.current.x * 0.01;
    }
  };

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    // if (event.eventObject === anomalyObject!.current) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    disableControls()
    setIsDragging(true);
    setThreeObjectState({ isDraggingAnomaly: true });
    dragStartPosition.current.set(event.clientX, event.clientY);

    setTerminalMessage(
      "ANOMALY INTERACTION DETECTED. PHYSICS SIMULATION ACTIVE.",
      true
    );
    showNotification("ANOMALY INTERACTION DETECTED");
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (isDragging) {
      event.stopPropagation();

      const deltaX = (event.clientX - dragStartPosition.current.x) * 0.05;
      const deltaY = -(event.clientY - dragStartPosition.current.y) * 0.05; // Note the negative sign for correct Y-axis direction

      target.current.x += deltaX;
      target.current.y += deltaY;

      // Clamp the position to the maxDragDistance
      const distance = target.current.length();
      console.log(distance, target.current.normalize());
      if (distance > maxDragDistance) {
        target.current.normalize().multiplyScalar(maxDragDistance);
      }

      setThreeObjectState({
        anomalyTargetPosition: target.current,
      });

      // Update velocity and drag start position
      velocity.current.x = deltaX * 2;
      velocity.current.y = deltaY * 2;
      dragStartPosition.current.x = event.clientX;
      dragStartPosition.current.y = event.clientY;
    }
  };
  // const handlePointerMove1 = (event: ThreeEvent<PointerEvent>) => {
  //   if (isDragging) {
  //     event.stopPropagation();

  //     mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  //     mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  //     // Fix the drag direction to match mouse movement
  //     const deltaX = (mouse.x - dragStartPosition.current.x) * 5;
  //     const deltaY = (mouse.y - dragStartPosition.current.y) * 5;
  //     console.log(deltaX);
  //     target.current.x += deltaX;
  //     target.current.y += deltaY;
  //     setThreeObjectState({ anomalyTargetPosition: target.current });

  //     // Clamp the position to the maxDragDistance
  //     const distance = Math.sqrt(
  //       target.current.x * target.current.x +
  //       target.current.y * target.current.y
  //     );
  //     if (distance > maxDragDistance) {
  //       const scale = maxDragDistance / distance;
  //       console.log(distance, maxDragDistance, scale);

  //       target.current.x *= scale;
  //       target.current.y *= scale;
  //       setThreeObjectState({ anomalyTargetPosition: target.current });
  //     }

  //     // Update velocity
  //     setThreeObjectState({ anomalyVelocity: velocity.current });
  //     velocity.current.x = deltaX * 2;
  //     velocity.current.y = deltaY * 2;
  //     // Update the start position for the next frame
  //     dragStartPosition.current.x = mouse.x;
  //     dragStartPosition.current.y = mouse.y;
  //   }
  // };

  const handlePointerUp = () => {
    if (isDragging) {
      enableControls()
      setIsDragging(false);
      setThreeObjectState({ isDraggingAnomaly: false });

      const vx = velocity.current.x.toFixed(2);
      const vy = velocity.current.y.toFixed(2);
      setTerminalMessage(
        `INERTIAPLUGIN.TRACK('#ANOMALY', {THROWRESISTANCE: 0.45, VELOCITY: {X: ${vx}, Y: ${vy}}});`,
        true
      );
    }
  };

  const handlePointerLeave = () => {
    if (isDragging) {
      enableControls()
      setIsDragging(false);
      setThreeObjectState({ isDraggingAnomaly: false });
    }
  };

  useEffect(() => {
    if (anomalyObjectPosition)
      anomalyObject.current?.position.set(
        anomalyObjectPosition.x,
        anomalyObjectPosition.y,
        anomalyObjectPosition.z
      );
  }, [anomalyObjectPosition]);

  return (
    <group
      ref={anomalyObject}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <mesh>
        <icosahedronGeometry
          args={[radius, Math.max(1, Math.floor(resolution / 8))]}
        />
        <shaderMaterial
          ref={outerMaterial}
          vertexShader={sphereVertexShader}
          fragmentShader={sphereFragmentShader}
          uniforms={outerSphereUniforms}
          wireframe
          transparent
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[radius * 1.2, 32, 32]} />
        <shaderMaterial
          ref={glowMaterial}
          uniforms={glowUniforms}
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          transparent
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
