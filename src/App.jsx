import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { Perf } from "r3f-webgpu-perf";
import { useRef } from "react";
import Camera from "./components/Camera.jsx";
import Foliage from "./components/Foliage.jsx";
import { Model } from "./components/Model.jsx";
import PostProcessing from "./components/Postprocessing.jsx";
import Sparkles from "./components/Sparkles.jsx";
import { useFrame } from "@react-three/fiber";

export default function App() {
  const controlsRef = useRef();

  // 1. Structural state triggers (Keep these as standard React boundaries)
  const [{ perfVisible, orbitControl }] = useControls(() => ({
    perfVisible: true,
    orbitControl: true,
  }));

  // 2. Custom state triggers
  const { targetX, targetY, targetZ } = useControls("OrbitControls", {
    targetX: { value: 0 },
    targetY: { value: 1.42 },
    targetZ: { value: -16 },
  });

  return (
    <>
      {perfVisible && <Perf position="top-left" showVRAM={true} />}
      <color args={["#000000"]} attach="background" />

      {orbitControl && (
        <OrbitControls
          ref={controlsRef}
          target={[targetX, targetY, targetZ]} // R3F handles the update automatically here
          enableDamping
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.5}
          minDistance={3}
          maxDistance={20}
        />
      )}

      {/* <Camera /> */}
      <Sparkles />
      <Foliage />
      <Model />
      <PostProcessing />
    </>
  );
}
