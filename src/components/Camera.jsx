import { PerspectiveCamera } from "@react-three/drei";
import { useControls } from "leva";

export default function Camera() {
  const { cameraEnable, cameraPosition } = useControls("Camera", {
    cameraEnable: true,
    cameraPosition: { value: [0, 0, 0] },
  });

  return (
    <>
      {cameraEnable && (
        <PerspectiveCamera
        //   makeDefault
          fov={50}
          near={1}
          far={50}
          position={cameraPosition}
        />
      )}
    </>
  );
}
