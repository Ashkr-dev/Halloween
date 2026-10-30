import { useTexture } from "@react-three/drei";
import { useControls } from "leva";
import { useEffect, useMemo } from "react";
import {
  Fn,
  min,
  mix,
  mul,
  sin,
  smoothstep,
  texture,
  time,
  uniform,
  uv,
  vec2,
} from "three/tsl";
import * as THREE from "three/webgpu";

// ==========================================
// 1. Pure Static TSL Graphs (Compiled Exactly ONCE)
// ==========================================
const getFireColorNode = Fn(
  ([uSecColor, uFireColor, uTipColor, uFireIntensity]) => {
    const baseColor = mix(
      mix(uSecColor, uFireColor, smoothstep(1, 0, uv().y)),
      uTipColor,
      smoothstep(0.7, 0.1, uv().y),
    );
    return baseColor.mul(uFireIntensity);
  },
);

const getFireOpacityNode = Fn(([noiseTexNode, uFireUvScale, uFireSpeed]) => {
  const fireUv = uv()
    .mul(uFireUvScale)
    .add(vec2(0, time.mul(uFireSpeed)))
    .toVar();

  const distortion = sin(fireUv.y.mul(10)).mul(0.05);
  fireUv.x.addAssign(distortion);

  const noiseCoords = vec2(fireUv.x, fireUv.y);
  const fireNoise = texture(noiseTexNode, noiseCoords).r;
  fireNoise.assign(smoothstep(0.4, 1, fireNoise));

  const edgeFade = min(smoothstep(0.1, 1, uv().y), smoothstep(1, 0.8, uv().y));

  return mul(fireNoise, edgeFade).clamp(0, 1);
});

// ==========================================
// 2. Optimized Custom Hook
// ==========================================
export default function useFireMaterial() {
  const perlinNoise = useTexture("./Textures/noises.webp");

  // Keep uniforms persistent per-hook instance
  const uniforms = useMemo(
    () => ({
      uFireColor: uniform(new THREE.Color("#ffffff")),
      uSecColor: uniform(new THREE.Color("#ffffff")),
      uTipColor: uniform(new THREE.Color("#ffffff")),
      uFireUvScale: uniform(vec2(0, 0)),
      uFireIntensity: uniform(0),
      uFireSpeed: uniform(0),
    }),
    [],
  );

  // Update uniforms REACTIVELY via Leva callbacks bypassing state
  useControls("Witch-Pot Fire", {
    fireColor: {
      value: "#ff8300",
      onChange: (v) => uniforms.uFireColor.value.set(v),
    },
    secColor: {
      value: "#ffc7a7",
      onChange: (v) => uniforms.uSecColor.value.set(v),
    },
    tipColor: {
      value: "#ffb2b2",
      onChange: (v) => uniforms.uTipColor.value.set(v),
    },
    fireIntensity: {
      value: 1.5,
      min: 0,
      max: 10,
      step: 0.1,
      onChange: (v) => (uniforms.uFireIntensity.value = v),
    },
    fireUvX: {
      value: 4,
      min: 0,
      max: 20,
      step: 0.001,
      onChange: (v) => (uniforms.uFireUvScale.value.x = v),
    },
    fireUvY: {
      value: 0.3,
      min: 0,
      max: 20,
      step: 0.001,
      onChange: (v) => (uniforms.uFireUvScale.value.y = v),
    },
    fireSpeed: {
      value: 0.3,
      min: 0,
      max: 10,
      step: 0.001,
      onChange: (v) => (uniforms.uFireSpeed.value = v),
    },
  });

  // Material setup only builds bindings once on texture target load
  const fireMaterial = useMemo(() => {
    if (perlinNoise) {
      perlinNoise.wrapS = THREE.RepeatWrapping;
      perlinNoise.wrapT = THREE.RepeatWrapping;
      // REMOVED: perlinNoise.needsUpdate = true (unnecessary CPU data upload loop)
    }

    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false,
    });

    const activeNoiseTex = perlinNoise || new THREE.Texture();

    // Map the structures directly while injecting structural parameters safely
    material.colorNode = getFireColorNode(
      uniforms.uSecColor,
      uniforms.uFireColor,
      uniforms.uTipColor,
      uniforms.uFireIntensity,
    );

    material.opacityNode = getFireOpacityNode(
      activeNoiseTex,
      uniforms.uFireUvScale,
      uniforms.uFireSpeed,
    );

    return material;
  }, [uniforms, perlinNoise]);

  // Clean memory management safely on unmount
  useEffect(() => {
    return () => {
      fireMaterial.dispose();
    };
  }, [fireMaterial]);

  return fireMaterial;
}

useTexture.preload("./Textures/noises.webp");
