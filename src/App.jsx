import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { Perf } from "r3f-webgpu-perf";
import { useRef } from "react";
import Camera from "./components/Camera.jsx";
import Foliage from "./components/Foliage.jsx";
import { Model } from "./components/Model.jsx";
import PostProcessing from "./components/Postprocessing.jsx";
import Sparkles from "./components/Sparkles.jsx";

export default function App() {
  const controlsRef = useRef();

  // 1. Structural state triggers (Keep these as standard React boundaries)
  const [{ perfVisible, orbitControl }] = useControls(() => ({
    perfVisible: true,
    orbitControl: true,
  }));

  // 2. High-frequency slider inputs handled safely via target updates
  useControls("OrbitControls", {
    target: {
      value:[0, 0, 0],
      onChange: (v) => {
        if (controlsRef.current) {
          controlsRef.current.target.set(v[0], v[1], v[2]);
          controlsRef.current.update();
        }
      },
    },
  });

  return (
    <>
      {perfVisible && <Perf position="top-left" showVRAM={true} />}
      <color args={["#000000"]} attach="background" />

      {orbitControl && (
        <OrbitControls
          ref={controlsRef}
          enableDamping
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={3}
          maxDistance={20}
        />
      )}

      <Camera />
      <Sparkles />
      <Foliage />
      <Model />
      <PostProcessing />
    </>
  );
}
