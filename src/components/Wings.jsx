import { useEffect, useMemo } from "react";
import {
  Fn,
  mix,
  positionLocal,
  rotate,
  smoothstep,
  uniform,
  uv,
  vec2,
  vec3,
  time,
} from "three/tsl";
import * as THREE from "three/webgpu";
import { useFrame } from "@react-three/fiber";
import { useControls } from "leva";
import gsap from "gsap";
import { useGSAP } from "@gsap/react"; // 1. Import the official hook

// ==========================================
// CENTRAL EXPORTS
// ==========================================
export const wingTopColor = uniform(new THREE.Color("#6a32e2"));
export const wingBottomColor = uniform(new THREE.Color("#e17cff"));
export const wingGradient = uniform(vec2(0.0, 1.0));
export const wingIntensity = uniform(4.9);
export const introProgress = uniform(0.0);

const levaWrapY = uniform(0);
const levaWrapZ = uniform(0);
const levaBendPower = uniform(0);
const levaInitialY = uniform(0); 
const levaInitialZ = uniform(0); 
const levaFlapSpeed = uniform(0);
const levaFlapIntensity = uniform(0);

export const wingGradientNode = Fn(() => {
  const gradient = smoothstep(wingGradient.x, wingGradient.y, uv(0).y);
  return mix(wingTopColor, wingBottomColor, gradient);
});

// ==========================================
// Wings Component
// ==========================================
export function Wings({ geometry }) {
  const controls = useControls("Wing Rig", {
    wrapY: { value: -1.1, min: -10.0, max: 10.0, step: 0.001, label: "Wrap Forward (Y)" },
    wrapZ: { value: 0.18, min: -10.0, max: 10.0, step: 0.001, label: "Wrap Curl (Z)" },
    bendPower: { value: 2.0, min: 1.0, max: 4.0, step: 0.1, label: "Bend Curvature" },

    initialY: { value: 0.364, min: -3.0, max: 3.0, step: 0.001, label: "Initial Rest (Y)" },
    initialZ: { value: 0.175, min: -3.0, max: 3.0, step: 0.001, label: "Initial Rest (Z)" },

    flapSpeed: { value: 4.0, min: 0.0, max: 15.0, step: 0.2, label: "Flap Speed" },
    flapIntensity: { value: 0.15, min: 0.0, max: 1.0, step: 0.02, label: "Flap Range" },

    autoPlayIntro: { value: true, label: "Play Intro Animation" },
    manualProgress: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, label: "Manual Intro Dev Slider" },
  });

  const material = useMemo(() => {
    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
    });

    const sideSign = positionLocal.x.sign();
    const distanceFromCenter = positionLocal.x.abs();
    const bendFactor = distanceFromCenter.pow(levaBendPower);

    const wrapYNode = sideSign.mul(levaWrapY).mul(bendFactor);
    const wrapZNode = sideSign.mul(levaWrapZ).mul(bendFactor);
    const closedPose = vec3(0, wrapYNode, wrapZNode);

    const baseFlap = time.mul(levaFlapSpeed).sin().mul(levaFlapIntensity);

    const targetY = sideSign.mul(levaInitialY);
    const targetZ = sideSign.mul(levaInitialZ);
    const openPose = vec3(0, targetY, targetZ);

    const currentRotation = mix(closedPose, openPose, introProgress);
    material.positionNode = rotate(positionLocal, currentRotation);

    material.colorNode = wingGradientNode().mul(wingIntensity);
    return material;
  }, []);

  useFrame((state, delta) => {
    levaWrapY.value = controls.wrapY;
    levaWrapZ.value = controls.wrapZ;
    levaBendPower.value = controls.bendPower;
    levaInitialY.value = controls.initialY;
    levaInitialZ.value = controls.initialZ;
    levaFlapSpeed.value = controls.flapSpeed;
    levaFlapIntensity.value = controls.flapIntensity;

    if (!controls.autoPlayIntro) {
      introProgress.value = controls.manualProgress;
    }
  });

  // 2. Use useGSAP to orchestrate clean timelines with automatic disposal hooks
  useGSAP(() => {
    if (controls.autoPlayIntro) {
      introProgress.value = 0;
      
      gsap.to(introProgress, {
        value: 1.0,
        duration: 1.8,
        delay: 0.5,
        ease: "power4.out", // Changed from .in to .out for a smooth deceleration end snap!
      });
    }
  }, [controls.autoPlayIntro]);

  // 3. Keep webGL geometry disposal completely independent to avoid runtime memory drops
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
