import React, { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";
import "./LoadingScreen.css";

export function LoadingScreen() {
  const { active, progress } = useProgress();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Inside your LoadingScreen.jsx useEffect:
    if (!active && progress === 100) {
      const timeout = setTimeout(() => {
        setVisible(false);
        // Notify WebGPU assets that they can now play intros!
        window.dispatchEvent(new Event("loading-complete"));
      }, 800);
      return () => clearTimeout(timeout);
    }
  }, [active, progress]);

  if (!visible) return null;

  return (
    <div className={`spooky-loader-overlay ${!active ? "fade-out" : ""}`}>
      <div className="spooky-loader-content">
        {/* Halloween Title */}
        <h1 className="spooky-title">SUMMONING THE SCENE...</h1>

        {/* Progress bar track */}
        <div className="spooky-bar-track">
          {/* Glowing orange fill bar */}
          <div className="spooky-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Loading percentage text */}
        <span className="spooky-percentage">
          {Math.round(progress)}% Loaded
        </span>
      </div>
    </div>
  );
}
