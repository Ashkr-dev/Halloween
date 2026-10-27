import { useFrame } from "@react-three/fiber";
import { uniform } from "three/tsl";
import * as THREE from "three/webgpu";

// ==========================================
// 1. Static TSL Uniforms (Isolated for Lanterns)
// ==========================================
export const lanternColor = uniform(new THREE.Color("#6bff30"));
export const lanternIntensity = uniform(1.5);

// ==========================================
// 2. Isolated Material Setup
// ==========================================
const lanternMaterial = new THREE.MeshBasicNodeMaterial();
lanternMaterial.colorNode = lanternColor;

// ==========================================
// 3. Lanterns Sub-Component
// ==========================================
export function Lanterns({ nodes, controls }) {
  useFrame(() => {
    lanternColor.value.set(controls.lanternColor);
    lanternIntensity.value = controls.lanternIntensity;
  });

  return (
    <>
      <mesh
        geometry={nodes.candle_tips.geometry}
        material={lanternMaterial}
        position={[-4.126, 0.202, 1.419]}
      />
      <mesh
        geometry={nodes["House-light"].geometry}
        material={lanternMaterial}
        position={[0.008, 0, -6.016]}
      />
      <mesh
        geometry={nodes.lanterns.geometry}
        material={lanternMaterial}
        position={[1.6, 1.706, 7.683]}
      />
    </>
  );
}
