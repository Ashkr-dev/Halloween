import { Canvas, extend } from "@react-three/fiber";
import { Leva } from "leva";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import * as THREE from "three/webgpu";
import App from "./App.jsx";
import "./index.css";

extend(THREE);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Leva collapsed />
    <Canvas
      // shadows
      gl={async (canvasTarget) => {
        // ⬇️ Extract the real HTML canvas element from the R3F target wrapper object
        const domCanvas = canvasTarget.canvas;

        // Pass the actual canvas DOM element into the WebGPURenderer options
        const renderer = new THREE.WebGPURenderer({
          canvas: domCanvas,
          antialias: true,
        });

        // // ─── APPLY PCF SHADOW MAP CONFIGURATION HERE ───
        // renderer.shadowMap.enabled = true;
        // renderer.shadowMap.type = THREE.PCFShadowMap;

        // ─── APPLY ACES FILMIC TONE MAPPING HERE ───
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        // Optional: Adjust exposure if the scene appears too dark/contrasted
        renderer.toneMappingExposure = 1;

        await renderer.init();
        return renderer;
      }}

     
      // camera={{
      //   fov: 35,
      //   near: 0.1,
      //   far: 200,
      //   position: [1, 1.5, 3],
      // }}
    >
      <App />
    </Canvas>
  </StrictMode>,
);
