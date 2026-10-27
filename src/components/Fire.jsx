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

export default function useFireMaterial() {
  const perlinNoise = useTexture("./Textures/noises.webp");

  useEffect(() => {
    if (perlinNoise) {
      perlinNoise.wrapS = THREE.RepeatWrapping;
      perlinNoise.wrapT = THREE.RepeatWrapping;
      perlinNoise.needsUpdate = true;
    }
  }, [perlinNoise]);

  const uniforms = useMemo(
    () => ({
      uFireColor: uniform(new THREE.Color("#ff8300")),
      uSecColor: uniform(new THREE.Color("#ffc7a7")),
      uTipColor: uniform(new THREE.Color("#ffb2b2")),
      uFireUvScale: uniform(vec2(4.39, 0.3)),
      uFireIntensity: uniform(1.5),
    }),
    [],
  );

  // OPTIMIZATION: Update uniforms REACTIVELY via Leva callbacks, freeing up the CPU loop completely!
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
      value: 4.39,
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
  });

  // The useFrame hook is now completely removed because TSL handles the 'time' node autonomously on the GPU!

  const fireMaterial = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      depthWrite: false, // Turn this back on if fire renders behind things incorrectly!
    });

    material.colorNode = Fn(() => {
      const baseColor = mix(
        mix(uniforms.uSecColor, uniforms.uFireColor, smoothstep(1, 0, uv().y)),
        uniforms.uTipColor,
        smoothstep(0.7, 0.1, uv().y),
      );
      return baseColor.mul(uniforms.uFireIntensity);
    })();

    material.opacityNode = Fn(() => {
      const fireUv = uv()
        .mul(uniforms.uFireUvScale)
        .add(vec2(0, time.mul(0.5)))
        .toVar();

      const distortion = sin(fireUv.y.mul(10)).mul(0.05);
      fireUv.x.addAssign(distortion);

      const noiseCoords = vec2(fireUv.x, fireUv.y);
      const fireNoise = texture(perlinNoise, noiseCoords).r;

      const edgeFade = min(uv().y.pow(3), uv().y.oneMinus().mul(10));

      return mul(fireNoise, edgeFade).clamp(0, 1);
    })();

    return material;
  }, [uniforms, perlinNoise]);

  useEffect(() => {
    return () => {
      fireMaterial.dispose();
    };
  }, [fireMaterial]);

  return fireMaterial;
}

useTexture.preload("./Textures/noises.webp");
