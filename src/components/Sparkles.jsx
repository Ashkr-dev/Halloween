import { useControls } from "leva";
import {
    color,
    hash,
    instanceIndex,
    range,
    sin,
    time,
    uv,
    vec2,
    vec3
} from "three/tsl";
import { SpriteNodeMaterial } from "three/webgpu";

export default function Sparkles() {
  // Sparkles Controls
  const controls = useControls("Sparkles", {
    sparklesEnabled: true,
    count: { value: 65, min: 0, max: 100, step: 1 },
    minSize: { value: 0.02, min: 0, max: 1, step: 0.01 },
    maxSize: { value: 0.05, min: 0, max: 1, step: 0.01 },
    color: "#42bff9",
  });

  // Sparkles Material
  const material = new SpriteNodeMaterial();

  const basePosition = range(vec3(-10, 0, -10), vec3(10, 2.5, 10));
  const uniqueSeed = hash(instanceIndex);

  // Creates a chaotic, floating wave movement
  const movement = sin(time.mul(uniqueSeed).add(uniqueSeed)).mul(0.5);

  material.positionNode = basePosition.add(movement);

  material.scaleNode = range(vec2(controls.minSize), vec2(controls.maxSize));

  material.rotationNode = time.mul(hash(instanceIndex).sub(0.5));

  material.opacityNode = uv().distance(0.5).mul(2).oneMinus();

  material.colorNode = color(controls.color);

  return (
    <>
      {controls.sparklesEnabled && (
        <sprite material={material} count={controls.count} />
      )}
    </>
  );
}
