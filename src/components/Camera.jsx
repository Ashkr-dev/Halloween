import { PerspectiveCamera } from "@react-three/drei";
import { useControls } from "leva";

export default function Camera() {
  const { cameraEnable, cameraPosition } = useControls("Camera", {
    cameraEnable: true,
    cameraPosition: { value: [0, 1.16, 8.43] },
  });

  return (
    <>
      {cameraEnable && (
        <PerspectiveCamera
          makeDefault
          fov={35}
          near={1}
          far={50}
          position={cameraPosition}
        />
      )}
    </>
  );
}
