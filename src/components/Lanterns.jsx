import { useEffect, useMemo } from "react";
import { Fn, min, uniform, uv } from "three/tsl";
import * as THREE from "three/webgpu";

// ==========================================
// 1. Static TSL Uniforms (Isolated for Lanterns)
// ==========================================
export const lanternColor = uniform(new THREE.Color("#6bff30"));
export const lanternIntensity = uniform(1.5);

// ==========================================
// 2. Pure Static TSL Graph (Compiled Exactly ONCE)
// ==========================================
const getLanternColorNode = Fn(([uColor, uIntensity]) => {
  // Static calculation tree layout
  const gradient = min(uv().x.mul(2).pow(3), uv().x.mul(1.2).pow(2).oneMinus());
  
  // FIX: Successfully multiply intensity down to fragment execution block!
  return uColor.mul(gradient).mul(uIntensity);
});

// ==========================================
// 3. Lanterns Component
// ==========================================
export function Lanterns({ nodes }) {
  // REMOVED: useFrame loop & 'controls' prop requirement!

  // 1. Instanced material setup inside lifecycle bounds
  const localMaterial = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial();
    
    // Bind the static layout reference passing your global uniform descriptors
    mat.colorNode = getLanternColorNode(lanternColor, lanternIntensity);
    
    return mat;
  }, []);

  // 2. Clean memory allocations upon component destruction stage
  useEffect(() => {
    return () => {
      localMaterial.dispose();
    };
  }, [localMaterial]);

  return (
    <>
      <mesh
        geometry={nodes.candle_tips.geometry}
        material={localMaterial}
        position={[-4.126, 0.202, 1.419]}
      />
      <mesh
        geometry={nodes["House-light"].geometry}
        material={localMaterial}
        position={[0.008, 0, -6.016]}
      />
      <mesh 
        geometry={nodes.lanterns.geometry} 
        material={localMaterial} 
      />
    </>
  );
}
