import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { folder, useControls } from "leva";
import { useEffect, useMemo, useState } from "react";
import {
  Fn,
  mix,
  positionLocal,
  rotate,
  smoothstep,
  time,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import * as THREE from "three/webgpu";

export const wingTopColor = uniform(new THREE.Color("#ffffff"));
export const wingBottomColor = uniform(new THREE.Color("#ffffff"));
export const wingGradient = uniform(vec2(0.0, 0.0));
export const wingIntensity = uniform(0.0);
export const introProgress = uniform(0.0);

// Initialize with your default slider values directly
const levaWrapY = uniform(-1.1);
const levaWrapZ = uniform(0.18);
const levaBendPower = uniform(2.0);
const levaInitialY = uniform(0.364);
const levaInitialZ = uniform(0.175);
const levaFlapSpeed = uniform(4.0);
const levaFlapIntensity = uniform(0.15);

export const wingGradientNode = Fn(() => {
  const gradient = smoothstep(wingGradient.x, wingGradient.y, uv(0).y);
  return mix(wingTopColor, wingBottomColor, gradient);
});

export function Wings({ geometry }) {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => setAssetsLoaded(true);
    window.addEventListener("loading-complete", handleLoad);
    return () => window.removeEventListener("loading-complete", handleLoad);
  }, []);

  // FIXED: Accesses 'get' directly inside the scope block to avoid reading 'controls' early
  const [controls, setArgs] = useControls(() => {
    return {
      "Wing Rig": folder({
        wrapY: {
          value: -1.1,
          min: -10.0,
          max: 10.0,
          step: 0.001,
          label: "Wrap Forward (Y)",
          onChange: (v) => (levaWrapY.value = v),
        },
        wrapZ: {
          value: 0.18,
          min: -10.0,
          max: 10.0,
          step: 0.001,
          label: "Wrap Curl (Z)",
          onChange: (v) => (levaWrapZ.value = v),
        },
        bendPower: {
          value: 2.0,
          min: 1.0,
          max: 4.0,
          step: 0.1,
          label: "Bend Curvature",
          onChange: (v) => (levaBendPower.value = v),
        },
        initialY: {
          value: 0.364,
          min: -3.0,
          max: 3.0,
          step: 0.001,
          label: "Initial Rest (Y)",
          onChange: (v) => (levaInitialY.value = v),
        },
        initialZ: {
          value: 0.175,
          min: -3.0,
          max: 3.0,
          step: 0.001,
          label: "Initial Rest (Z)",
          onChange: (v) => (levaInitialZ.value = v),
        },
        flapSpeed: {
          value: 4.0,
          min: 0.0,
          max: 15.0,
          step: 0.1,
          label: "Flap Speed",
          onChange: (v) => (levaFlapSpeed.value = v),
        },
        flapIntensity: {
          value: 0.15,
          min: 0.0,
          max: 1.0,
          step: 0.02,
          label: "Flap Range",
          onChange: (v) => (levaFlapIntensity.value = v),
        },
        autoPlayIntro: { value: true, label: "Play Intro Animation" },
        manualProgress: {
          value: 0.0,
          min: 0.0,
          max: 1.0,
          step: 0.01,
          label: "Manual Intro Dev Slider",
          onChange: (v, path, context) => {
            // Natively reads the live context state toggle safely
            const isAutoPlay = context.get("Wing Rig.autoPlayIntro");
            if (!isAutoPlay) introProgress.value = v;
          },
        },
      }),
    };
  }, []); // Keeps the dependency array completely empty!

  const material = useMemo(() => {
    const mat = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
    });

    const sideSign = positionLocal.x.sign();
    const distanceFromCenter = positionLocal.x.abs();
    const bendFactor = distanceFromCenter.pow(levaBendPower);

    const wrapYNode = sideSign.mul(levaWrapY).mul(bendFactor);
    const wrapZNode = sideSign.mul(levaWrapZ).mul(bendFactor);
    const closedPose = vec3(0, wrapYNode, wrapZNode);

    const baseFlap = time.mul(levaFlapSpeed).sin().mul(levaFlapIntensity);

    const targetY = sideSign.mul(levaInitialY.add(baseFlap));
    const targetZ = sideSign.mul(levaInitialZ);
    const openPose = vec3(0, targetY, targetZ);

    const currentRotation = mix(closedPose, openPose, introProgress);
    mat.positionNode = rotate(positionLocal, currentRotation);

    mat.colorNode = wingGradientNode().mul(wingIntensity);
    return mat;
  }, []);


  useGSAP(() => {
    if (controls.autoPlayIntro && assetsLoaded) {
      introProgress.value = 0;

      // 3. OPTIMIZED: Removed onUpdate state triggers to let GSAP run cleanly on its thread
      gsap.to(introProgress, {
        value: 1.0,
        duration: 1.5,
        delay: 0.2,
        ease: "power4.in",
      });
    }
  }, [controls.autoPlayIntro, assetsLoaded]);

  useEffect(() => {
    return () => material.dispose();
  }, [material]);

  return (
    <mesh
      geometry={geometry}
      material={material}
      position={[0.003, 1.599, 0.032]}
    />
  );
}
