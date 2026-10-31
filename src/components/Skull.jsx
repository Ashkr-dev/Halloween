import { useControls } from "leva";
import { useMemo, useEffect } from "react";
import { mix, smoothstep, uniform, uv, vec3, oneMinus } from "three/tsl";
import * as THREE from "three/webgpu";

export default function Skull({ nodes }) {
  // 1. Encapsulate uniforms and material cleanly to prevent shader re-compilation
  const { material, uniforms } = useMemo(() => {
    const topColor = uniform(new THREE.Color("#ff0000"));
    const bottomColor = uniform(new THREE.Color("#bcb796"));
    const eyeDepthColor = uniform(new THREE.Color("#3a3f3b"));
    
    const eyeIntensity = uniform(6);
    const threshold = uniform(0.23);
    const eyeThreshold = uniform(0.25);
    const eyeDepthThreshold = uniform(1);

    const skullMaterial = new THREE.MeshBasicNodeMaterial();

    // 2. Optimized TSL Shader Logic
    const uvY = uv().y;
    const inverseUvY = oneMinus(uvY);
    
    const eyeMask = smoothstep(threshold, eyeThreshold, uvY);
    const gradient = smoothstep(0, 1, uvY).oneMinus(); 
    
    const baseSkull = mix(topColor, bottomColor, eyeMask);
    const emissiveGlow = topColor.mul(eyeIntensity).mul(oneMinus(eyeMask));

    const depthMask = smoothstep(0.1, eyeDepthThreshold, inverseUvY);
    
    // Explicitly cast '1.0' to vec3 cleanly without re-compilations
    const eyeGradient = mix(vec3(1.0), eyeDepthColor, depthMask); 
    
    const darkSkull = baseSkull.mul(eyeGradient).mul(gradient);
    skullMaterial.colorNode = darkSkull.add(emissiveGlow);

    return {
      material: skullMaterial,
      uniforms: { topColor, bottomColor, eyeDepthColor, eyeIntensity, threshold, eyeThreshold, eyeDepthThreshold }
    };
  }, []);

  // 3. Clean up material and WebGPU resources when component unmounts
  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  // 4. Hook up Leva Controls directly to WebGPU Uniform mutation pointers
  useControls("Skull", {
    topColor: {
      value: "#ff0000",
      onChange: (v) => { if(uniforms?.topColor) uniforms.topColor.value.set(v); },
    },
    eyeIntensity: {
      value: 6,
      min: 0,
      max: 20,
      step: 0.01,
      onChange: (v) => { if(uniforms?.eyeIntensity) uniforms.eyeIntensity.value = v; },
    },
    bottomColor: {
      value: "#bcb796",
      onChange: (v) => { if(uniforms?.bottomColor) uniforms.bottomColor.value.set(v); },
    },
    threshold: {
      value: 0.23,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => { if(uniforms?.threshold) uniforms.threshold.value = v; },
    },
    eyeThreshold: {
      value: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => { if(uniforms?.eyeThreshold) uniforms.eyeThreshold.value = v; },
    },
    eyeDepthColor: {
      value: "#3a3f3b",
      onChange: (v) => { if(uniforms?.eyeDepthColor) uniforms.eyeDepthColor.value.set(v); },
    },
    eyeDepthThreshold: {
      value: 1,
      min: -2,
      max: 2,
      step: 0.001,
      onChange: (v) => { if(uniforms?.eyeDepthThreshold) uniforms.eyeDepthThreshold.value = v; },
    },
  });

  return (
    <mesh
      geometry={nodes.Skull.geometry}
      material={material}
      position={[1.643, 0, 0]}
    />
  );
}
