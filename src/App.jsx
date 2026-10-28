import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { Perf } from "r3f-webgpu-perf";
import Camera from "./components/Camera.jsx";
import Foliage from "./components/Foliage.jsx";
import { Model } from "./components/Model.jsx";
import PostProcessing from "./components/Postprocessing.jsx";
import Sparkles from "./components/Sparkles.jsx";

export default function App() {
  const { perfVisible } = useControls({
    perfVisible: true,
  });

  const { orbitControl, target } = useControls("OrbitControls", {
    orbitControl: true,
    target: { value: [0, 0, 0] },
  });

  return (
    <>
      {perfVisible && <Perf position="top-left" showVRAM={true} />}
      <color args={["#000000"]} attach="background" />

      {orbitControl && (
        <OrbitControls
          enableDamping
          minPolarAngle={0}
          maxPolarAngle={Math.PI * 0.49}
          minDistance={5}
          maxDistance={20}
          target={target}
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
