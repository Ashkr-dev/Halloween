import { useFrame, useThree } from "@react-three/fiber";
import { pass, uniform, select } from "three/tsl";
import * as THREE from "three/webgpu";
import { useMemo, useEffect, useRef } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { useControls } from "leva";

export default function PostProcessing() {
  const { scene, camera, gl: renderer } = useThree();

  // 1. Uniform allocations pinned to a reference to dodge Leva's mount race-condition
  const uniformsRef = useRef({
    enabled: uniform(1), // 1 = enabled, 0 = disabled
    threshold: uniform(0.03),
    strength: uniform(0.4),
    radius: uniform(0.4),
  });

  const uniforms = uniformsRef.current;

  // 2. Control system mapping
  useControls("PostProcessing", {
    bloomEnabled: {
      value: true,
      onChange: (v) => {
        uniforms.enabled.value = v ? 1 : 0;
      },
    },
    bloomThreshold: {
      value: 0.03,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Threshold",
      onChange: (v) => {
        uniforms.threshold.value = v;
      },
    },
    bloomStrength: {
      value: 0.4,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Strength",
      onChange: (v) => {
        uniforms.strength.value = v;
      },
    },
    bloomRadius: {
      value: 0.4,
      min: 0,
      max: 3,
      step: 0.1,
      label: "Radius",
      onChange: (v) => {
        uniforms.radius.value = v;
      },
    },
  });

  // 3. Construct the stable WebGPU processing architecture
  const renderPipeline = useMemo(() => {
    const pipeline = new THREE.RenderPipeline(renderer);
    
    // Core render pass containing your geometry and lighting
    const scenePass = pass(scene, camera);
    
    // Extract the raw color node output from your scene execution
    const sceneColor = scenePass.getTextureNode();

    // Compute the bloom layer node based on the scene colors
    const bloomLayer = bloom(
      sceneColor,
      uniforms.strength,
      uniforms.radius,
      uniforms.threshold
    );

    // Composite: Add bloom on top of the base scene color
    const bloomedScene = sceneColor.add(bloomLayer);

    // FIX: Conditionally select between the full composition or clean scene colors
    pipeline.outputNode = select(uniforms.enabled, bloomedScene, sceneColor);

    return pipeline;
  }, [scene, camera, renderer, uniforms]);

  // 4. Memory clean up cycle
  useEffect(() => {
    return () => {
      renderPipeline.dispose();
    };
  }, [renderPipeline]);

  // 5. Manual render execution control hook
  useFrame(() => {
    renderPipeline.render();
  }, 1);

  return null;
}
