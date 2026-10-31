import { useControls } from "leva";
import { color, mix, mul, pow, smoothstep, uniform, uv, vec3 } from "three/tsl";
import * as THREE from "three/webgpu";

export const topColor = uniform(new THREE.Color("#ffffff"));
export const eyeIntensity = uniform(0);
export const bottomColor = uniform(new THREE.Color("#ffffff"));
export const eyeDepthColor = uniform(new THREE.Color("#ffffff"));
export const threshold = uniform(0);
export const eyeThreshold = uniform(0);
export const eyeDepthThreshold = uniform(0);

// Material
const skullMaterial = new THREE.MeshBasicNodeMaterial();

// Color Node
// Eye mask overall
const eyeMask = smoothstep(threshold, eyeThreshold, uv().y);
const gradientThreshold = smoothstep(0, 1, uv().y);
const gradient = mix(vec3(1), vec3(0), gradientThreshold); // Bottom to Top Gradient
// const finalColor = mix(topColor, bottomColor, eyeMask);
const baseSkull = mix(topColor, bottomColor, eyeMask);

const emissiveGlow = topColor.mul(eyeIntensity).mul(eyeMask.oneMinus());

// Eye gradient
const depthMask = smoothstep(0.1, eyeDepthThreshold, uv().y.oneMinus());
const eyeGradient = mix(vec3(1), eyeDepthColor, depthMask); // Depth to Front Gradient
const darkSkull = mul(baseSkull, eyeGradient).mul(gradient);
// skullMaterial.colorNode = mul(finalColor, eyeGradient).mul(gradient);
skullMaterial.colorNode = darkSkull.add(emissiveGlow);

export default function Skull({ nodes }) {
  useControls("Skull", {
    topColor: {
      value: "#ff0000",
      onChange: (v) => topColor.value.set(v),
    },
    eyeIntensity: {
      value: 6,
      min: 0,
      max: 20,
      step: 0.01,
      onChange: (v) => (eyeIntensity.value = v),
    },
    bottomColor: {
      value: "#bcb796",
      onChange: (v) => bottomColor.value.set(v),
    },
    threshold: {
      value: 0.23,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (threshold.value = v),
    },
    eyeThreshold: {
      value: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (eyeThreshold.value = v),
    },
    eyeDepthColor: {
      value: "#3a3f3b",
      onChange: (v) => eyeDepthColor.value.set(v),
    },
    eyeDepthThreshold: {
      value: 1,
      min: -2,
      max: 2,
      step: 0.001,
      onChange: (v) => (eyeDepthThreshold.value = v),
    },
  });

  return (
    <mesh
      geometry={nodes.Skull.geometry}
      material={skullMaterial}
      position={[1.643, 0, 0]}
    />
  );
}
