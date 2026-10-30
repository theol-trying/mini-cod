import * as THREE from 'three';

// Cache for generated CanvasTextures to prevent recreating textures on each load
const textureCache = new Map<string, THREE.CanvasTexture>();

/**
 * Creates high-detail procedural asphalt texture with cracks, aggregate grit,
 * road grime and crisp road paint markings.
 */
export function getAsphaltTexture(): THREE.CanvasTexture {
  const key = 'asphalt_realistic';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;

  // 1. Dark weathered asphalt base
  ctx.fillStyle = '#1c1e22';
  ctx.fillRect(0, 0, 1024, 1024);

  // 2. Multi-frequency aggregate stone noise
  const imgData = ctx.getImageData(0, 0, 1024, 1024);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 36;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain + 2));
  }
  ctx.putImageData(imgData, 0, 0);

  // 3. Asphalt crack veins
  ctx.strokeStyle = 'rgba(10, 11, 14, 0.7)';
  ctx.lineWidth = 1.8;
  for (let c = 0; c < 12; c++) {
    let cx = Math.random() * 1024;
    let cy = Math.random() * 1024;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    const segs = 6 + Math.floor(Math.random() * 8);
    for (let s = 0; s < segs; s++) {
      cx += (Math.random() - 0.5) * 70;
      cy += (Math.random() - 0.5) * 70;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  // 4. Broken highway center yellow dashed line
  ctx.fillStyle = '#eab308';
  for (let y = 60; y < 1024; y += 180) {
    ctx.fillRect(496, y, 32, 100);
  }

  // 5. White edge demarcation lines with realistic wear
  ctx.fillStyle = 'rgba(235, 238, 242, 0.9)';
  ctx.fillRect(80, 0, 18, 1024);
  ctx.fillRect(926, 0, 18, 1024);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Creates polished concrete slabs with chamfered joints and subtle speckle.
 */
export function getConcreteTexture(): THREE.CanvasTexture {
  const key = 'concrete_slabs';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Light concrete base
  ctx.fillStyle = '#6b7280';
  ctx.fillRect(0, 0, 512, 512);

  // Fine sand noise
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 22;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Grid expansion lines
  ctx.strokeStyle = '#374151';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  // Subtle highlight bevels on joints
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(259, 0);
  ctx.lineTo(259, 512);
  ctx.moveTo(0, 259);
  ctx.lineTo(512, 259);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Creates corrugated metal container side panels with stencil marks and hazard stripes.
 */
export function getCorrugatedContainerTexture(colorHex: string, stencil: string): THREE.CanvasTexture {
  const key = `container_${colorHex}_${stencil}`;
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  // Base metal
  ctx.fillStyle = colorHex;
  ctx.fillRect(0, 0, 512, 256);

  // Realistic Corrugation shading (deep grooves & bevel highlights)
  for (let x = 0; x < 512; x += 32) {
    // Deep groove
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, 0, 10, 256);
    // Crest highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.fillRect(x + 10, 0, 6, 256);
    // Flat face
    ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.fillRect(x + 16, 0, 16, 256);
  }

  // Weathering edge rust
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, 'rgba(80, 40, 20, 0.45)');
  grad.addColorStop(0.12, 'transparent');
  grad.addColorStop(0.85, 'transparent');
  grad.addColorStop(1, 'rgba(40, 20, 10, 0.55)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 256);

  // Stenciled military shipping code
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px monospace';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 4;
  ctx.fillText(stencil, 48, 86);
  ctx.shadowBlur = 0;

  // Yellow/Black HAZMAT hazard stripes along bottom rail
  ctx.fillStyle = '#eab308';
  ctx.fillRect(0, 226, 512, 30);
  ctx.fillStyle = '#111827';
  for (let x = -30; x < 540; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.lineTo(x + 20, 226);
    ctx.lineTo(x + 36, 226);
    ctx.lineTo(x + 16, 256);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Creates polished airport concourse terrazzo tile texture with navigation guides.
 */
export function getTerminalFloorTexture(): THREE.CanvasTexture {
  const key = 'terminal_terrazzo';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Glossy light ivory terrazzo
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(0, 0, 512, 512);

  // Colored stone aggregate specks (grey, amber, navy)
  for (let i = 0; i < 3500; i++) {
    const r = Math.random();
    ctx.fillStyle = r > 0.6 ? '#94a3b8' : r > 0.3 ? '#cbd5e1' : '#b45309';
    ctx.fillRect(Math.random() * 512, Math.random() * 512, 2.5, 2.5);
  }

  // Brass separator border grid
  ctx.strokeStyle = '#b45309';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 512, 512);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Creates luxury Mediterranean terracotta / marble floor for Raid estate.
 */
export function getEstateTileTexture(): THREE.CanvasTexture {
  const key = 'estate_terracotta';
  if (textureCache.has(key)) return textureCache.get(key)!;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Warm terracotta base
  ctx.fillStyle = '#b45309';
  ctx.fillRect(0, 0, 512, 512);

  // 4 large square tiles with mortar lines
  const tileSize = 256;
  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      // Subtle color variation per tile
      const shade = 140 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade + 40}, ${shade - 20}, ${shade - 60})`;
      ctx.fillRect(x + 4, y + 4, tileSize - 8, tileSize - 8);

      // Fine marbling veins
      ctx.strokeStyle = 'rgba(255, 240, 220, 0.18)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x + 10, y + 20);
      ctx.bezierCurveTo(x + 90, y + 60, x + 150, y + 180, x + 230, y + 240);
      ctx.stroke();
    }
  }

  // Deep recessed mortar
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, 512, 512);
  ctx.beginPath();
  ctx.moveTo(256, 0);
  ctx.lineTo(256, 512);
  ctx.moveTo(0, 256);
  ctx.lineTo(512, 256);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  textureCache.set(key, tex);
  return tex;
}

/**
 * Creates atmospheric sky gradient backdrop with horizon haze.
 */
export function createAtmosphericSky(
  scene: THREE.Scene,
  skyColorHex: number,
  horizonColorHex: number,
  sunDir: THREE.Vector3
) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Atmospheric sky gradient from zenith to horizon
  const skyCol = new THREE.Color(skyColorHex);
  const horizCol = new THREE.Color(horizonColorHex);

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, skyCol.getStyle());
  grad.addColorStop(0.65, horizCol.getStyle());
  grad.addColorStop(1, '#e2e8f0');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft subtle cirrus cloud bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  for (let y = 120; y < 320; y += 45) {
    ctx.beginPath();
    ctx.ellipse(256 + Math.sin(y) * 80, y, 220, 22, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const skyTex = new THREE.CanvasTexture(canvas);
  skyTex.colorSpace = THREE.SRGBColorSpace;

  // Large sky dome
  const domeGeo = new THREE.SphereGeometry(150, 32, 16);
  const domeMat = new THREE.MeshBasicMaterial({
    map: skyTex,
    side: THREE.BackSide,
    depthWrite: false
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  scene.add(dome);

  // Glowing Sun Disc billboard in the sky
  const sunPos = sunDir.clone().normalize().multiplyScalar(135);
  const sunCanvas = document.createElement('canvas');
  sunCanvas.width = 128;
  sunCanvas.height = 128;
  const sCtx = sunCanvas.getContext('2d')!;
  const sunGrad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 64);
  sunGrad.addColorStop(0, 'rgba(255, 255, 250, 1.0)');
  sunGrad.addColorStop(0.25, 'rgba(255, 235, 170, 0.75)');
  sunGrad.addColorStop(0.6, 'rgba(255, 200, 100, 0.2)');
  sunGrad.addColorStop(1, 'rgba(255, 200, 100, 0)');
  sCtx.fillStyle = sunGrad;
  sCtx.fillRect(0, 0, 128, 128);

  const sunTex = new THREE.CanvasTexture(sunCanvas);
  const sunSpriteMat = new THREE.SpriteMaterial({
    map: sunTex,
    color: 0xffffff,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const sunSprite = new THREE.Sprite(sunSpriteMat);
  sunSprite.position.copy(sunPos);
  sunSprite.scale.set(38, 38, 1);
  scene.add(sunSprite);
}
