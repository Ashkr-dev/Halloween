import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { useMemo } from "react";
import {
  Fn,
  min,
  mix,
  mul,
  mx_noise_float,
  sin,
  smoothstep,
  time,
  uniform,
  uv,
  vec2
} from "three/tsl";
import * as THREE from "three/webgpu";

// Custom hook to create and update the fire material efficiently
export default function useFireMaterial() {
  const perlinNoise = useTexture("./Textures/noises.webp");
  perlinNoise.wrapS = THREE.RepeatWrapping;
  perlinNoise.wrapT = THREE.RepeatWrapping;

  // 1. Setup Uniforms so color changes don't trigger shader recompiles
  const uFireColor = useMemo(() => uniform(new THREE.Color("#ff8300")), []);
  const uSecColor = useMemo(() => uniform(new THREE.Color("#ffc7a7")), []);
  const uTipColor = useMemo(() => uniform(new THREE.Color("#ffffff")), []);

  // 2. Create the Leva controls panel
  const controls = useControls("Witch-Pot Fire", {
    fireColor: "#ff8300",
    secColor: "#ffc7a7",
    tipColor: "#ffffff",
    fireIntensity: { value: 1.5, min: 0, max: 10, step: 0.1 },
  });

  // 3. Update uniform values safely on every frame loop without rebuilding materials
  useFrame(() => {
    uFireColor.value.set(controls.fireColor);
    uSecColor.value.set(controls.secColor);
    uTipColor.value.set(controls.tipColor);
  });

  // 4. Cache the material so it is created EXACTLY once
  const fireMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
    });

    // Fire Color Shader Node Graph
    material.colorNode = Fn(() => {
      return mix(
        mix(uFireColor, uSecColor, smoothstep(0, 0.1, uv().y)),
        uTipColor,
        smoothstep(0.9, 1, uv().y),
      );
    })();

    // Fire Opacity/Shader Node Graph
    material.opacityNode = Fn(() => {
      const fireUv = uv()
        .mul(vec2(13, 0.15))
        .add(vec2(0, time.mul(0.5)))
        .toVar();

      const distortion = sin(fireUv.y.mul(10)).mul(0.05);
      fireUv.x.addAssign(distortion);

      const noiseCoords = vec2(fireUv.x, fireUv.y);
      const fireNoise = mx_noise_float(noiseCoords);

      const edgeFade = min(
        uv().y.pow(3), // Top
        uv().y.oneMinus().mul(10), // Bottom
      );

      return mul(fireNoise, edgeFade).clamp(0, 1);
    })();

    return material;
  }, [uFireColor, uSecColor, uTipColor]);

  return fireMaterial;
}

// Preload the noise asset texture at the file root level
useTexture.preload("./Textures/noises.webp");
