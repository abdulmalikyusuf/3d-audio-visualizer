import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const vertexShader = /*glsl*/ `
              attribute float size;
              varying vec3 vColor;
              uniform float uTime;
              
              void main() {
                vColor = color;
                
                vec3 pos = position;
                pos.x += sin(uTime * 0.1 + position.z * 0.2) * 0.05;
                pos.y += cos(uTime * 0.1 + position.x * 0.2) * 0.05;
                pos.z += sin(uTime * 0.1 + position.y * 0.2) * 0.05;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
              }
            `;

const fragmentShader = /*glsl*/ `
              varying vec3 vColor;
              
              void main() {
                float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                if (r > 0.5) discard;
                
                float glow = 1.0 - (r * 2.0);
                glow = pow(glow, 2.0);
                
                gl_FragColor = vec4(vColor, glow);
              }
            `;

function BackgroundParticles() {
  const particleCount = 3000;
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  // stable colors
  const color1 = useMemo(() => new THREE.Color(0xff4e42), []);
  const color2 = useMemo(() => new THREE.Color(0xc2362f), []);
  const color3 = useMemo(() => new THREE.Color(0xffb3ab), []);

  // generate attributes
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Array(particleCount * 3);
    const colors = new Array(particleCount * 3);
    const sizes = new Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      let color;
      const colorChoice = Math.random();
      if (colorChoice < 0.33) {
        color = color1;
      } else if (colorChoice < 0.66) {
        color = color2;
      } else {
        color = color3;
      }
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      // sizes[i] = 0.05;
      sizes[i] = 0.5;
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      sizes: new Float32Array(sizes),
    };
  }, [color1, color2, color3]);

  useFrame(({ clock }) => {
    if (material.current)
      material.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        uniforms={{ uTime: { value: 0 } }}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexColors
      />
    </points>
  );
}

export { BackgroundParticles };
