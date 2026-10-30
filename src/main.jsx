import { Canvas, extend } from "@react-three/fiber";
import { Leva } from "leva";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three/webgpu";
import App from "./App.jsx";
import "./index.css";
import { LoadingScreen } from "./LoadingScreen/LoadingScreen.jsx";

extend(THREE);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Leva collapsed />
    <LoadingScreen />
    <Canvas
      gl={async (canvasTarget) => {
        // Extract the real HTML canvas element from the R3F target wrapper object
        const domCanvas = canvasTarget.canvas;

        // Pass the actual canvas DOM element into the WebGPURenderer options
        const renderer = new THREE.WebGPURenderer({
          canvas: domCanvas,
          antialias: true,
        });

        // ─── APPLY ACES FILMIC TONE MAPPING HERE ───
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1;

        await renderer.init();
        return renderer;
      }}
    >
      <App />
    </Canvas>
  </StrictMode>,
);
