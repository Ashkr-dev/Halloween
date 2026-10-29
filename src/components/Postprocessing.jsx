import { useFrame, useThree } from "@react-three/fiber";
import { pass, uniform } from "three/tsl";
import * as THREE from "three/webgpu";
import { useMemo, useEffect, useState } from "react";
import { bloom } from "three/examples/jsm/tsl/display/BloomNode.js";
import { useControls } from "leva";

export default function PostProcessing() {
  const { scene, camera, gl: renderer } = useThree();
  
  // Track toggle states at the React layer so we structurally update the pipeline safely
  const [enabled, setEnabled] = useState(true);

  // 1. Uniform node references for the sliders
  const uniforms = useMemo(
    () => ({
      threshold: uniform(0.25),
      strength: uniform(0.2),
      radius: uniform(0.7),
    }),
    [],
  );

  // 2. Drive uniform properties via change events
  useControls("PostProcessing", {
    bloomEnabled: {
      value: true,
      onChange: (v) => setEnabled(v), // Safe React state flip
    },
    bloomThreshold: {
      value: 0.25,
      min: 0,
      max: 1,
      step: 0.01,
      label: "Threshold",
      onChange: (v) => (uniforms.threshold.value = v),
    },
    bloomStrength: {
      value: 0.2,
      min: 0,
      max: 5,
      step: 0.1,
      label: "Strength",
      onChange: (v) => (uniforms.strength.value = v),
    },
    bloomRadius: { 
      value: 0.7, 
      min: 0, 
      max: 3, 
      step: 0.1, 
      label: "Radius",
      onChange: (v) => (uniforms.radius.value = v),
    },
  });

  // 3. Construct the independent nodes safely
  const { renderPipeline, scenePass, bloomChain } = useMemo(() => {
    const pipeline = new THREE.RenderPipeline(renderer);
    const scenePass = pass(scene, camera);

    // Dynamic node evaluation graph
    const glowNode = bloom(
      scenePass,
      uniforms.strength,
      uniforms.radius,
      uniforms.threshold,
    );
    const bloomChain = scenePass.add(glowNode);

    return { renderPipeline: pipeline, scenePass, bloomChain };
  }, [scene, camera, renderer, uniforms]);

  // 4. Safely redirect the graph root pointer depending on the state variable
  useEffect(() => {
    renderPipeline.outputNode = enabled ? bloomChain : scenePass;
    // CRITICAL FIX: Simply let the renderer know the node needs a compilation review, 
    // without invoking the dangerous hardware-level reset.
    renderPipeline.needsUpdate = true; 
  }, [enabled, renderPipeline, bloomChain, scenePass]);

  // Clean memory structures
  useEffect(() => {
    return () => {
      renderPipeline.dispose();
    };
  }, [renderPipeline]);

  // 5. Lightweight render loop runner
  useFrame(() => {
    renderPipeline.render();
  }, 1);

  return null;
}
