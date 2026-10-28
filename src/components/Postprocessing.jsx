import { useFrame, useThree } from "@react-three/fiber";
import { pass, uniform } from "three/tsl";
import * as THREE from "three/webgpu";
import { useMemo, useEffect } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { useControls } from "leva";

export default function PostProcessing() {
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

  // 1. Create uniform node references that hold state persistently
  const uniforms = useMemo(
    () => ({
      threshold: uniform(0.17),
      strength: uniform(0.5),
      radius: uniform(0.8),
    }),
    [],
  );

  // 2. Setup your permanent post-processing pipeline structures safely once
  const { renderPipeline, scenePass, bloomChain } = useMemo(() => {
    const renderPipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);

    // Build the bloom node calculation graph using our uniforms
    const glowNode = bloom(
      scenePass,
      uniforms.strength,
      uniforms.radius,
      uniforms.threshold,
    );
    const bloomChain = scenePass.add(glowNode);

    return { renderPipeline, scenePass, bloomChain };
  }, [scene, camera, renderer, uniforms]);

  // 3. Keep uniforms in sync with your reactive Leva sliders via useEffect
  useEffect(() => {
    uniforms.threshold.value = bloomThreshold;
    uniforms.strength.value = bloomStrength;
    uniforms.radius.value = bloomRadius;
  }, [bloomThreshold, bloomStrength, bloomRadius, uniforms]);

  // 4. Handle graph tree switching cleanly when the checkbox actually toggles
  useEffect(() => {
    renderPipeline.outputNode = bloomEnabled ? bloomChain : scenePass;

    // Explicitly notify the WebGPU node compiler system that the graph output root swapped
    if (renderer.backend && renderer.backend.updater) {
      renderer.backend.updater.updatePipeline(renderPipeline);
    }
  }, [bloomEnabled, renderPipeline, bloomChain, scenePass, renderer]);

  // 5. Lightweight render loop runner
  useFrame(() => {
    renderPipeline.render();
  }, 1); // Render priority 1 ensures it executes after the main scene graph completes updates

  return null;
}
