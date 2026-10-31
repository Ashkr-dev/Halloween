import { useGLTF, useTexture } from "@react-three/drei";
import { useControls } from "leva";
import { useMemo, useEffect } from "react";
import { add, mul, texture, uniform, uv, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";
import { Fn } from "three/tsl";
import useFireMaterial from "./Fire.jsx";
import { Lanterns, lanternColor, lanternIntensity } from "./Lanterns.jsx";
import { Pot, potColorNode } from "./Pot.jsx";
import { Smoke } from "./Smoke.jsx";
import {
  Wings,
  wingGradientNode,
  wingIntensity,
  wingTopColor,
  wingBottomColor,
  wingGradient,
} from "./Wings.jsx";
import Skull from "./Skull.jsx";

// ==========================================
// 1. Static Global Environment Uniforms
// ==========================================
const moonColor = uniform(new THREE.Color("#ffffff"));
const moonIntensity = uniform(0);

// ==========================================
// 2. Pure Static TSL Composition Graph (Compiled ONCE)
// ==========================================
const buildGlobalShaderNode = Fn(([colorMap, lightMap]) => {
  const colorSample = texture(colorMap, uv(0));
  const lightSample = texture(lightMap, uv(0));

  // Red Channel: Moon
  const redLayer = mul(lightSample.r, mul(moonIntensity, moonColor));

  // Green Channel: Lanterns
  const greenLayer = mul(lightSample.g, mul(lanternIntensity, lanternColor));

  // Blue Channel: Dynamic Wing Light Scattering!
  const blueLayer = mul(lightSample.b, mul(wingIntensity, wingGradientNode()));

  const totalLighting = add(redLayer, add(greenLayer, blueLayer));
  return vec4(mul(colorSample.rgb, totalLighting), 1.0);
});

// ==========================================
// 3. Main Scene Model Component
// ==========================================
export function Model(props) {
  const fireMaterial = useFireMaterial();
  const { nodes } = useGLTF("/baked.glb");

  const colorMap = useTexture("/Textures/colorMap.webp");
  const lightMap = useTexture("/Textures/lightMap.webp");

  // Reactively drive ALL global uniforms out of the useFrame loop!
  useControls("Graveyard Lighting", {
    moonColor: {
      value: "#285081",
      onChange: (v) => moonColor.value.set(v),
    },
    moonIntensity: {
      value: 6.0,
      min: 0,
      max: 10,
      step: 0.1,
      onChange: (v) => (moonIntensity.value = v),
    },
    potColor: {
      value: "#32e241",
      onChange: (v) => potColorNode.value.set(v),
    },
    lanternColor: {
      value: "#30f6ff",
      onChange: (v) => lanternColor.value.set(v),
    },
    lanternIntensity: {
      value: 1.5,
      min: 0,
      max: 10,
      step: 0.1,
      onChange: (v) => (lanternIntensity.value = v),
    },
    wingTopColor: {
      value: "#6a32e2",
      onChange: (v) => wingTopColor.value.set(v),
    },
    wingBottomColor: {
      value: "#e17cff",
      onChange: (v) => wingBottomColor.value.set(v),
    },
    wingIntensity: {
      value: 4.9,
      min: 0,
      max: 10,
      step: 0.1,
      onChange: (v) => (wingIntensity.value = v),
    },
    wingGradient: {
      value: [0.0, 1.0],
      min: 0,
      max: 1,
      step: 0.001,
      onChange: (v) => wingGradient.value.set(v[0], v[1]),
    },
  });

  // Safely bundle materials per component lifecycle mount
  const { globalMaterial, statueMaterial } = useMemo(() => {
    colorMap.flipY = false;
    colorMap.colorSpace = THREE.SRGBColorSpace;
    lightMap.flipY = false;
    lightMap.colorSpace = THREE.NoColorSpace;

    const gMat = new THREE.MeshBasicNodeMaterial();
    const sMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide });

    // Assign the compiled static node graph structure
    const compiledNode = buildGlobalShaderNode(colorMap, lightMap);
    gMat.colorNode = compiledNode;
    sMat.colorNode = compiledNode;

    return { globalMaterial: gMat, statueMaterial: sMat };
  }, [colorMap, lightMap]);

  useEffect(() => {
    return () => {
      globalMaterial.dispose();
      statueMaterial.dispose();
    };
  }, [globalMaterial, statueMaterial]);

  return (
    <group {...props} dispose={null}>
      <mesh
        geometry={nodes.Baked.geometry}
        material={globalMaterial}
        position={[1.643, 0, 0]}
      />
      <mesh
        geometry={nodes["outer-cloth"].geometry}
        material={statueMaterial}
        position={[0.003, 0.67, 0.138]}
      />

      <Pot nodes={nodes} />
      <Smoke nodes={nodes} />
      <Skull nodes={nodes} />

      <mesh
        geometry={nodes.fire.geometry}
        material={fireMaterial}
        position={[-4.573, 0.308, 0.94]}
      />

      <Lanterns nodes={nodes} />
      <Wings geometry={nodes.wings.geometry} />
    </group>
  );
}

useGLTF.preload("/baked.glb");
useTexture.preload("/Textures/colorMap.webp");
useTexture.preload("/Textures/lightMap.webp");
