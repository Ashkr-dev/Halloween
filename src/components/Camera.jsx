import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useControls } from "leva";

export default function Camera() {
  const { size } = useThree(); 

  const { cameraEnable, cameraPosition } = useControls("Camera", {
    cameraEnable: true,
    cameraPosition: { value: [0, 1.16, 8] },
  });

  const isMobile = size.width < 768;

  // Determine configuration purely based on layout state
  const fov = isMobile ? 50 : 40;
  
  // Safe position fallback extraction
  const desktopPosition = [
    cameraPosition.x ?? cameraPosition[0] ?? 0,
    cameraPosition.y ?? cameraPosition[1] ?? 1.16,
    cameraPosition.z ?? cameraPosition[2] ?? 8,
  ];
  
  const finalPosition = isMobile ? [0, 1.2, 8] : desktopPosition;

  return (
    <>
      {cameraEnable && (
        <PerspectiveCamera
          makeDefault
          fov={fov}
          position={finalPosition}
          near={1}
          far={50}
          // Note: If you need it to constantly lookAt, 
          // ensure your controls or parent elements aren't overriding it.
          onUpdate={(self) => self.lookAt(0, 0, 0)}
        />
      )}
    </>
  );
}
