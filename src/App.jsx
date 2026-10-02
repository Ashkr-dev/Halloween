import { OrbitControls } from "@react-three/drei";
import PostProcessing from "./components/Postprocessing.jsx";
import Lighting from "./components/Lighting.jsx";
import { Perf } from "r3f-webgpu-perf";

export default function App() {
  return (
    <>
      <Perf position="top-left" showVRAM={true} />
      <OrbitControls />

      <Lighting />

      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshNormalMaterial />
      </mesh>

      {/* <PostProcessing /> */}
    </>
  );
}
