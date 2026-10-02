import { useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function Lighting() {
  const directionalLightRef = useRef();

  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, "red");

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        ref={directionalLightRef}
        castShadow
        position={[1, 2, 3]}
        intensity={1}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={10}
        shadow-camera-top={5}
        shadow-camera-right={5}
        shadow-camera-bottom={-5}
        shadow-camera-left={-5}
      />
    </>
  );
}
