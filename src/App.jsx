import { OrbitControls } from "@react-three/drei";
import { Perf } from "r3f-webgpu-perf";
import Foliage from "./components/Foliage.jsx";
import { Model } from "./components/Model.jsx";
import PostProcessing from "./components/Postprocessing.jsx";
import { useControls } from "leva";

export default function App() {
  const { perfVisible } = useControls({
    perfVisible: true,
  });

  return (
    <>
      {perfVisible && <Perf position="top-left" showVRAM={true} />}
      <color args={["#000000"]} attach="background" />

      <OrbitControls />
      <Foliage />
      <Model />
      <PostProcessing />
    </>
  );
}
