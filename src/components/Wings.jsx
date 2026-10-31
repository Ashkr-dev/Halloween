import { useGSAP } from "@gsap/react";
import { useFrame } from "@react-three/fiber";
import gsap from "gsap";
import { useControls, folder } from "leva";
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

export function Wings({ geometry }) {
  const [assetsLoaded, setAssetsLoaded] = useState(false);

  useEffect(() => {
    const handleLoad = () => setAssetsLoaded(true);
    window.addEventListener("loading-complete", handleLoad);
    return () => window.removeEventListener("loading-complete", handleLoad);
  }, []);

  const [controls, setArgs] = useControls(() => ({
    "Wing Rig": folder({
      wrapY: { value: -1.1, min: -10.0, max: 10.0, step: 0.001, label: "Wrap Forward (Y)" },
      wrapZ: { value: 0.18, min: -10.0, max: 10.0, step: 0.001, label: "Wrap Curl (Z)" },
      bendPower: { value: 2.0, min: 1.0, max: 4.0, step: 0.1, label: "Bend Curvature" },
      initialY: { value: 0.364, min: -3.0, max: 3.0, step: 0.001, label: "Initial Rest (Y)" },
      initialZ: { value: 0.175, min: -3.0, max: 3.0, step: 0.001, label: "Initial Rest (Z)" },
      flapSpeed: { value: 4.0, min: 0.0, max: 15.0, step: 0.2, label: "Flap Speed" },
      flapIntensity: { value: 0.15, min: 0.0, max: 1.0, step: 0.02, label: "Flap Range" },
      autoPlayIntro: { value: true, label: "Play Intro Animation" },
      manualProgress: { value: 0.0, min: 0.0, max: 1.0, step: 0.01, label: "Manual Intro Dev Slider" },
    })
  }));

  // OPTIMIZED: Memoized material instantiation fixes the active GPU memory leak
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

    // Symmetrical forward/backward sweep on the Y angle component
    const targetY = sideSign.mul(levaInitialY.add(baseFlap));
    const targetZ = sideSign.mul(levaInitialZ);
    const openPose = vec3(0, targetY, targetZ);

    const currentRotation = mix(closedPose, openPose, introProgress);
    mat.positionNode = rotate(positionLocal, currentRotation);

    mat.colorNode = wingGradientNode().mul(wingIntensity);
    return mat;
  }, []);

  useFrame(() => {
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

  useGSAP(() => {
    if (controls.autoPlayIntro && assetsLoaded) {
      introProgress.value = 0;
      setArgs({ manualProgress: 0 });

      gsap.to(introProgress, {
        value: 1.0,
        duration: 1.5,
        delay: 0.2,
        ease: "power3.inOut",
        onUpdate: () => {
          setArgs({ manualProgress: introProgress.value });
        }
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
