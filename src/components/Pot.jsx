import { useTexture } from "@react-three/drei";
import {
  atan,
  Fn,
  mix,
  rotate,
  step,
  texture,
  time,
  TWO_PI,
  uniform,
  uv,
  vec2,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { useMemo } from "react";
import { useControls } from "leva";

// ==========================================
// 1. Static Uniforms (Can safely live globally)
// ==========================================
export const potColorNode = uniform(new THREE.Color("#ffffff"));
export const potColor2Node = uniform(new THREE.Color("#ffffff"));
export const potColor3Node = uniform(new THREE.Color("#ffffff"));

// ==========================================
// 2. Pure Static TSL Shader Graph (Compiled ONCE)
// ==========================================
const getPotColorNode = Fn(([noiseTexNode]) => {
  // Radial Gradient
  const gradient = uv().distance(vec2(0.5)).pow(2).mul(3).oneMinus();

  // Radial
  const centerUv = uv().sub(0.5);
  const distanceToCenter = centerUv.length();
  const angle = atan(centerUv.y, centerUv.x);
  // const radial = angle.div(TWO_PI).add(0.5);

  // Noise UV math
  const noiseUv = rotate(
    centerUv,
    distanceToCenter.mul(3).add(time.mul(0.05)),
  ).mul(5);

  const noiseUv2 = rotate(
    centerUv.mul(1.5),
    distanceToCenter.mul(5).sub(time.mul(0.02)),
  ).mul(2);

  // Sample texture using the passed node
  const noise = texture(noiseTexNode, noiseUv).r;
  const noise2 = texture(noiseTexNode, noiseUv2).r.mul(2).oneMinus();

  // First Mix
  const mix1 = step(0.5, noise);
  mix1.addAssign(noise2);
  const color = mix(potColorNode, potColor2Node, mix1);

  // Second Mix
  const noise3 = texture(noiseTexNode, noiseUv2).r.mul(1.4).oneMinus();
  const mix2 = step(0.6, noise3);
  color.assign(mix(color, potColor3Node, mix2));

  return color.mul(gradient);
});

// ==========================================
// 3. Pot Component
// ==========================================
export function Pot({ nodes }) {
  // 1. Leva Controls (Correctly called inside the hook context)
  useControls("Witch-Pot Liquid", {
    potColor: {
      value: "#32e241",
      onChange: (v) => potColorNode.value.set(v),
    },
    potColor2: {
      value: "#35993e",
      onChange: (v) => potColor2Node.value.set(v),
    },
    potColor3: {
      value: "#cdf020",
      onChange: (v) => potColor3Node.value.set(v),
    },
  });

  // 2. Load texture
  const noiseTexture = useTexture("./Textures/noises.webp");

  // 3. Initialize material and assign TSL graph ONCE per component instance
  const localMaterial = useMemo(() => {
    noiseTexture.wrapS = THREE.RepeatWrapping;
    noiseTexture.wrapT = THREE.RepeatWrapping;

    const mat = new THREE.MeshBasicNodeMaterial();
    mat.colorNode = getPotColorNode(noiseTexture);
    return mat;
  }, [noiseTexture]);

  return (
    <mesh
      geometry={nodes["pot-emission"].geometry}
      material={localMaterial}
      position={[-4.573, 0.638, 0.94]}
    />
  );
}
