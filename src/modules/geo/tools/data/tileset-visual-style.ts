import { CustomShader, CustomShaderMode, LightingModel, UniformType, VaryingType } from 'cesium'

export type GeoTilesetVisualStyle = 'original' | 'cyber-scan'

export interface GeoTilesetVisual {
  readonly shader: CustomShader
  setScanPhase(phase: number): void
  dispose(): void
}

export function createCyberCityTilesetVisual(): GeoTilesetVisual {
  const shader = new CustomShader({
    mode: CustomShaderMode.MODIFY_MATERIAL,
    lightingModel: LightingModel.PBR,
    uniforms: {
      u_scanPhase: {
        type: UniformType.FLOAT,
        value: 0.34,
      },
    },
    varyings: {
      v_cyberPositionMC: VaryingType.VEC3,
      v_cyberNormalMC: VaryingType.VEC3,
    },
    vertexShaderText: `
      void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
        v_cyberPositionMC = vsOutput.positionMC;
        v_cyberNormalMC = normalize(vsInput.attributes.normalMC);
      }
    `,
    fragmentShaderText: `
      float cyberRandom(vec2 cell) {
        return fract(sin(dot(cell, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
        vec3 positionMC = v_cyberPositionMC;
        vec3 normalEC = normalize(fsInput.attributes.normalEC);
        vec3 normalWC = normalize(czm_inverseViewRotation * normalEC);
        vec3 worldUp = normalize(fsInput.attributes.positionWC);
        vec3 toEye = normalize(-fsInput.attributes.positionEC);

        float localHeight = max(positionMC.z, 0.0);
        float roof = smoothstep(0.68, 0.94, abs(dot(normalWC, worldUp)));
        float facade = 1.0 - roof;
        float upperMix = smoothstep(20.0, 220.0, localHeight);
        float towerMix = smoothstep(150.0, 360.0, localHeight);

        vec3 deepBlue = vec3(0.018, 0.075, 0.12);
        vec3 cyanBlue = vec3(0.025, 0.34, 0.48);
        vec3 ultraviolet = vec3(0.28, 0.12, 0.5);
        vec3 cyberColor = mix(deepBlue, cyanBlue, upperMix);
        cyberColor = mix(cyberColor, ultraviolet, towerMix * 0.72);
        cyberColor = mix(cyberColor, vec3(0.08, 0.43, 0.55), roof * 0.42);

        float xFacing = step(abs(normalWC.y), abs(normalWC.x));
        float facadeAxis = mix(positionMC.x, positionMC.y, xFacing);
        vec2 windowCell = vec2(facadeAxis / 7.5, localHeight / 4.2);
        vec2 windowUv = fract(windowCell);
        float windowShape = step(0.16, windowUv.x) * step(windowUv.x, 0.82);
        windowShape *= step(0.2, windowUv.y) * step(windowUv.y, 0.76);
        float windowSeed = cyberRandom(floor(windowCell));
        float litWindow = windowShape * step(0.46, windowSeed) * facade;

        float rim = pow(1.0 - abs(dot(normalEC, toEye)), 3.2);
        float heightPhase = fract(localHeight / 240.0);
        float scanDistance = abs(heightPhase - u_scanPhase);
        scanDistance = min(scanDistance, 1.0 - scanDistance);
        float scanBand = 1.0 - smoothstep(0.0, 0.026, scanDistance);
        scanBand *= facade * smoothstep(0.0, 8.0, localHeight);

        material.diffuse = mix(material.diffuse, material.diffuse * cyberColor, 0.84);
        material.roughness = mix(material.roughness, 0.56, 0.68);
        material.specular = max(material.specular, vec3(0.2, 0.36, 0.42));
        material.emissive += vec3(0.04, 0.72, 0.92) * litWindow * 0.72;
        material.emissive += vec3(0.04, 0.54, 0.74) * rim * 0.34;
        material.emissive += vec3(0.2, 0.68, 1.0) * scanBand * 1.15;
        material.emissive += vec3(0.28, 0.12, 0.58) * roof * towerMix * 0.26;
      }
    `,
  })

  function setScanPhase(phase: number): void {
    if (shader.isDestroyed()) {
      return
    }
    shader.setUniform('u_scanPhase', ((phase % 1) + 1) % 1)
  }

  function dispose(): void {
    if (!shader.isDestroyed()) {
      shader.destroy()
    }
  }

  return {
    shader,
    setScanPhase,
    dispose,
  }
}
