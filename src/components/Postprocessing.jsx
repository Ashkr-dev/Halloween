import { useFrame, useThree } from "@react-three/fiber";
import { pass, uniform } from "three/tsl"; // 1. Added uniform import
import * as THREE from "three/webgpu";
import { useMemo, useEffect } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { useControls } from "leva";


export default function PostProcessing() {
  console.log(useControls)
  const { bloomEnabled, bloomThreshold, bloomStrength, bloomRadius } =
    useControls("PostProcessing", {
      bloomEnabled: true,
      bloomThreshold: {
        value: 0.25,
        min: 0,
        max: 1,
        step: 0.01,
        label: "Threshold",
      },
      bloomStrength: {
        value: 0.2,
        min: 0,
        max: 5,
        step: 0.1,
        label: "Strength",
      },
      bloomRadius: { value: 0.7, min: 0, max: 3, step: 0.1, label: "Radius" },
    });

  const { scene, camera, gl: renderer } = useThree();

  // 2. Create uniform node references that hold their state persistently
  const uniforms = useMemo(
    () => ({
      threshold: uniform(0.25),
      strength: uniform(0.2),
      radius: uniform(0.7),
    }),
    [],
  );

  // 3. Keep uniforms in sync with your reactive Leva sliders
  uniforms.threshold.value = bloomThreshold;
  uniforms.strength.value = bloomStrength;
  uniforms.radius.value = bloomRadius;

  // 4. Set up your permanent pipeline structures
  const { renderPipeline, scenePass, bloomPass } = useMemo(() => {
    const renderPipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);

    // Inject the uniform nodes directly into the bloom node creation
    const glow = bloom(
      scenePass,
      uniforms.strength,
      uniforms.radius,
      uniforms.threshold,
    );
    const sceneBloom = scenePass.add(glow);

    renderPipeline.outputNode = sceneBloom;

    return { renderPipeline, scenePass, bloomPass: sceneBloom };
  }, [scene, camera, renderer, uniforms]);

  // 5. Only handle graph tree switching when the checkbox actually toggles
  useEffect(() => {
    renderPipeline.outputNode = bloomEnabled ? bloomPass : scenePass;
    renderPipeline.needsUpdate = true; // Only recompile shader when turning ON/OFF
  }, [bloomEnabled, renderPipeline, bloomPass, scenePass]);

  // 6. Super lightweight render loop
  useFrame(() => {
    renderPipeline.render();
  }, 1);

  return null;
}
