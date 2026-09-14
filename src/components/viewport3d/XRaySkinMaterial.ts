import * as THREE from 'three';

/**
 * Custom X-Ray Fresnel Rim Shader Material for the Human Torso in Light Mode.
 * Ensures the center of the chest is semi-transparent to clearly reveal the heart inside,
 * while glancing angles retain soft slate contours to preserve anatomical boundaries.
 */
export function createXRaySkinMaterial(
  colorHex: number = 0xcfd8dc,      // Subtle silver-slate tint
  rimColorHex: number = 0x64748b     // Deep slate rim contour
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uBaseColor: { value: new THREE.Color(colorHex) },
      uRimColor: { value: new THREE.Color(rimColorHex) },
      uOpacityMultiplier: { value: 0.35 }, // Controlled by UI slider
      uFresnelPower: { value: 2.2 },
      uCoreAlpha: { value: 0.06 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uBaseColor;
      uniform vec3 uRimColor;
      uniform float uOpacityMultiplier;
      uniform float uFresnelPower;
      uniform float uCoreAlpha;

      varying vec3 vNormal;
      varying vec3 vViewPosition;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Fresnel calculation: 0 when looking straight-on, 1 at grazing silhouette
        float fresnel = 1.0 - max(0.0, dot(normal, viewDir));
        float rimFactor = pow(fresnel, uFresnelPower);

        // Dynamic alpha: very clear in center, gentle contour on edges
        float alpha = mix(uCoreAlpha, 0.90, rimFactor) * uOpacityMultiplier;

        // Clean clinical shading
        vec3 color = mix(uBaseColor, uRimColor, rimFactor * 0.75);

        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthTest: true,
    depthWrite: false, // Prevents depth occlusion of the heart inside
    side: THREE.FrontSide,
    blending: THREE.NormalBlending,
  });
}
