import { useFrame } from "@react-three/fiber";
import { Fn, mix, smoothstep, uniform, uv, vec2 } from "three/tsl";
import * as THREE from "three/webgpu";

// ==========================================
// 1. Static TSL Uniforms (Isolated for Wings)
// ==========================================
export const wingTopColor = uniform(new THREE.Color("#6a32e2"));
export const wingBottomColor = uniform(new THREE.Color("#e17cff"));
export const wingIntensity = uniform(4.9);
export const wingGradient = uniform(vec2(0.33, 1.0));

// ==========================================
// 2. Exported Core Gradient Node Graph
// ==========================================
export const wingGradientNode = Fn(() => {
  const gradient = smoothstep(wingGradient.x, wingGradient.y, uv(0).y);
  return mix(wingTopColor, wingBottomColor, gradient);
});

// ==========================================
// 3. Isolated Material Setup
// ==========================================
const wingMaterial = new THREE.MeshBasicNodeMaterial({
  side: THREE.DoubleSide,
});
wingMaterial.colorNode = wingGradientNode();

// ==========================================
// 4. Wings Sub-Component
// ==========================================
export function Wings({ geometry, controls }) {
  useFrame(() => {
    wingTopColor.value.set(controls.wingTopColor);
    wingBottomColor.value.set(controls.wingBottomColor);
    wingIntensity.value = controls.wingIntensity;
    wingGradient.value.set(controls.wingGradient[0], controls.wingGradient[1]);
  });

  return (
    <mesh
      geometry={geometry}
      material={wingMaterial}
      position={[0.003, 1.599, 0.032]}
    />
  );
}
