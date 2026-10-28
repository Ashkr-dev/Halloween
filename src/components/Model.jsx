import { useGLTF, useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import { add, mul, texture, uniform, uv, vec4 } from "three/tsl";
import * as THREE from "three/webgpu";
import useFireMaterial from "./Fire.jsx";
import { Lanterns, lanternColor, lanternIntensity } from "./Lanterns.jsx";
import { Wings, wingGradientNode, wingIntensity } from "./Wings.jsx";

// ==========================================
// 1. Static Global Environment Uniforms
// ==========================================
const moonColor = uniform(new THREE.Color("#285081"));
const moonIntensity = uniform(6.0);

// ==========================================
// 2. Static Material & Node Composition Graphs
// ==========================================
const globalMaterial = new THREE.MeshBasicNodeMaterial();
const statueMaterial = new THREE.MeshBasicNodeMaterial({
  side: THREE.DoubleSide,
});

const buildGlobalShaderNode = (colorMap, lightMap) => {
  const colorSample = texture(colorMap, uv(0));
  const lightSample = texture(lightMap, uv(0));

  const redLayer = mul(lightSample.r, mul(moonIntensity, moonColor));

  // Dynamically factors the imported lantern variables into the environmental light bounce
  const greenLayer = mul(lightSample.g, mul(lanternIntensity, lanternColor));

  // Dynamically factors the imported wing color graph into the environmental light bounce
  const blueLayer = mul(lightSample.b, mul(wingIntensity, wingGradientNode()));

  const totalLighting = add(redLayer, add(greenLayer, blueLayer));
  return vec4(mul(colorSample.rgb, totalLighting), 1.0);
};

// ==========================================
// 3. Main Scene Model Component
// ==========================================
export function Model(props) {
  const fireMaterial = useFireMaterial();

  const colorMap = useTexture("/Textures/colorMap.webp");
  colorMap.flipY = false;
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const lightMap = useTexture("/Textures/lightMap.webp");
  lightMap.flipY = false;
  lightMap.colorSpace = THREE.NoColorSpace;

  // Safely assign global color graphs without frame rebuilding
  const globalColorNode = buildGlobalShaderNode(colorMap, lightMap);
  globalMaterial.colorNode = globalColorNode;
  statueMaterial.colorNode = globalColorNode;

  // Central Control Interface Panel
  const controls = useControls("Graveyard Lighting", {
    moonColor: "#285081",
    moonIntensity: { value: 6.0, min: 0, max: 10, step: 0.1 },

    // Lantern settings passed down to <Lanterns />
    lanternColor: "#30f6ff",
    lanternIntensity: { value: 1.5, min: 0, max: 10, step: 0.1 },

    // Wing settings passed down to <Wings />
    wingTopColor: "#6a32e2",
    wingBottomColor: "#e17cff",
    wingIntensity: { value: 4.9, min: 0, max: 10, step: 0.1 },
    wingGradient: { value: [0.0, 1.0], min: 0, max: 1, step: 0.001 },
  });

  useFrame(() => {
    moonColor.value.set(controls.moonColor);
    moonIntensity.value = controls.moonIntensity;
  });

  const { nodes } = useGLTF("/baked.glb");

  return (
    <group {...props} dispose={null}>
      {/* Structural Elements using Global Lightmaps */}
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

      {/* Emissive Fire Element */}
      <mesh
        geometry={nodes.fire.geometry}
        material={fireMaterial}
        position={[-4.573, 0.308, 0.94]}
      />

      {/* Extracted Sub-Components */}
      <Lanterns nodes={nodes} controls={controls} />
      <Wings geometry={nodes.wings.geometry} controls={controls} />
    </group>
  );
}

useGLTF.preload("/baked.glb");
useTexture.preload("/Textures/colorMap.webp");
useTexture.preload("/Textures/lightMap.webp");
