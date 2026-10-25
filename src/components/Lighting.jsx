import { useHelper } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

export default function Lighting() {
  const directionalLightRef = useRef();

  useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, "red");

  return (
    <>
      <ambientLight intensity={1.0} />
      <directionalLight
        ref={directionalLightRef}
        color={"#72B1FF"}
        castShadow
        position={[-8, 8, -10]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
      
      
      />


    </>
  );
}
