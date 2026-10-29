import { useTexture } from "@react-three/drei";
import { useControls } from "leva";
import { useEffect, useMemo } from "react";
import {
  Fn,
  min,
  positionLocal,
  pow,
  rotate,
  smoothstep,
  texture,
  time,
  uniform,
  uv,
  vec2,
} from "three/tsl";
import * as THREE from "three/webgpu";

// ==========================================
// 1. Single Source of Truth for Default Values
// ==========================================
const SMOKE_DEFAULTS = {
  color: "#32e241",
  uvScaleX: 0.5,
  uvScaleY: 0.2,
  twistSpeed: 0.2,
  windStrength: 3.0,
  speed: 0.1,
};

// ==========================================
// 2. Pure Static TSL Graphs (Compiled Exactly ONCE)
// ==========================================
const getPositionNode = Fn(([noiseTexNode, uTwistSpeed, uWindStrength]) => {
  const newPosition = positionLocal;

  const angle = positionLocal.y
    .mul(0.3)
    .sub(time.mul(uTwistSpeed))
    .sin()
    .mul(3);
  newPosition.xz.assign(rotate(newPosition.xz, angle));

  const windUvX = vec2(0.25, time.mul(0.02));
  const windUvY = vec2(0.75, time.mul(0.02));
  const windOffset = vec2(
    texture(noiseTexNode, windUvX).r.sub(0.5),
    texture(noiseTexNode, windUvY).r.sub(0.5),
  );
  const windStrengthGraph = pow(uv().y, 2);
  windOffset.mulAssign(windStrengthGraph.mul(uWindStrength));
  newPosition.xz.addAssign(windOffset);

  return newPosition;
});

const getOpacityNode = Fn(([noiseTexNode, uSmokeUvScale, uSpeed]) => {
  const smokeUv = uv()
    .mul(uSmokeUvScale)
    .sub(vec2(0, time.mul(uSpeed)));
  const smoke = texture(noiseTexNode, smokeUv).r;
  smoke.assign(smoothstep(0.5, 1.0, smoke));

  const edgeFade = min(
    uv().y.mul(3),
    uv().y.oneMinus(),
    uv().x.mul(1),
    uv().x.oneMinus(),
  );

  return smoke.mul(edgeFade).clamp(0, 1);
});

// ==========================================
// 3. Smoke Component
// ==========================================
export function Smoke({ nodes }) {
  const noiseTexture = useTexture("./Textures/noises.webp");

  // Keep uniforms persistent per-instance
  const uniforms = useMemo(
    () => ({
      uSmokeColor: uniform(new THREE.Color(SMOKE_DEFAULTS.color)),
      uSmokeUvScale: uniform(vec2(SMOKE_DEFAULTS.uvScaleX, SMOKE_DEFAULTS.uvScaleY)),
      uTwistSpeed: uniform(SMOKE_DEFAULTS.twistSpeed),
      uWindStrength: uniform(SMOKE_DEFAULTS.windStrength),
      uSpeed: uniform(SMOKE_DEFAULTS.speed),
    }),
    [],
  );

  // Directly feeds values downstream reactively
  useControls("Witch-Pot Smoke", {
    smokeColor: {
      value: SMOKE_DEFAULTS.color,
      onChange: (v) => uniforms.uSmokeColor.value.set(v),
    },
    smokeUvX: {
      value: SMOKE_DEFAULTS.uvScaleX,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (v) => (uniforms.uSmokeUvScale.value.x = v),
    },
    smokeUvY: {
      value: SMOKE_DEFAULTS.uvScaleY,
      min: 0,
      max: 5,
      step: 0.01,
      onChange: (v) => (uniforms.uSmokeUvScale.value.y = v),
    },
    twistSpeed: {
      value: SMOKE_DEFAULTS.twistSpeed,
      min: 0,
      max: 2,
      step: 0.01,
      onChange: (v) => (uniforms.uTwistSpeed.value = v),
    },
    windStrength: {
      value: SMOKE_DEFAULTS.windStrength,
      min: 0,
      max: 10,
      step: 0.01,
      onChange: (v) => (uniforms.uWindStrength.value = v),
    },
    speed: {
      value: SMOKE_DEFAULTS.speed,
      min: 0,
      max: 1,
      step: 0.01,
      onChange: (v) => (uniforms.uSpeed.value = v),
    },
  });

  // Material setup now only triggers once on load
  const smokeMaterial = useMemo(() => {
    if (noiseTexture) {
      noiseTexture.wrapS = THREE.RepeatWrapping;
      noiseTexture.wrapT = THREE.RepeatWrapping;
    }

    const material = new THREE.MeshBasicNodeMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
    });

    const activeNoiseTex = noiseTexture || new THREE.Texture();

    // Map static structural graphs while safely injecting reference uniforms
    material.positionNode = getPositionNode(activeNoiseTex, uniforms.uTwistSpeed, uniforms.uWindStrength);
    material.opacityNode = getOpacityNode(activeNoiseTex, uniforms.uSmokeUvScale, uniforms.uSpeed);
    material.colorNode = uniforms.uSmokeColor;

    return material;
  }, [noiseTexture, uniforms]);

  // Clean memory management
  useEffect(() => {
    return () => {
      smokeMaterial.dispose();
    };
  }, [smokeMaterial]);

  return (
    <mesh
      geometry={nodes.smoke.geometry}
      material={smokeMaterial}
      position={[-4.573, 0.638, 0.94]}
    />
  );
}

useTexture.preload("./Textures/noises.webp");
