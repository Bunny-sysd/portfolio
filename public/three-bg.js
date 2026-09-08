/* ═════════════════════════════════════════════════════════════════════
   0xPortfolio — three-bg.js (v6.0 True Active Theory Helical Spiral Engine)
   - Continuous 3D Vertical Helical Spine
   - Cards spiral UPWARDS from below as you scroll down
   - Active card rotates front & center; previous card ascends out of view
   - Hero Glass Emblem at top -> Helical Card Flow -> Ending Emblem at bottom
   - 100% Raycasting, Mouse Spring Tilt & Cinematic Zoom
   - Zero DOM overlap / Pure WebGL Viewport
   ═════════════════════════════════════════════════════════════════════ */

(function initActiveTheoryHelicalEngine() {
  'use strict';

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  function getWebGLContext(canvasEl) {
    try {
      return canvasEl.getContext('webgl', { powerPreference: 'high-performance', antialias: true }) ||
        canvasEl.getContext('experimental-webgl');
    } catch (e) {
      return null;
    }
  }

  const gl = getWebGLContext(canvas);
  if (!gl) {
    console.warn('> [0xPortfolio] WebGL unsupported.');
    document.body.classList.add('no-webgl');
    return;
  }

  // ── Cinematic easing (GSAP timeline authoring only — no ScrollTrigger scroll
  // detection is used; this page has no real DOM scroll to attach to. Timelines
  // built below are scrubbed manually via .progress(), fed from the existing
  // scrollProgress variable, or played as one-shot tweens on click. ──
  if (typeof gsap !== 'undefined' && typeof CustomEase !== 'undefined') {
    gsap.registerPlugin(CustomEase);
    CustomEase.create('cinematicSilk', '0.45, 0.05, 0.55, 0.95');
    CustomEase.create('cinematicFlow', '0.33, 0, 0.2, 1');
    CustomEase.create('cinematicArrive', '0.16, 1, 0.3, 1');
  }

  // Multi-Signal Hardware Performance Tiering
  function detectPerformanceTier(glContext) {
    const mem = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    let rendererStr = '';
    try {
      const ext = glContext.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        rendererStr = (glContext.getParameter(ext.UNMASKED_RENDERER_WEBGL) || '').toLowerCase();
      }
    } catch (e) {}

    const isBudgetGpu = /mali-(4|g3|g51|g52)|adreno\s*(3|4|5|610|612|615|616)|powervr|sgx|intel\s*hd|swiftshader|llvmpipe/i.test(rendererStr);
    const isFlagshipGpu = /apple\s*m|geforce\s*(rtx|gtx\s*1[06]|gtx\s*[2-4])|radeon\s*(rx|pro)|adreno\s*(7|680|690)|mali-g7[89]/i.test(rendererStr);

    let tier = 'mid';
    if (isBudgetGpu || mem <= 2 || cores <= 2) {
      tier = 'low';
    } else if (isFlagshipGpu && mem >= 8 && cores >= 8) {
      tier = 'high';
    }
    return { tier, rendererStr, mem, cores };
  }

  const perfProfile = detectPerformanceTier(gl);
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const isLowPower = perfProfile.tier === 'low' || (isMobile && perfProfile.tier !== 'high');
  const currentDPR = isLowPower ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.5);

  // 1. Scene, Camera & High-Precision Renderer
  const scene = new THREE.Scene();
  const baseFogColor = new THREE.Color('#050209');
  scene.fog = new THREE.Fog(baseFogColor, 20, 95);

  const camera = new THREE.PerspectiveCamera(
    isMobile ? 65 : 46,
    window.innerWidth / window.innerHeight,
    0.1,
    600
  );
  camera.position.set(0, 0, 24);

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isLowPower,
    powerPreference: 'high-performance',
    precision: isLowPower ? 'mediump' : 'highp'
  });

  renderer.setPixelRatio(currentDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Dedicated Active Card Dynamic Spotlight & Cyber Rim Light
  const activeCardSpotlight = new THREE.SpotLight(0x7DD3FC, 3.5, 45, Math.PI / 4, 0.4, 1.2);
  activeCardSpotlight.position.set(0, 0, 18);
  scene.add(activeCardSpotlight);

  const activeCardRimLight = new THREE.PointLight(0xCBD5E1, 2.0, 25);
  activeCardRimLight.position.set(0, 0, 10);
  scene.add(activeCardRimLight);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // 2. Theme Palettes
  // Single fixed palette (theme switcher removed — matches the CSS retheme:
  // --green/--cyan in style.css are now #7DD3FC/#CBD5E1, same values here so
  // the WebGL scene and the DOM UI agree). currentColors keeps its shape so
  // the ~19 places below that read currentColors.primary/.accent/etc. are
  // unchanged.
  const currentColors = {
    primary: new THREE.Color('#7DD3FC'),
    secondary: new THREE.Color('#0a2a3d'),
    accent: new THREE.Color('#CBD5E1'),
    highlight: new THREE.Color('#ffffff'),
    fog: new THREE.Color('#030509'),
    spine1: new THREE.Color('#7DD3FC'),
    spine2: new THREE.Color('#CBD5E1')
  };

  // 1.5 Cinematic Scene Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.70);
  scene.add(ambientLight);

  const mainDirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  mainDirLight.position.set(15, 25, 20);
  scene.add(mainDirLight);

  // Dedicated metallic specular fill light for Doc Ock arm & spine
  const metalFillLight = new THREE.DirectionalLight(0x99ccff, 1.4);
  metalFillLight.position.set(-15, 10, 18);
  scene.add(metalFillLight);

  const frontKeyLight = new THREE.DirectionalLight(0xffffff, 0.6);
  frontKeyLight.position.set(12, 18, 15);
  scene.add(frontKeyLight);

  const spinePointLight = new THREE.PointLight(currentColors.primary, 3.5, 90);
  spinePointLight.position.set(0, 0, -8);
  scene.add(spinePointLight);

  const spineAccentLight = new THREE.PointLight(currentColors.accent, 2.5, 60);
  spineAccentLight.position.set(0, -30, -10);
  scene.add(spineAccentLight);

  const rimLight = new THREE.DirectionalLight(currentColors.accent, 0.85);
  rimLight.position.set(-15, -10, -15);
  scene.add(rimLight);

  // Dim Reddish Tentacle Energy Glow (corresponds to claw core energy)
  const tentacleEnergyLight1 = new THREE.PointLight(0xff1a1a, 2.2, 120);
  tentacleEnergyLight1.position.set(0, 5, -6);
  scene.add(tentacleEnergyLight1);

  const tentacleEnergyLight2 = new THREE.PointLight(0xff0033, 1.6, 80);
  tentacleEnergyLight2.position.set(0, -5, -6);
  scene.add(tentacleEnergyLight2);

  // Dim reddish ambient hemisphere to tint the whole scene
  const redAmbientHemi = new THREE.HemisphereLight(0x1a0505, 0x0a0002, 0.45);
  scene.add(redAmbientHemi);

  // 3. Multi-Tier Active Theory Particle Ecosystem
  let glitterCount = 3500;
  if (perfProfile.tier === 'low') {
    glitterCount = 900;
  } else if (perfProfile.tier === 'mid') {
    glitterCount = 1800;
  }

  const glitterGeo = new THREE.BufferGeometry();
  const glitterPositions = new Float32Array(glitterCount * 3);
  const glitterColors = new Float32Array(glitterCount * 3);
  const glitterBaseData = [];

  for (let i = 0; i < glitterCount; i++) {
    const idx = i * 3;
    // Spread particles broadly across the whole viewport
    const r = Math.random();
    let x0, y0, z0;
    if (r < 0.35) {
      // Dense cluster near spine core
      const spineR = 0.3 + Math.pow(Math.random(), 1.8) * 4.0;
      const theta = Math.random() * Math.PI * 2;
      x0 = Math.cos(theta) * spineR;
      y0 = (Math.random() - 0.5) * 28;
      z0 = -8 + Math.sin(theta) * spineR * 0.5;
    } else if (r < 0.7) {
      // Mid-field ambient particles
      x0 = (Math.random() - 0.5) * 40;
      y0 = (Math.random() - 0.5) * 30;
      z0 = -5 + (Math.random() - 0.5) * 25;
    } else {
      // Far-field stardust (wide spread, very far)
      x0 = (Math.random() - 0.5) * 70;
      y0 = (Math.random() - 0.5) * 50;
      z0 = -15 + (Math.random() - 0.5) * 40;
    }

    const len = Math.hypot(x0, y0, z0 + 8) || 1;
    const nx = x0 / len;
    const ny = y0 / len;
    const nz = (z0 + 8) / len;

    glitterPositions[idx] = x0;
    glitterPositions[idx + 1] = y0;
    glitterPositions[idx + 2] = z0;

    const randCol = Math.random();
    let baseColor;
    if (randCol > 0.55) baseColor = currentColors.primary;
    else if (randCol > 0.30) baseColor = currentColors.accent;
    else if (randCol > 0.12) baseColor = new THREE.Color('#ff2244'); // reddish energy particles
    else baseColor = currentColors.highlight;
    glitterColors[idx] = baseColor.r;
    glitterColors[idx + 1] = baseColor.g;
    glitterColors[idx + 2] = baseColor.b;

    // Assign entanglement partner
    const entanglePartner = (i + 1 + Math.floor(Math.random() * 5)) % glitterCount;

    // Store scatter target (used for deep dive explosion)
    const scatterAngle = Math.random() * Math.PI * 2;
    const scatterPhi = (Math.random() - 0.5) * Math.PI;
    const scatterDist = 15 + Math.random() * 35;

    glitterBaseData.push({
      x0, y0, z0,
      nx, ny, nz,
      dx: 0, dy: 0, dz: 0,
      vx: 0, vy: 0, vz: 0,
      freq: 2.5 + Math.random() * 7.0,
      phase: Math.random() * Math.PI * 2,
      baseColor,
      entanglePartner,
      scatterX: Math.cos(scatterPhi) * Math.sin(scatterAngle) * scatterDist,
      scatterY: Math.sin(scatterPhi) * scatterDist,
      scatterZ: Math.cos(scatterPhi) * Math.cos(scatterAngle) * scatterDist
    });
  }

  glitterGeo.setAttribute('position', new THREE.BufferAttribute(glitterPositions, 3));
  glitterGeo.setAttribute('color', new THREE.BufferAttribute(glitterColors, 3));

  function createGlitterTexture() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const half = s / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.12, 'rgba(255,80,80,0.8)');
    grad.addColorStop(0.30, 'rgba(0,255,102,0.6)');
    grad.addColorStop(0.55, 'rgba(0,180,255,0.25)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    // Crosshair sparkle
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(half, 10); ctx.lineTo(half, s - 10);
    ctx.moveTo(10, half); ctx.lineTo(s - 10, half);
    ctx.stroke();

    return new THREE.CanvasTexture(c);
  }

  const glitterMat = new THREE.PointsMaterial({
    size: isMobile ? 0.5 : 0.75,
    map: createGlitterTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const glitterSystem = new THREE.Points(glitterGeo, glitterMat);
  rootGroup.add(glitterSystem);

  // 3b. Quantum Entanglement Connection Lines
  const entangleLineCount = perfProfile.tier === 'low' ? 150 : perfProfile.tier === 'mid' ? 350 : 700;
  const entangleGeo = new THREE.BufferGeometry();
  const entanglePositions = new Float32Array(entangleLineCount * 2 * 3);
  const entangleColors = new Float32Array(entangleLineCount * 2 * 3);
  entangleGeo.setAttribute('position', new THREE.BufferAttribute(entanglePositions, 3));
  entangleGeo.setAttribute('color', new THREE.BufferAttribute(entangleColors, 3));

  const entangleLineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const entangleLines = new THREE.LineSegments(entangleGeo, entangleLineMat);
  rootGroup.add(entangleLines);

  // Deep-Dive Particle Transition State
  let deepDiveScatter = 0; // 0 = normal, 1 = fully scattered

  // ── 4. INDUSTRIAL HYPER-REALISTIC DOC OCK SPINE, CENTRAL COLUMN & CARD HANDLERS ──
  // Aesthetic: Heavy load-bearing aerospace hardware, burnished gunmetal, satin silver titanium,
  // mirror chrome hydraulic pistons, industrial brass knuckle pins, and flexible ribbed rubber conduits.
  
  // High-Contrast Aerospace & Industrial Materials (sharp specular highlights against dark void)
  const darkSteelMat = new THREE.MeshStandardMaterial({
    color: 0x384456, // Burnished slate gunmetal steel
    metalness: 0.94,
    roughness: 0.20,
    emissive: 0x08101a,
    emissiveIntensity: 0.35
  });

  const silverTitaniumMat = new THREE.MeshStandardMaterial({
    color: 0x9fb3c8, // Bright satin silver titanium
    metalness: 0.96,
    roughness: 0.14,
    emissive: 0x141e2e,
    emissiveIntensity: 0.30
  });

  const hydraulicChromeMat = new THREE.MeshStandardMaterial({
    color: 0xdde6f0, // Mirror chrome for hydraulic rods
    metalness: 0.98,
    roughness: 0.05
  });

  const industrialBrassMat = new THREE.MeshStandardMaterial({
    color: 0xe5a82e, // Bright aerospace gold/brass for knuckle pins and bevels
    metalness: 0.90,
    roughness: 0.22,
    emissive: 0x3a2505,
    emissiveIntensity: 0.35
  });

  const blackConduitRubberMat = new THREE.MeshStandardMaterial({
    color: 0x161a22,
    roughness: 0.78,
    metalness: 0.22
  });

  const laserEyeCoreMat = new THREE.MeshStandardMaterial({
    color: 0x7DD3FC,
    emissive: new THREE.Color(0x7DD3FC),
    emissiveIntensity: 3.6,
    roughness: 0.15,
    metalness: 0.10
  });
  const laserNucleusMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 4.8,
    roughness: 0.05,
    metalness: 0.0
  });
  const laserBeamMat = new THREE.MeshBasicMaterial({
    color: 0x7DD3FC,
    transparent: true,
    opacity: 0.28,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide
  });

  // ── 4. UNIFIED KINETIC TUBE RIG & INTEGRATED CARDS ASSEMBLY ──
  // Both the central spine pipe and all card stations share a SINGLE parent transform group.
  // They move in 100% lockstep: cards are rigidly stationed in front of the pipe in local space,
  // completely eliminating clipping or occlusion at all scroll positions.
  const tubeRigGroup = new THREE.Group();
  rootGroup.add(tubeRigGroup);

  const stepY = isMobile ? 12.0 : 13.5;
  const stepZ = isMobile ? 18.0 : 22.0;

  // ── SOFT RADIAL GLOW SPARK SPRITE TEXTURE (BUG 1 FIX) ──
  function createSoftSparkTexture() {
    const s = 64;
    const c = document.createElement('canvas');
    c.width = s; c.height = s;
    const ctx = c.getContext('2d');
    const half = s / 2;

    const grad = ctx.createRadialGradient(half, half, 0, half, half, half);
    grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
    grad.addColorStop(0.20, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.42, 'rgba(255, 230, 210, 0.55)');
    grad.addColorStop(0.70, 'rgba(255, 120, 80, 0.15)');
    grad.addColorStop(1.0, 'rgba(0, 0, 0, 0.0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }
  const sparkSpriteTexture = createSoftSparkTexture();

  // ── PROCEDURAL CYBER CONDUIT SURFACE TEXTURES (MAIN DETAIL PASS) ──
  function createCyberConduitTexture() {
    const w = 512, h = 1024;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    // Dark titanium / obsidian alloy base
    ctx.fillStyle = '#121622';
    ctx.fillRect(0, 0, w, h);

    // Carbon weave micro-grid
    ctx.fillStyle = 'rgba(255, 255, 255, 0.028)';
    for (let x = 0; x < w; x += 8) {
      for (let y = 0; y < h; y += 8) {
        if ((x / 8 + y / 8) % 2 === 0) ctx.fillRect(x, y, 8, 8);
      }
    }

    // Longitudinal conduit fluting & armor seam lines
    for (let x = 32; x < w; x += 64) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(x - 3, 0, 6, h);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.fillRect(x + 3, 0, 2, h);
    }

    // Micro circuit bus traces
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.30)';
    ctx.lineWidth = 2.0;
    for (let tr = 0; tr < 12; tr++) {
      const startX = 50 + (tr * 36) % (w - 100);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      let cy = 0, cx = startX;
      while (cy < h) {
        cy += 70 + Math.random() * 60;
        cx += (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 25);
        cx = Math.max(20, Math.min(w - 20, cx));
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Technical serial stencils
    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    for (let y = 90; y < h; y += 180) {
      ctx.fillText('[BUS_CH_0' + (Math.floor(y / 150) + 1) + ' // 320BAR]', 45, y);
      ctx.fillText('NEXUS_CORE // OPTIMAL', 270, y + 45);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }

  function createCyberConduitEmissiveTexture() {
    const w = 512, h = 1024;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    ctx.shadowBlur = 10;
    ctx.lineWidth = 3.0;

    // Glowing cyan energy bus
    ctx.strokeStyle = '#00e5ff';
    ctx.shadowColor = '#00e5ff';
    for (let x = 64; x < w; x += 128) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      let cy = 0, cx = x;
      while (cy < h) {
        cy += 65;
        cx += (Math.random() > 0.5 ? 24 : -24);
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();

      for (let ny = 70; ny < h; ny += 130) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, ny, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Crimson pulse tracks
    ctx.strokeStyle = '#ff0055';
    ctx.shadowColor = '#ff0055';
    ctx.lineWidth = 2.2;
    for (let x = 120; x < w; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    // Neon telemetry glyphs
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.fillStyle = '#00e5ff';
    for (let y = 140; y < h; y += 220) {
      ctx.fillText('BUS_STREAM', 65, y);
      ctx.fillStyle = '#ffaa00';
      ctx.fillText('PWR:OK', 230, y + 45);
      ctx.fillStyle = '#ff0055';
      ctx.fillText('ACTIVE', 350, y + 90);
      ctx.fillStyle = '#00e5ff';
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 6);
    return tex;
  }

  const armCyberTex = createCyberConduitTexture();
  const armCyberEmissiveTex = createCyberConduitEmissiveTexture();
  const spineCyberTex = createCyberConduitTexture();
  const spineCyberEmissiveTex = createCyberConduitEmissiveTexture();

  const armCyberMat = new THREE.MeshStandardMaterial({
    color: 0x1a2232,
    roughness: 0.35,
    metalness: 0.82,
    map: armCyberTex,
    emissive: 0xffffff,
    emissiveMap: armCyberEmissiveTex,
    emissiveIntensity: 0.92
  });

  const spineCyberMat = new THREE.MeshStandardMaterial({
    color: 0x182030,
    roughness: 0.35,
    metalness: 0.82,
    map: spineCyberTex,
    emissive: 0xffffff,
    emissiveMap: spineCyberEmissiveTex,
    emissiveIntensity: 0.92
  });

  // ── 4A. CONTINUOUS SKINNED MECHANICAL TUBE & INTEGRATED DOC OCK RIG ──
  // One continuous, seamless skinned tube geometry along the armCurve and spine path.
  // The claw cuff flows seamlessly into the tube surface with matching radius and zero seam.

  // 1. Grand Doc Ock Robotic Tentacle Arm Curve
  const armCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, 0.0, -7.5),   // Top of central spine
    new THREE.Vector3(0, 6.2, -5.6),   // Arching higher up and forward
    new THREE.Vector3(0, 6.5, -1.8),   // High overhead reach over Station 0
    new THREE.Vector3(0, 1.8, 1.2)     // Connecting directly into claw cuff!
  );

  // 2. CONTINUOUS SKINNED ARM TUBE (Zero Gaps, Solid Load-Bearing Mechanical Shell)
  const armTubeRadius = 2.55;
  const armTubeGeo = new THREE.TubeGeometry(armCurve, 80, armTubeRadius, 28, false);
  const armTubeMesh = new THREE.Mesh(armTubeGeo, armCyberMat);
  tubeRigGroup.add(armTubeMesh);

  // Inner hydraulic conduit core running through the tube
  const armInnerGeo = new THREE.TubeGeometry(armCurve, 60, 1.25, 16, false);
  const armInnerMesh = new THREE.Mesh(armInnerGeo, blackConduitRubberMat);
  tubeRigGroup.add(armInnerMesh);

  // Surface Ornamentation: Raised Titanium Vertebra Collars on top of the continuous tube
  const armSegCount = 14;
  const armPoints = armCurve.getPoints(armSegCount);
  const armSegments = [];

  const armCollarGeo = new THREE.TorusGeometry(2.82, 0.18, 12, 28);
  const armPinGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.65, 12);
  const armPistonGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.85, 10);

  for (let a = 1; a < armSegCount; a++) {
    const segGroup = new THREE.Group();
    const pt = armPoints[a];
    const nextPt = armPoints[Math.min(armSegCount, a + 1)];
    segGroup.position.copy(pt);

    // Tangent orientation along curve
    const tangent = new THREE.Vector3().subVectors(nextPt, pt).normalize();
    if (tangent.lengthSq() > 0.001) {
      segGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
    }

    const collarMesh = new THREE.Mesh(armCollarGeo, (a % 2 === 0) ? silverTitaniumMat : industrialBrassMat);
    segGroup.add(collarMesh);

    const pinL = new THREE.Mesh(armPinGeo, industrialBrassMat);
    pinL.rotation.z = Math.PI / 2;
    pinL.position.set(-1.65, 0, 0);
    const pinR = pinL.clone();
    pinR.position.set(1.65, 0, 0);
    segGroup.add(pinL, pinR);

    const pL = new THREE.Mesh(armPistonGeo, hydraulicChromeMat);
    pL.position.set(-1.52, 0, 0);
    const pR = pL.clone();
    pR.position.set(1.52, 0, 0);
    segGroup.add(pL, pR);

    tubeRigGroup.add(segGroup);
    armSegments.push({
      group: segGroup,
      basePos: pt.clone(),
      phase: a * 0.25
    });
  }

  // 3. CONTINUOUS CENTRAL COLUMN TUBE (Solid Unbroken Surface Following Diagonal Spine Axis)
  const columnTubeRadius = 2.45;
  const spineCurve = new THREE.LineCurve3(
    new THREE.Vector3(0, 0.0, -7.5),
    new THREE.Vector3(0, -7.0 * stepY, -7.0 * stepZ - 7.5)
  );
  const columnTubeGeo = new THREE.TubeGeometry(spineCurve, 80, columnTubeRadius, 28, false);
  const columnTubeMesh = new THREE.Mesh(columnTubeGeo, spineCyberMat);
  tubeRigGroup.add(columnTubeMesh);

  // Heavy Industrial Manifold Junction Collar (Unites arm tube and vertical column at Station 0)
  const junctionCollar = new THREE.Mesh(new THREE.CylinderGeometry(3.10, 3.10, 2.2, 32), silverTitaniumMat);
  junctionCollar.position.set(0, 0.0, -7.5);
  const junctionBevel = new THREE.Mesh(new THREE.TorusGeometry(3.15, 0.22, 12, 32), industrialBrassMat);
  junctionBevel.rotation.x = Math.PI / 2;
  junctionCollar.add(junctionBevel);
  tubeRigGroup.add(junctionCollar);

  // Surface Ornamentation along Continuous Column: Raised Sleeves & Glowing Neon Energy Rings
  const spineTotalSegCount = 36;
  const spineStartY = 0.0;
  const spineStartZ = -7.5;
  const spineEndY = -7.0 * stepY;
  const spineEndZ = -7.0 * stepZ - 7.5;
  const spineSegments = [];

  const segSleeveGeo = new THREE.CylinderGeometry(2.52, 2.52, 1.10, 28);
  const segChamferGeo = new THREE.TorusGeometry(2.55, 0.12, 10, 28);
  const segNeonRingGeo = new THREE.TorusGeometry(2.58, 0.14, 10, 28);
  const segBloomHaloGeo = new THREE.TorusGeometry(2.68, 0.38, 14, 32);
  const segPistonGeo = new THREE.CylinderGeometry(0.16, 0.16, 1.95, 10);

  for (let s = 0; s < spineTotalSegCount; s++) {
    const p = s / (spineTotalSegCount - 1);
    const segY = THREE.MathUtils.lerp(spineStartY, spineEndY, p);
    const segZ = THREE.MathUtils.lerp(spineStartZ, spineEndZ, p);
    const seg = new THREE.Group();
    seg.position.set(0, segY, segZ);

    const sMat = (s % 2 === 0) ? darkSteelMat : silverTitaniumMat;
    const sleeve = new THREE.Mesh(segSleeveGeo, sMat);
    seg.add(sleeve);

    const chamfer = new THREE.Mesh(segChamferGeo, industrialBrassMat);
    chamfer.rotation.x = Math.PI / 2;
    seg.add(chamfer);

    // Primary Glowing Neon Energy Ring
    const neonRing = new THREE.Mesh(segNeonRingGeo, new THREE.MeshStandardMaterial({
      color: 0xCBD5E1,
      emissive: new THREE.Color(0xCBD5E1),
      emissiveIntensity: 2.8,
      roughness: 0.15,
      metalness: 0.85
    }));
    neonRing.rotation.x = Math.PI / 2;
    neonRing.position.y = 0.30;
    seg.add(neonRing);

    // Concentric Additive Bloom Halo (True Glowing Halation without External Libraries)
    const bloomHalo = new THREE.Mesh(segBloomHaloGeo, new THREE.MeshBasicMaterial({
      color: 0xCBD5E1,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    }));
    bloomHalo.rotation.x = Math.PI / 2;
    bloomHalo.position.y = 0.30;
    seg.add(bloomHalo);

    const pL = new THREE.Mesh(segPistonGeo, hydraulicChromeMat);
    pL.position.set(-2.55, 0, 0);
    const pR = pL.clone();
    pR.position.set(2.55, 0, 0);
    seg.add(pL, pR);

    tubeRigGroup.add(seg);
    spineSegments.push({
      group: seg,
      neonRing: neonRing,
      bloomHalo: bloomHalo,
      basePos: new THREE.Vector3(0, segY, segZ),
      phase: s * 0.22,
      u: p
    });
  }

  // ── 3C. HIGH-SPEED DATA PACKET TELEMETRY STREAM ALONG TUBE SURFACE (DETAIL PASS) ──
  const tubeDataCount = isMobile ? 110 : 320;
  const tubeDataGeo = new THREE.BufferGeometry();
  const tubeDataPos = new Float32Array(tubeDataCount * 3);
  const tubeDataCol = new Float32Array(tubeDataCount * 3);
  const tubeDataParticles = [];

  const dataPalette = [
    new THREE.Color('#ffffff'), // White-hot packet header
    new THREE.Color('#CBD5E1'), // Electric cyan telemetry
    new THREE.Color('#ff0055'), // High-voltage crimson
    new THREE.Color('#7DD3FC'), // Optimal green bus
    new THREE.Color('#ffaa00')  // Amber diagnostic
  ];

  for (let dp = 0; dp < tubeDataCount; dp++) {
    const isArm = dp < 100;
    const curve = isArm ? armCurve : spineCurve;
    const radius = isArm ? (armTubeRadius * 1.05) : (columnTubeRadius * 1.05);
    const u = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const col = dataPalette[Math.floor(Math.random() * dataPalette.length)];

    tubeDataCol[dp * 3] = col.r;
    tubeDataCol[dp * 3 + 1] = col.g;
    tubeDataCol[dp * 3 + 2] = col.b;

    tubeDataParticles.push({
      isArm: isArm,
      curve: curve,
      radius: radius,
      u: u,
      angle: angle,
      speed: 0.12 + Math.random() * 0.28,
      wobblePhase: Math.random() * Math.PI * 2
    });
  }

  tubeDataGeo.setAttribute('position', new THREE.BufferAttribute(tubeDataPos, 3));
  tubeDataGeo.setAttribute('color', new THREE.BufferAttribute(tubeDataCol, 3));

  const tubeDataMat = new THREE.PointsMaterial({
    size: isMobile ? 1.05 : 1.55,
    map: sparkSpriteTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const tubeDataPoints = new THREE.Points(tubeDataGeo, tubeDataMat);
  tubeRigGroup.add(tubeDataPoints);

  // ── 3D. CRAWLING ELECTRIC LIGHTNING ARCS ALONG TUBE SURFACE (DETAIL PASS) ──
  const electricArcCount = (isMobile || isLowPower) ? 0 : 16;
  const electricArcs = [];
  const arcVertsPerLine = 12;

  for (let ea = 0; ea < electricArcCount; ea++) {
    const arcGeo = new THREE.BufferGeometry();
    const arcPositions = new Float32Array(arcVertsPerLine * 3);
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
    const arcMat = new THREE.LineBasicMaterial({
      color: 0xCBD5E1,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      linewidth: 2
    });
    const arcLine = new THREE.Line(arcGeo, arcMat);
    tubeRigGroup.add(arcLine);

    electricArcs.push({
      line: arcLine,
      geo: arcGeo,
      mat: arcMat,
      active: false,
      life: 0,
      maxLife: 0.2,
      isArm: false,
      uStart: 0,
      uEnd: 0,
      angle: 0
    });
  }

  // ── 3E. AMBIENT ENERGY EMBERS DRIFTING NEAR THE TUBE (DETAIL PASS) ──
  const tubeEmberCount = 240;
  const tubeEmberGeo = new THREE.BufferGeometry();
  const tubeEmberPos = new Float32Array(tubeEmberCount * 3);
  const tubeEmberCol = new Float32Array(tubeEmberCount * 3);
  const tubeEmberData = [];

  for (let eb = 0; eb < tubeEmberCount; eb++) {
    const isArm = eb < 60;
    const curve = isArm ? armCurve : spineCurve;
    const u = Math.random();
    const radialDist = 2.8 + Math.random() * 3.8;
    const angle = Math.random() * Math.PI * 2;
    const col = (Math.random() > 0.4) ? new THREE.Color('#00e5ff') : new THREE.Color('#ff0055');

    tubeEmberCol[eb * 3] = col.r;
    tubeEmberCol[eb * 3 + 1] = col.g;
    tubeEmberCol[eb * 3 + 2] = col.b;

    tubeEmberData.push({
      curve: curve,
      u: u,
      radialDist: radialDist,
      angle: angle,
      driftSpeed: 0.03 + Math.random() * 0.06,
      rotSpeed: (Math.random() - 0.5) * 0.8,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }

  tubeEmberGeo.setAttribute('position', new THREE.BufferAttribute(tubeEmberPos, 3));
  tubeEmberGeo.setAttribute('color', new THREE.BufferAttribute(tubeEmberCol, 3));

  const tubeEmberMat = new THREE.PointsMaterial({
    size: isMobile ? 0.90 : 1.35,
    map: sparkSpriteTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const tubeEmberPoints = new THREE.Points(tubeEmberGeo, tubeEmberMat);
  tubeRigGroup.add(tubeEmberPoints);

  // ── 3F. STREAMING GLOWING BINARY DATA DIGITS ALONG PIPE (0 & 1 CONDUIT STREAM) ──
  function createBinaryTexture(char, glowColorHex) {
    const cvs = document.createElement('canvas');
    cvs.width = 128;
    cvs.height = 128;
    const cctx = cvs.getContext('2d');
    cctx.clearRect(0, 0, 128, 128);

    cctx.font = '900 86px "JetBrains Mono", monospace';
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';

    // Multi-stage neon bloom
    cctx.shadowColor = glowColorHex;
    cctx.shadowBlur = 28;
    cctx.fillStyle = glowColorHex;
    cctx.fillText(char, 64, 64);
    cctx.fillText(char, 64, 64);

    cctx.shadowBlur = 8;
    cctx.fillStyle = '#ffffff';
    cctx.fillText(char, 64, 64);

    const bTex = new THREE.CanvasTexture(cvs);
    bTex.minFilter = THREE.LinearFilter;
    bTex.magFilter = THREE.LinearFilter;
    return bTex;
  }

  const binary0Tex = createBinaryTexture('0', '#00e5ff'); // Electric Cyan '0'
  const binary1Tex = createBinaryTexture('1', '#7DD3FC'); // Matrix Green '1'

  const binaryCount = 180;
  const binaryGeo0 = new THREE.BufferGeometry();
  const binaryGeo1 = new THREE.BufferGeometry();
  const binaryPos0 = new Float32Array((binaryCount / 2) * 3);
  const binaryPos1 = new Float32Array((binaryCount / 2) * 3);
  const binaryParticles = [];

  for (let b = 0; b < binaryCount; b++) {
    const isArm = b < 60;
    const curve = isArm ? armCurve : spineCurve;
    const radius = (isArm ? armTubeRadius : columnTubeRadius) * 1.08;
    const u = Math.random();
    const angle = Math.random() * Math.PI * 2;
    const isOne = b % 2 === 1;

    binaryParticles.push({
      isArm: isArm,
      curve: curve,
      radius: radius,
      u: u,
      angle: angle,
      isOne: isOne,
      slotIdx: Math.floor(b / 2),
      speed: 0.16 + Math.random() * 0.28,
      wobble: Math.random() * Math.PI * 2
    });
  }

  binaryGeo0.setAttribute('position', new THREE.BufferAttribute(binaryPos0, 3));
  binaryGeo1.setAttribute('position', new THREE.BufferAttribute(binaryPos1, 3));

  const binaryMat0 = new THREE.PointsMaterial({
    size: isMobile ? 1.2 : 2.0,
    map: binary0Tex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const binaryMat1 = new THREE.PointsMaterial({
    size: isMobile ? 1.2 : 2.0,
    map: binary1Tex,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const binaryPoints0 = new THREE.Points(binaryGeo0, binaryMat0);
  const binaryPoints1 = new THREE.Points(binaryGeo1, binaryMat1);
  tubeRigGroup.add(binaryPoints0, binaryPoints1);

  // ── 3G. HIGH-VOLTAGE TRAVELING ELECTRIC PLASMA SURGE RINGS ──
  // ── TRAVELING CURRENT (accelerator collars + fat boluses + desktop groove ribbon) ──
  const currentBolusTube = isMobile ? 0.55 : 0.92;
  const currentBolusGeo = new THREE.TorusGeometry(columnTubeRadius * 1.03, currentBolusTube, 14, 36);
  function makeCurrentMat(hex, op) {
    return new THREE.MeshBasicMaterial({
      color: hex,
      transparent: true,
      opacity: op,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }
  const surgeRingMat1 = makeCurrentMat(0xCBD5E1, 0.92);
  const surgeRingMat2 = makeCurrentMat(0xCBD5E1, 0.88);
  const surgeRingMat3 = makeCurrentMat(0xff3366, 0.70);
  const electricSurgeRing1 = new THREE.Mesh(currentBolusGeo, surgeRingMat1);
  const electricSurgeRing2 = new THREE.Mesh(currentBolusGeo, surgeRingMat2);
  const electricSurgeRing3 = new THREE.Mesh(currentBolusGeo, surgeRingMat3);
  tubeRigGroup.add(electricSurgeRing1, electricSurgeRing2, electricSurgeRing3);

  let armCurrentBolus = null;
  let spineGrooveMesh = null;
  if (!isMobile) {
    const armBolusGeo = new THREE.TorusGeometry(armTubeRadius * 1.03, 0.70, 12, 32);
    armCurrentBolus = new THREE.Mesh(armBolusGeo, makeCurrentMat(0xCBD5E1, 0.82));
    tubeRigGroup.add(armCurrentBolus);

    const groovePts = [];
    const gUp = new THREE.Vector3(0, 1, 0);
    const gRight = new THREE.Vector3(1, 0, 0);
    for (let gi = 0; gi <= 96; gi++) {
      const t = gi / 96;
      const cpt = spineCurve.getPointAt(t);
      const tan = spineCurve.getTangentAt(t);
      let nrm = new THREE.Vector3().crossVectors(tan, gUp);
      if (nrm.lengthSq() < 0.001) nrm.crossVectors(tan, gRight);
      nrm.normalize();
      const bin = new THREE.Vector3().crossVectors(tan, nrm).normalize();
      const ang = t * Math.PI * 2 * 2.25;
      const rr = columnTubeRadius * 1.04;
      groovePts.push(new THREE.Vector3(
        cpt.x + (nrm.x * Math.cos(ang) + bin.x * Math.sin(ang)) * rr,
        cpt.y + (nrm.y * Math.cos(ang) + bin.y * Math.sin(ang)) * rr,
        cpt.z + (nrm.z * Math.cos(ang) + bin.z * Math.sin(ang)) * rr
      ));
    }
    const grooveCurve = new THREE.CatmullRomCurve3(groovePts);
    const grooveGeo = new THREE.TubeGeometry(grooveCurve, 96, 0.18, 6, false);
    spineGrooveMesh = new THREE.Mesh(grooveGeo, makeCurrentMat(0xCBD5E1, 0.38));
    tubeRigGroup.add(spineGrooveMesh);
  }

  // ── 4B. IMPOSING MECHANICAL 4-CLAW DOC OCK HEAD & HIGH-INTENSITY CORE ──
  // Facing directly toward the user (HEAD-ON), enlarged by +55% for dominant centerpiece presence!
  const clawHeadGroup = new THREE.Group();
  clawHeadGroup.position.set(0, 1.6, 1.2);
  clawHeadGroup.rotation.set(0.0, 0.0, 0.0); // FACING DIRECTLY FORWARD TOWARD THE VIEWER
  clawHeadGroup.scale.set(1.55, 1.55, 1.55); // 55% LARGER, MENACING, IMPOSING
  tubeRigGroup.add(clawHeadGroup);

  const cuffGeo = new THREE.CylinderGeometry(2.35, 1.75, 1.25, 32);
  const cuffMesh = new THREE.Mesh(cuffGeo, darkSteelMat);
  cuffMesh.rotation.x = Math.PI / 2;
  clawHeadGroup.add(cuffMesh);

  const cuffBevel = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.16, 12, 32), silverTitaniumMat);
  cuffBevel.position.z = 0.62;
  clawHeadGroup.add(cuffBevel);

  // Central Green Plasma Core with Concentric Multi-Layered Optical Bloom Halos
  const eyeBevel = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.22, 20, 32), silverTitaniumMat);
  eyeBevel.position.z = 0.68;
  clawHeadGroup.add(eyeBevel);

  const eyeCore = new THREE.Mesh(new THREE.SphereGeometry(0.80, 28, 28), laserEyeCoreMat);
  eyeCore.position.z = 0.74;
  clawHeadGroup.add(eyeCore);

  const eyeNucleus = new THREE.Mesh(new THREE.SphereGeometry(0.44, 20, 20), laserNucleusMat);
  eyeNucleus.position.z = 0.82;
  clawHeadGroup.add(eyeNucleus);

  // Optical Concentric Additive Bloom Halos (Pure Cinematic Glow Halo)
  const coreInnerBloom = new THREE.Mesh(new THREE.SphereGeometry(1.35, 24, 24), new THREE.MeshBasicMaterial({
    color: 0x7DD3FC,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  coreInnerBloom.position.z = 0.74;
  clawHeadGroup.add(coreInnerBloom);

  const coreOuterCorona = new THREE.Mesh(new THREE.SphereGeometry(2.35, 24, 24), new THREE.MeshBasicMaterial({
    color: 0x5BB8E8,
    transparent: true,
    opacity: 0.32,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  }));
  coreOuterCorona.position.z = 0.74;
  clawHeadGroup.add(coreOuterCorona);

  const flareMesh = new THREE.Mesh(new THREE.RingGeometry(0.75, 1.65, 28), laserBeamMat);
  flareMesh.position.z = 0.78;
  clawHeadGroup.add(flareMesh);

  // High-Intensity Dynamic Core Light (8.5 intensity, 55-unit specular radius)
  const clawRedLight = new THREE.PointLight(0x7DD3FC, 8.5, 55);
  clawRedLight.position.set(0, 0, 1.25);
  clawHeadGroup.add(clawRedLight);

  // ── DEDICATED CYCLOTRON ENERGY SPARKS PARTICLE EMITTER (FIX 2 & BUG 1 FIX) ──
  // Intense cloud of electric sparks and plasma embers swirling and crackling near the claw/core
  const clawSparkCount = 260;
  const clawSparkGeo = new THREE.BufferGeometry();
  const clawSparkPos = new Float32Array(clawSparkCount * 3);
  const clawSparkCol = new Float32Array(clawSparkCount * 3);
  const clawSparkData = [];

  const sparkPalette = [
    new THREE.Color('#ffffff'), // White-hot spark
    new THREE.Color('#ff0055'), // Electric crimson
    new THREE.Color('#ff6600'), // Plasma orange
    new THREE.Color('#ffcc00'), // Hazard gold
    new THREE.Color('#00e5ff')  // Ionized cyan arc
  ];

  for (let sp = 0; sp < clawSparkCount; sp++) {
    const r = 0.4 + Math.random() * 2.8;
    const theta = Math.random() * Math.PI * 2;
    const z = 0.2 + (Math.random() - 0.5) * 2.4;

    clawSparkPos[sp * 3] = Math.cos(theta) * r;
    clawSparkPos[sp * 3 + 1] = Math.sin(theta) * r;
    clawSparkPos[sp * 3 + 2] = z;

    const col = sparkPalette[Math.floor(Math.random() * sparkPalette.length)];
    clawSparkCol[sp * 3] = col.r;
    clawSparkCol[sp * 3 + 1] = col.g;
    clawSparkCol[sp * 3 + 2] = col.b;

    clawSparkData.push({
      radius: r,
      baseRadius: r,
      theta: theta,
      speed: (0.8 + Math.random() * 2.4) * (Math.random() > 0.5 ? 1 : -1),
      z: z,
      zSpeed: (Math.random() - 0.5) * 0.8,
      pulsePhase: Math.random() * Math.PI * 2
    });
  }

  clawSparkGeo.setAttribute('position', new THREE.BufferAttribute(clawSparkPos, 3));
  clawSparkGeo.setAttribute('color', new THREE.BufferAttribute(clawSparkCol, 3));

  const clawSparkMat = new THREE.PointsMaterial({
    size: isMobile ? 0.52 : 0.72,
    map: sparkSpriteTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const clawSparkPoints = new THREE.Points(clawSparkGeo, clawSparkMat);
  clawHeadGroup.add(clawSparkPoints);

  // ── 4C. IMPOSING, ENLARGED 4-CLAW MECHANICAL PINCERS (+50% SCALE) ──
  // 4 Articulated Claws (Top, Right, Bottom, Left - 90 deg spacing)
  const clawPincers = [];
  const clawAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  const mountRadius = 2.05; // Enlarged to 2.05 for imposing reach

  clawAngles.forEach((angle) => {
    const clawRoot = new THREE.Group();
    clawRoot.rotation.z = angle;
    clawHeadGroup.add(clawRoot);

    const clawPivot = new THREE.Group();
    clawPivot.position.set(0, mountRadius, 0.48);
    clawRoot.add(clawPivot);

    // Massive reinforced knuckle bracket (+50% scale)
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.88, 1.10), darkSteelMat);
    bracket.position.set(0, 0, 0.25);
    clawPivot.add(bracket);

    // Heavy Knuckle Pivot Pin
    const knucklePin = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 1.60, 16), industrialBrassMat);
    knucklePin.rotation.z = Math.PI / 2;
    clawPivot.add(knucklePin);

    const bladeGroup = new THREE.Group();
    bladeGroup.position.set(0, 0, 0.52);
    clawPivot.add(bladeGroup);

    // Massive Armored Claw Blade (+50% scale)
    const bladeGeo = new THREE.ConeGeometry(0.92, 4.0, 4);
    const blade = new THREE.Mesh(bladeGeo, darkSteelMat);
    blade.rotation.x = Math.PI / 2;
    blade.position.set(0, -0.28, 2.25);
    blade.scale.set(1.35, 1.85, 1.35);
    bladeGroup.add(blade);

    // Heavy Outer Titanium Armor Carapace (+50% thickness & reach)
    const armorPlate = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.58, 3.20), silverTitaniumMat);
    armorPlate.position.set(0, 0.26, 2.05);
    armorPlate.rotation.x = 0.08;
    bladeGroup.add(armorPlate);

    // Heavy Industrial Rubber Grip Jaw
    const gripPad = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.38, 2.70), blackConduitRubberMat);
    gripPad.position.set(0, -0.34, 1.95);
    bladeGroup.add(gripPad);

    // Dual Heavy Chrome Hydraulic Assist Pistons
    const pL = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 2.00, 12), hydraulicChromeMat);
    pL.position.set(-0.62, 0.22, 1.25);
    pL.rotation.x = Math.PI / 2;
    const pR = pL.clone();
    pR.position.set(0.62, 0.22, 1.25);
    bladeGroup.add(pL, pR);

    // 5 Serrated Brass Gripper Teeth
    for (let t = 0; t < 5; t++) {
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.28, 0.32), industrialBrassMat);
      tooth.position.set(0, -0.42, 0.95 + t * 0.65);
      bladeGroup.add(tooth);
    }

    clawPincers.push({
      root: clawRoot,
      pivot: clawPivot,
      bladeGroup: bladeGroup
    });
  });

  let clawOpenProgress = 1.0; // 1.0 = wide open facing user at hero, 0.0 = clamped shut

  // ── 4C. MECHANICAL CARD HANDLERS (HOLDING EACH CARD IN THE CYLINDER) ──
  // User directive: "it should have some kind of handler holding the cards"
  // Each card is physically held and articulated by a robotic hydraulic boom arm extending from the central spine!
  const cardHandlers = [];
  const cardCountTotal = 6;

  for (let cIdx = 0; cIdx < cardCountTotal; cIdx++) {
    const handlerRoot = new THREE.Group();
    tubeRigGroup.add(handlerRoot);

    // 1. Spine Collar Mount
    const collarGroup = new THREE.Group();
    const colMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.55, 0.65, 24), darkSteelMat);
    colMesh.rotation.x = Math.PI / 2;
    const colRing = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.12, 10, 26), industrialBrassMat);
    collarGroup.add(colMesh, colRing);
    handlerRoot.add(collarGroup);

    // 2. Articulated Hydraulic Boom
    const boomGroup = new THREE.Group();
    // Telescoping Chrome Pistons
    const pistonL = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 1.0, 10), hydraulicChromeMat);
    pistonL.position.x = -0.32;
    const pistonR = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 1.0, 10), hydraulicChromeMat);
    pistonR.position.x = 0.32;
    const boomSleeve = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.35, 0.40), darkSteelMat);
    const elbowJoint = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.42, 0.48), industrialBrassMat);
    const elbowPin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.82, 10), hydraulicChromeMat);
    elbowPin.rotation.z = Math.PI / 2;
    elbowJoint.add(elbowPin);
    boomGroup.add(pistonL, pistonR, boomSleeve, elbowJoint);
    handlerRoot.add(boomGroup);

    // 3. Heavy-Duty Card Clamping Vise (Grips the Top Edge of the Card)
    const clampGroup = new THREE.Group();
    // Transverse mounting bar
    const barMesh = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.42, 0.52), darkSteelMat);
    const barArmor = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.12, 0.56), silverTitaniumMat);
    barArmor.position.y = 0.20;
    clampGroup.add(barMesh, barArmor);

    // Dual Vise Gripper Jaws (pinch the card top edge)
    [-0.88, 0.88].forEach((xOff) => {
      const jawBase = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.72, 0.46), industrialBrassMat);
      jawBase.position.set(xOff, -0.22, 0);
      const padF = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.35, 0.12), blackConduitRubberMat);
      padF.position.set(0, -0.14, 0.18);
      const padB = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.35, 0.12), blackConduitRubberMat);
      padB.position.set(0, -0.14, -0.18);
      jawBase.add(padF, padB);
      clampGroup.add(jawBase);
    });

    // Glowing Cyber Status LED on Clamp
    const clampLedMat = new THREE.MeshBasicMaterial({ color: 0x7DD3FC });
    const clampLed = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.12, 0.16), clampLedMat);
    clampLed.position.set(0, 0.22, 0.22);
    clampGroup.add(clampLed);

    handlerRoot.add(clampGroup);

    cardHandlers.push({
      group: handlerRoot,
      collarGroup: collarGroup,
      boomGroup: boomGroup,
      clampGroup: clampGroup,
      clampLedMat: clampLedMat,
      cardIndex: cIdx
    });
  }

  // 6. True Active Theory 3D Helical Card Spiral (Authentic Portfolio Architecture)
  const cardData = [
    {
      id: 'profile',
      index: '01',
      category: 'IDENTITY & RESEARCH',
      title: 'AARON ALVA',
      subtitle: 'Grade 11 Cybersecurity Researcher',
      desc: 'Grade 11 student and cybersecurity researcher building security automation tools, AST mutation engines, AddressSanitizer harnesses, and vulnerability discovery workflows.',
      badge: 'CYBER RESEARCHER',
      color: '#7DD3FC',
      stats: [
        { k: 'CTF RANK', v: 'TOP 1%' },
        { k: 'ROOMS', v: '91+' },
        { k: 'GFACT', v: '94' },
        { k: 'STACK', v: 'C/PY/ASM' }
      ],
      tags: ['GRADE 11', 'SYSTEMS VR', 'C/PYTHON', 'DOCKER ASAN', 'LINUX']
    },
    {
      id: 'mutagen',
      index: '02',
      category: 'AGENTIC AI / ZERO-DAY FUZZER',
      title: 'MUTAGEN FUZZER',
      subtitle: 'Autonomous AST Fuzzer & Auto-Patcher',
      desc: 'Autonomous 5-phase fuzzer built in Python. Uses LLMs to synthesize semantic edge-case seeds, executes in isolated Docker sandboxes, and verifies ASan crashes.',
      badge: 'ACTIVE PROJECT',
      color: '#FB7185',
      stats: [
        { k: 'CYCLES', v: '14.2K' },
        { k: 'BRANCH COV', v: '88.4%' },
        { k: 'SANDBOX', v: '0-NET' },
        { k: 'TRIAGE', v: 'ASAN' }
      ],
      tags: ['PYTHON', 'LLM AST', 'CLANG API', 'DOCKER', 'ASAN']
    },
    {
      id: 'vigil',
      index: '03',
      category: 'THREAT INTEL & CLI',
      title: 'VIGIL THREAT HUNTER',
      subtitle: 'Automated CVE Correlation CLI',
      desc: 'CLI threat intelligence tool built in Python. Ingests Nmap scans and auth logs, normalizes to CPE 2.3, correlates live NVD v2/OSV CVEs, and exports SARIF v2.1 reports.',
      badge: 'CLI TOOL',
      color: '#67E8F9',
      stats: [
        { k: 'PARSERS', v: '3-WAY' },
        { k: 'NVD FEED', v: 'REST v2' },
        { k: 'OUTPUT', v: 'SARIF' },
        { k: 'POCS', v: 'MINED' }
      ],
      tags: ['PYTHON', 'NVD API v2', 'OSV.DEV', 'SARIF v2.1', 'MITRE ATT&CK']
    },
    {
      id: 'signalhub',
      index: '04',
      category: 'LIVE WEB APP / FIREBASE',
      title: 'SIGNALHUB MARKET AI',
      subtitle: 'Real-Time Data Pipeline & Web App',
      desc: 'Deployed market intelligence platform hosted on Firebase CDN. Streams live exchange WebSocket quotes, normalizes financial news, and evaluates NLP sentiment.',
      badge: 'LIVE WEB APP',
      color: '#C4B5FD',
      stats: [
        { k: 'HOST', v: 'FIREBASE' },
        { k: 'STREAM', v: 'WS LIVE' },
        { k: 'NLP', v: 'TRANSFORM' },
        { k: 'FPS', v: '60 FPS' }
      ],
      tags: ['FIREBASE', 'LIVE API', 'WEBSOCKET', 'TRANSFORMER NLP']
    },
    {
      id: 'tryhackme',
      index: '05',
      category: 'OFFENSIVE PROVING GROUNDS',
      title: 'PROVING GROUNDS',
      subtitle: 'Top 1% Worldwide CTF Ranking',
      desc: 'Ranked in the Top 1% Worldwide out of 3,000,000+ users on TryHackMe across 91+ completed machines, practicing Linux privilege escalation and Active Directory attacks.',
      badge: 'TOP 1% GLOBAL',
      color: '#FCD34D',
      stats: [
        { k: 'RANK', v: 'TOP 1%' },
        { k: 'ROOMS', v: '91+' },
        { k: 'PATHS', v: '100%' },
        { k: 'VECTORS', v: 'AD/PWN' }
      ],
      tags: ['91+ ROOMS', 'TOP 1%', 'PRIVESC', 'ACTIVE DIRECTORY', 'HTB']
    },
    {
      id: 'transmission',
      index: '06',
      category: 'GET IN TOUCH',
      title: 'TRANSMIT SIGNAL',
      subtitle: 'Direct Contact & Inquiries',
      desc: 'Connect with Aaron Alva for cybersecurity research collaborations, vulnerability disclosures, internship opportunities, or general technical inquiries.',
      badge: 'CONTACT',
      color: '#5EEAD4',
      stats: [
        { k: 'ENCRYPT', v: '4096-BIT' },
        { k: 'PGP', v: 'VERIFIED' },
        { k: 'SLA', v: '< 24 HRS' },
        { k: 'INBOX', v: 'DIRECT' }
      ],
      tags: ['AARON ALVA', 'EMAIL', 'RESEARCH', 'COLLABORATION']
    }
  ];

  const cardCount = cardData.length;
  const cardMeshes = [];
  const cardWidth = isMobile ? 7.6 : 8.8;
  const cardHeight = isMobile ? 10.6 : 11.8;
  const verticalStep = isMobile ? 14.0 : 15.5;
  const angleStep = isMobile ? 0.32 : 0.40;

  // Card Texture Generator (Dense Cybernetic Telemetry Design)
  // Card Texture Generator (Dense Cybernetic Telemetry Design - High-Legibility OLED Display)
  function generateCardTexture(data) {
    const w = 1024, h = 1380;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const col = data.color || '#7DD3FC';

    // 1. High-Density Frosted Obsidian Glass Base (Blocks background metal bleed-through)
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, 'rgba(8, 14, 26, 0.96)');
    bgGrad.addColorStop(0.3, 'rgba(5, 9, 20, 0.93)');
    bgGrad.addColorStop(0.7, 'rgba(6, 11, 22, 0.93)');
    bgGrad.addColorStop(1, 'rgba(10, 16, 30, 0.96)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Circuit Board Trace Pattern (subtle cyber background)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
    ctx.lineWidth = 1.5;
    for (let cy = 120; cy < h - 160; cy += 60) {
      ctx.beginPath();
      ctx.moveTo(40, cy);
      const jx = 40 + Math.random() * 200;
      ctx.lineTo(jx, cy);
      ctx.lineTo(jx, cy + (Math.random() > 0.5 ? 30 : -30));
      ctx.lineTo(jx + 80 + Math.random() * 150, cy + (Math.random() > 0.5 ? 30 : -30));
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.beginPath();
      ctx.arc(jx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Subtle Holographic Scanline Overlay
    for (let sy = 0; sy < h; sy += 6) {
      ctx.fillStyle = sy % 12 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.02)';
      ctx.fillRect(0, sy, w, 3);
    }

    // 4. Corner Bracket Accents (all 4 corners in neon accent)
    ctx.strokeStyle = col;
    ctx.lineWidth = 7;
    const cornerLen = 85;
    // Top-left
    ctx.beginPath(); ctx.moveTo(18, 18 + cornerLen); ctx.lineTo(18, 18); ctx.lineTo(18 + cornerLen, 18); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(w - 18 - cornerLen, 18); ctx.lineTo(w - 18, 18); ctx.lineTo(w - 18, 18 + cornerLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(18, h - 18 - cornerLen); ctx.lineTo(18, h - 18); ctx.lineTo(18 + cornerLen, h - 18); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(w - 18 - cornerLen, h - 18); ctx.lineTo(w - 18, h - 18); ctx.lineTo(w - 18, h - 18 - cornerLen); ctx.stroke();

    // Inner bright cyber border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 2;
    ctx.strokeRect(30, 30, w - 60, h - 60);

    // 5. Colored Glow Strip at Top
    const topGlow = ctx.createLinearGradient(0, 0, w, 0);
    topGlow.addColorStop(0, 'rgba(0,0,0,0)');
    topGlow.addColorStop(0.2, col);
    topGlow.addColorStop(0.8, col);
    topGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 10);

    // 6. Index & Category Eyebrow (Vibrant & Bold)
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.fillText(`[ ${data.index} // ${data.category} ]`, 54, 76);
    ctx.shadowBlur = 0;

    // 7. Badge Pill (Curved Capsule with High-Contrast Text)
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    const badgeW = ctx.measureText(data.badge).width + 36;
    const badgeX = w - badgeW - 50;
    ctx.fillStyle = 'rgba(255, 20, 50, 0.35)';
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(badgeX, 46, badgeW, 44, 22);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(data.badge, badgeX + 18, 76);

    // 8. Large High-Legibility Title with Glow + Crisp White Core
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 32;
    ctx.font = '900 68px "Outfit", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(data.title, 54, 195);
    ctx.shadowBlur = 0;
    ctx.fillText(data.title, 54, 195);
    ctx.restore();

    // Subtitle
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.fillText(data.subtitle, 54, 248);

    // 9. Gradient Divider Line
    const divGrad = ctx.createLinearGradient(54, 0, w - 54, 0);
    divGrad.addColorStop(0, col);
    divGrad.addColorStop(0.7, 'rgba(255,255,255,0.4)');
    divGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(54, 282); ctx.lineTo(w - 54, 282); ctx.stroke();

    // 10. High-Contrast Frosted Text Plate (Guarantees 100% Letter Legibility for Hiring Managers)
    ctx.fillStyle = 'rgba(3, 7, 16, 0.90)';
    ctx.strokeStyle = col + '55';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(44, 298, w - 88, 560, 16);
    ctx.fill();
    ctx.stroke();

    // Body Description (Heavy Weight Pure White for Maximum Legibility)
    ctx.font = '600 30px "Outfit", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const words = data.desc.split(' ');
    let line = '', lineY = 356;
    const maxLineW = w - 120;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line, 64, lineY);
        line = words[n] + ' ';
        lineY += 46;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 64, lineY);

    // 10b. 4-Element Telemetry Metrics Grid on 3D Card (Clean Rounded Glass Boxes)
    if (data.stats && data.stats.length === 4) {
      const statBoxY = lineY + 36;
      const statBoxW = (w - 128 - 36) / 4;
      data.stats.forEach((st, sIdx) => {
        const sx = 64 + sIdx * (statBoxW + 12);
        ctx.fillStyle = 'rgba(5, 12, 24, 0.96)';
        ctx.strokeStyle = col + '88';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(sx, statBoxY, statBoxW, 76, 10);
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 16px "JetBrains Mono", monospace';
        ctx.fillStyle = '#A4B8D0'; // Crisp slate
        ctx.textAlign = 'center';
        ctx.fillText(st.k, sx + statBoxW / 2, statBoxY + 28);

        ctx.font = '900 26px "Outfit", sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(st.v, sx + statBoxW / 2, statBoxY + 60);
        ctx.textAlign = 'left';
      });
    }

    // 11. Tags with Vibrant Rounded Pill Capsules
    let tagX = 54, tagY = lineY + 165;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    data.tags.forEach(t => {
      const tagW = ctx.measureText(t).width + 38;
      if (tagX + tagW > w - 54) { tagX = 54; tagY += 56; }
      ctx.fillStyle = 'rgba(0, 26, 16, 0.94)';
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(tagX, tagY, tagW, 44, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(t, tagX + 19, tagY + 30);
      tagX += tagW + 14;
    });

    // 12. Bottom Action Bar with Glowing Border & Bold White Callout
    const barY = h - 130;
    const barGrad = ctx.createLinearGradient(54, barY, w - 54, barY);
    barGrad.addColorStop(0, 'rgba(0, 32, 20, 0.95)');
    barGrad.addColorStop(1, 'rgba(8, 16, 28, 0.95)');
    ctx.fillStyle = barGrad;
    ctx.strokeStyle = col;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(54, barY, w - 108, 72, 16);
    ctx.fill();
    ctx.stroke();
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('[ CLICK CARD TO OPEN DOSSIER & ARCHITECTURE ]', 82, barY + 45);
    // Arrow icon
    ctx.font = 'bold 32px sans-serif';
    ctx.fillStyle = col;
    ctx.fillText('↗', w - 105, barY + 48);

    // 13. Faint Hex Grid watermark at bottom-right
    ctx.globalAlpha = 0.05;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    for (let hx = w - 320; hx < w - 30; hx += 32) {
      for (let hy = h - 320; hy < h - 150; hy += 28) {
        const offset = (Math.floor((hy - (h - 320)) / 28) % 2) * 16;
        ctx.beginPath();
        for (let p = 0; p < 6; p++) {
          const angle = (Math.PI / 3) * p - Math.PI / 6;
          const px = hx + offset + Math.cos(angle) * 14;
          const py = hy + Math.sin(angle) * 14;
          if (p === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1.0;

    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    return tex;
  }

  // Create Subdivided 32x40 3D Card Meshes (Active Theory Cyber Jello Geometry)
  const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight, 32, 40);

  cardData.forEach((data, i) => {
    const tex = generateCardTexture(data);
    // Self-Illuminating OLED Material: Emissive map radiates light from within so text never dims
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      emissive: new THREE.Color(0xffffff),
      emissiveMap: tex,
      emissiveIntensity: 0.88,
      transparent: true,
      opacity: 0.98,
      roughness: 0.95,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // Uniforms for cyber jello fluid splitting & elastic spring recovery
    const jelloUniforms = {
      uPointerUV: { value: new THREE.Vector2(-999, -999) },
      uPointerActive: { value: 0.0 },
      uJelloTime: { value: 0.0 }
    };

    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uPointerUV = jelloUniforms.uPointerUV;
      shader.uniforms.uPointerActive = jelloUniforms.uPointerActive;
      shader.uniforms.uJelloTime = jelloUniforms.uJelloTime;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `#include <common>
        uniform vec2 uPointerUV;
        uniform float uPointerActive;
        uniform float uJelloTime;`
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_UV
        if (uPointerActive > 0.001) {
          float d = distance(uv, uPointerUV);
          float radius = 0.38;
          if (d < radius) {
            float norm = d / radius;
            float factor = (1.0 - norm) * uPointerActive;
            // Radial fluid splitting / parting away from pointer
            vec2 splitDir = normalize(uv - uPointerUV + vec2(0.0001, 0.0001));
            transformed.x += splitDir.x * factor * 0.75;
            transformed.y += splitDir.y * factor * 0.75;
            // Tactile fluid ripple wave along Z
            float wave = sin(norm * 14.0 - uJelloTime * 7.0) * exp(-norm * 2.8);
            transformed.z += wave * factor * 0.45;
          }
        }
        #endif`
      );
    };

    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.userData = {
      cardIndex: i,
      cardId: data.id,
      cardData: data,
      isHovered: false,
      jelloUniforms: jelloUniforms,
      targetActive: 0.0
    };

    // Clean, unobstructed card face stationed rigidly inside tubeRigGroup
    mesh.position.set(0, -(i + 1) * stepY, -(i + 1) * stepZ);
    tubeRigGroup.add(mesh);
    cardMeshes.push(mesh);
  });

  // ── VOLUMETRIC CYBER GAS PARTICLE CLOUD (Puff / Plasma Mist) ──
  const gasParticleCount = 180;
  const gasGeo = new THREE.BufferGeometry();
  const gasPositions = new Float32Array(gasParticleCount * 3);
  const gasColors = new Float32Array(gasParticleCount * 3);
  const gasSizes = new Float32Array(gasParticleCount);
  const gasVelocities = [];

  for (let g = 0; g < gasParticleCount; g++) {
    gasPositions[g * 3] = 0;
    gasPositions[g * 3 + 1] = 0;
    gasPositions[g * 3 + 2] = 0;
    gasColors[g * 3] = 0.0;
    gasColors[g * 3 + 1] = 1.0;
    gasColors[g * 3 + 2] = 0.4;
    gasSizes[g] = 1.8 + Math.random() * 2.5;

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.04 + Math.random() * 0.09;
    gasVelocities.push({
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      vz: (Math.random() - 0.5) * speed * 0.6,
      baseSpeed: speed,
      angle: angle,
      life: 0.0
    });
  }
  gasGeo.setAttribute('position', new THREE.BufferAttribute(gasPositions, 3));
  gasGeo.setAttribute('color', new THREE.BufferAttribute(gasColors, 3));
  gasGeo.setAttribute('size', new THREE.BufferAttribute(gasSizes, 1));

  function createGasCloudTexture() {
    const gc = document.createElement('canvas');
    gc.width = 128; gc.height = 128;
    const gctx = gc.getContext('2d');
    const gGrad = gctx.createRadialGradient(64, 64, 4, 64, 64, 64);
    gGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    gGrad.addColorStop(0.2, 'rgba(255, 255, 255, 0.65)');
    gGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
    gGrad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');
    gctx.fillStyle = gGrad;
    gctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(gc);
  }

  const gasMaterial = new THREE.PointsMaterial({
    size: 3.5,
    map: createGasCloudTexture(),
    vertexColors: true,
    transparent: true,
    opacity: 0.0,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const gasCloud = new THREE.Points(gasGeo, gasMaterial);
  gasCloud.visible = false;
  rootGroup.add(gasCloud);

  let gasBurstActive = false;
  let gasBurstTime = 0;
  let gasBurstColor = new THREE.Color(0x7DD3FC);

  function triggerGasBurst(cardColorHex, originPos) {
    gasBurstActive = true;
    gasBurstTime = 0;
    gasBurstColor.set(cardColorHex || '#7DD3FC');
    gasCloud.visible = true;
    gasCloud.position.copy(originPos || new THREE.Vector3(0, 0, 0));

    const posAttr = gasGeo.attributes.position;
    const colAttr = gasGeo.attributes.color;
    for (let g = 0; g < gasParticleCount; g++) {
      const r = 0.4 + Math.random() * 2.2;
      const theta = Math.random() * Math.PI * 2;
      posAttr.setXYZ(g, Math.cos(theta) * r, Math.sin(theta) * r, (Math.random() - 0.5) * 0.8);
      colAttr.setXYZ(g, gasBurstColor.r, gasBurstColor.g, gasBurstColor.b);
      gasVelocities[g].life = 1.0;
    }
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  // 7. Scroll Physics & Smooth Damping Engine
  let scrollProgress = 0;
  let targetScroll = 0;
  let scrollVelocity = 0;
  let activeCardIndex = 0;
  let isDragging = false;
  let dragStartY = 0;
  let dragStartX = 0;
  let dragStartProgress = 0;
  let totalDragDistance = 0;
  let dragHasMoved = false;

  window.addEventListener('wheel', (e) => {
    if (document.body.classList.contains('in-deep-dive')) return;
    const delta = e.deltaY * 0.0018;
    scrollVelocity += delta;
  }, { passive: true });

  window.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.interactive-ui') || document.body.classList.contains('in-deep-dive')) return;
    isDragging = true;
    dragStartY = e.clientY;
    dragStartX = e.clientX;
    dragStartProgress = scrollProgress;
    totalDragDistance = 0;
    dragHasMoved = false;
  });

  window.addEventListener('pointermove', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
    if (isDragging) {
      const deltaY = dragStartY - e.clientY;
      const deltaX = dragStartX - e.clientX;
      totalDragDistance = Math.hypot(deltaX, deltaY);
      if (totalDragDistance > 12) {
        dragHasMoved = true;
      }
      const dragSensitivity = isMobile ? 0.0055 : 0.004;
      targetScroll = Math.max(0, Math.min(6.0, dragStartProgress + deltaY * dragSensitivity));
    }
  });

  window.addEventListener('pointerup', () => {
    isDragging = false;
    setTimeout(() => {
      totalDragDistance = 0;
      dragHasMoved = false;
    }, 80);
  });
  window.addEventListener('pointercancel', () => {
    isDragging = false;
    totalDragDistance = 0;
    dragHasMoved = false;
  });

  // Camera Zoom & Deep Dive Transition Engine (Active Theory Style)
  let isDeepDiveActive = false;
  let targetCameraZ = 24;
  let targetCameraY = 0;
  let deepDiveTransitionTarget = 0; // particles scatter target (0 normal, 1 exploded)
  let deepDiveCardIndex = -1;
  let deepDiveProgress = 0; // 0 normal orbit, 1 fully expanded to fullscreen
  let cardEmissiveGlow = 0; // extra flash on transition

  // deepDiveProgress is driven by a GSAP tween (see the two trigger functions
  // below) rather than a fixed-rate per-frame lerp, so opening/closing get an
  // authored, directed feel instead of a constant-speed settle. deepDiveDriver
  // is the plain object GSAP actually tweens; onUpdate writes back into
  // deepDiveProgress so every downstream consumer in render() is unchanged.
  const deepDiveDriver = { p: 0 };
  let deepDiveTween = null;

  // ── ACTIVE THEORY TRUE ORBITAL CAMERA STATE (ISSUE 2) ──
  let currentOrbitAzimuth = 0.0;
  let currentOrbitElevation = 0.0;
  let targetOrbitAzimuth = 0.0;
  let targetOrbitElevation = 0.0;
  const heroAnchor = new THREE.Vector3(0, 1.6, 1.2);
  const heroCamPos = new THREE.Vector3(0, 0, 24);
  const cardCamPos = new THREE.Vector3(0, 0, 24);
  const heroLookTarget = new THREE.Vector3(0, 1.6, 1.2);
  const cardLookTarget = new THREE.Vector3(0, 0, 0);
  const camLookTarget = new THREE.Vector3(0, 0, 0);
  const _cardLookQuat = new THREE.Quaternion();
  const _cardStationQuat = new THREE.Quaternion();

  // ── Cinematic per-card "shot" layer ──
  // Small authored offsets that blend on top of the procedural orbit as each
  // card arrives at center, so an arrival feels like a composed shot rather
  // than a continuous drift. Purely additive: shotOffset defaults to all
  // zeros, so if GSAP fails to load (or this timeline is ever removed) the
  // base orbit renders completely unchanged — nothing here is load-bearing.
  //
  // No native ScrollTrigger scroll detection is used or needed: this page has
  // no real DOM scroll for it to attach to (html/body are overflow:hidden).
  // The timeline is authored with each shot's time position equal to its
  // card's scroll station (card i centers at scrollProgress = i+1), then
  // scrubbed every frame with cinematicTimeline.time(scrollProgress) — a
  // direct, unnormalized mapping, not .progress(), since positions were
  // authored in raw scroll units rather than a 0-1 fraction.
  const shotOffset = { x: 0, y: 0, z: 0, lookX: 0, lookY: 0, lookZ: 0 };
  let cinematicTimeline = null;
  if (typeof gsap !== 'undefined') {
    cinematicTimeline = gsap.timeline({ paused: true });
    const SHOT_WINDOW = 0.4; // scroll-units either side of a station the shot occupies
    const SHOT_PEAK = { x: 0, y: 0.12, z: -0.9, lookX: 0, lookY: 0.18, lookZ: 0 };
    for (let i = 0; i < cardCount; i++) {
      const station = i + 1;
      cinematicTimeline
        .to(shotOffset, { ...SHOT_PEAK, duration: SHOT_WINDOW, ease: 'cinematicFlow' }, station - SHOT_WINDOW)
        .to(shotOffset, { x: 0, y: 0, z: 0, lookX: 0, lookY: 0, lookZ: 0, duration: SHOT_WINDOW, ease: 'cinematicSilk' }, station);
    }
  }

  window.triggerActiveTheoryCardDeepDive = function(cardId) {
    if (isDeepDiveActive) return;
    let targetIdx = activeCardIndex;
    if (cardId) {
      const foundIdx = cardData.findIndex(c => c.id === cardId);
      if (foundIdx !== -1) targetIdx = foundIdx;
    }
    if (targetIdx < 0 || targetIdx >= cardCount) targetIdx = 0;

    deepDiveCardIndex = targetIdx;
    isDeepDiveActive = true;
    deepDiveTransitionTarget = 1;
    targetCameraZ = 18.0;
    cardEmissiveGlow = 1.0;

    if (typeof gsap !== 'undefined') {
      if (deepDiveTween) deepDiveTween.kill();
      deepDiveTween = gsap.to(deepDiveDriver, {
        p: 1,
        duration: 0.85,
        ease: 'cinematicArrive',
        onUpdate: () => { deepDiveProgress = deepDiveDriver.p; }
      });
    }

    // Trigger Atmospheric Volumetric Cyber Gas Particle Burst
    const activeColor = (cardData[targetIdx] && cardData[targetIdx].color) ? cardData[targetIdx].color : '#7DD3FC';
    const cardObj = cardMeshes[targetIdx];
    const cardPos = cardObj ? cardObj.position.clone() : new THREE.Vector3(0, 0, 0);
    triggerGasBurst(activeColor, cardPos);

    // Trigger Cyber Audio SFX if available
    if (typeof window.playCyberSFX === 'function') {
      window.playCyberSFX('warpTransition');
    }

    // Open active theory drawer safely (single source of truth)
    if (typeof window.openActiveTheoryDrawer === 'function') {
      window.openActiveTheoryDrawer(cardData[targetIdx].id);
    }
  };

  window.closeActiveTheoryDeepDive = function() {
    isDeepDiveActive = false;
    deepDiveTransitionTarget = 0;
    targetCameraZ = 24;
    // CRITICAL FIX: DO NOT reset targetCameraY to 0, which desynchronized camera during card browsing!
    cardEmissiveGlow = 0.5;

    if (typeof gsap !== 'undefined') {
      if (deepDiveTween) deepDiveTween.kill();
      deepDiveTween = gsap.to(deepDiveDriver, {
        p: 0,
        duration: 0.65,
        ease: 'cinematicSilk',
        onUpdate: () => { deepDiveProgress = deepDiveDriver.p; }
      });
    }

    // Trigger Cyber Audio SFX
    if (typeof window.playCyberSFX === 'function') {
      window.playCyberSFX('portalClose');
    }
  };

  // Direct Fast-Travel & Deep-Dive from Sidebar
  window.handleSidebarCardClick = function(index) {
    if (index < 0 || index >= cardCount) return;
    targetScroll = index + 1;
    scrollVelocity = 0;
    activeCardIndex = index;
    window.dispatchEvent(new CustomEvent('activetheory-card-active', { detail: cardData[index] }));
    const cardId = cardData[index]?.id;
    if (cardId) {
      window.triggerActiveTheoryCardDeepDive(cardId);
    }
  };

  window.rotateCylinderToCard = function(index) {
    if (index < 0 || index > cardCount) return;
    targetScroll = index; // 0 = hero, 1 = card 1, etc.
    scrollVelocity = 0;
    if (index > 0) {
      activeCardIndex = index - 1;
      window.dispatchEvent(new CustomEvent('activetheory-card-active', { detail: cardData[activeCardIndex] }));
    } else {
      activeCardIndex = -1;
      window.dispatchEvent(new CustomEvent('activetheory-card-active', { detail: { isHero: true } }));
    }
  };

  window.setPortfolioScrollProgress = function(progress) {
    targetScroll = Math.max(0, Math.min(6.0, progress));
    scrollVelocity = 0;
  };

  // Raycaster for Card Hover & Click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(0, 0);
  // Damped copy of the pointer. Card parallax reads this instead of `mouse`
  // directly, so fast cursor movement can't snap card rotation frame-to-frame.
  const smoothMouse = new THREE.Vector2(0, 0);
  const raycastCoords = new THREE.Vector2(-999, -999);
  let hasUserInteractedPointer = false;
  let hoveredCard = null;

  function updatePointerCoords(clientX, clientY) {
    hasUserInteractedPointer = true;
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;
    raycastCoords.x = mouse.x;
    raycastCoords.y = mouse.y;
  }

  window.addEventListener('mousemove', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
  });

  window.addEventListener('click', (e) => {
    if (document.body.classList.contains('in-deep-dive')) return;
    if (dragHasMoved || totalDragDistance > 12) return;
    if (e.target.closest('.interactive-ui') || e.target.closest('.at-drawer') || e.target.closest('button') || e.target.closest('a')) return;

    updatePointerCoords(e.clientX, e.clientY);
    raycaster.setFromCamera(raycastCoords, camera);
    const intersects = raycaster.intersectObjects(cardMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const cardId = hit.userData.cardId;
      const idx = hit.userData.cardIndex;
      window.rotateCylinderToCard(idx + 1);
      if (typeof window.triggerActiveTheoryCardDeepDive === 'function') {
        window.triggerActiveTheoryCardDeepDive(cardId);
      }
    }
  });

  // 9. Window Resize
  window.addEventListener('resize', () => {
    const isNowMobile = window.innerWidth < 768;
    camera.fov = isNowMobile ? 65 : 46;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  // 10. Master Animation & Render Loop with Adaptive Watchdog
  let lastTime = performance.now();
  let frameCount = 0;
  let fpsWindowStart = performance.now();
  let adaptiveLodSteppedDown = false;
  let isTabVisible = true;

  document.addEventListener('visibilitychange', () => {
    isTabVisible = !document.hidden;
  });

  function render(now) {
    requestAnimationFrame(render);
    if (!isTabVisible) return;

    // 60-frame adaptive performance monitor
    frameCount++;
    if (frameCount % 60 === 0) {
      const elapsed = now - fpsWindowStart;
      const rollingFps = (60 * 1000) / Math.max(1, elapsed);
      fpsWindowStart = now;
      if (rollingFps < 42 && !adaptiveLodSteppedDown) {
        adaptiveLodSteppedDown = true;
        renderer.setPixelRatio(1.0);
        if (entangleLines) entangleLines.visible = false;
      }
    }

    const delta = (now - lastTime) * 0.001;
    lastTime = now;
    const timeVal = now * 0.001;

    // Damp the pointer once per frame; all parallax reads smoothMouse.
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;

    // Scroll Physics & Boundary Clamping (0.0 Hero -> 8.0 Card 08)
    if (!isDragging && !isDeepDiveActive) {
      targetScroll += scrollVelocity;
      scrollVelocity *= 0.90;
      if (Math.abs(scrollVelocity) < 0.0001) scrollVelocity = 0;

      // Snap-to-card: once the flick has spent itself, ease onto the nearest
      // station (cards sit at integer scroll positions) so the user lands on a
      // card instead of drifting between two. Dead zone keeps it from fighting
      // a still-moving gesture or nudging an already-centred card.
      if (Math.abs(scrollVelocity) < 0.0025) {
        const nearestStation = Math.round(targetScroll);
        const offset = nearestStation - targetScroll;
        if (Math.abs(offset) > 0.002) {
          targetScroll += offset * 0.08;
        } else {
          targetScroll = nearestStation;
        }
      }
    }
    targetScroll = Math.max(0, Math.min(6.0, targetScroll));
    scrollProgress += (targetScroll - scrollProgress) * 0.12;
    if (cinematicTimeline) cinematicTimeline.time(scrollProgress);

    // ── FIRST-PERSON DESCENT CAMERA ──
    // The machine stays world-anchored. Scroll moves the viewer: orbit the claw, then
    // walk around/down the column so new cards come into view along the path.
    const stationAngles = [0.22, -0.28, 0.30, -0.30, 0.28, -0.22];

    const pointerAzim = (hasUserInteractedPointer ? mouse.x : 0) * (isMobile ? 0.55 : 0.85);
    const pointerElev = (hasUserInteractedPointer ? mouse.y : 0) * (isMobile ? 0.30 : 0.45);
    const driftAzim = Math.sin(timeVal * 0.32) * 0.12 + Math.sin(timeVal * 0.72) * 0.05;
    const driftElev = Math.cos(timeVal * 0.26) * 0.06 + Math.sin(timeVal * 0.52) * 0.03;
    const idleRoll = Math.sin(timeVal * 0.20) * 0.010;

    const pathY = -scrollProgress * stepY;
    const pathZ = -scrollProgress * stepZ;
    const descentAzim = scrollProgress * (isMobile ? 0.38 : 0.52);
    const descentElev = THREE.MathUtils.lerp(0.08, -0.16, Math.min(1.0, scrollProgress / 2.4));

    targetOrbitAzimuth = pointerAzim + driftAzim + descentAzim;
    targetOrbitElevation = THREE.MathUtils.clamp(descentElev + pointerElev + driftElev, -0.55, 0.48);

    currentOrbitAzimuth += (targetOrbitAzimuth - currentOrbitAzimuth) * 0.055;
    currentOrbitElevation += (targetOrbitElevation - currentOrbitElevation) * 0.055;

    const orbitR = targetCameraZ;
    const cosElev = Math.cos(currentOrbitElevation);
    const sinElev = Math.sin(currentOrbitElevation);
    const sinAzim = Math.sin(currentOrbitAzimuth);
    const cosAzim = Math.cos(currentOrbitAzimuth);

    heroAnchor.set(0, 1.6 + pathY, 1.2 + pathZ);
    camera.position.set(
      heroAnchor.x + orbitR * sinAzim * cosElev + shotOffset.x,
      heroAnchor.y + orbitR * sinElev + shotOffset.y,
      heroAnchor.z + orbitR * cosAzim * cosElev + shotOffset.z
    );

    // Look along the machine: claw at rest, then a point slightly ahead down the spine
    const lookAhead = Math.min(1.0, scrollProgress * 0.85);
    camLookTarget.set(
      Math.sin(currentOrbitAzimuth) * 1.15 + shotOffset.lookX,
      1.6 + pathY - lookAhead * stepY * 0.28 + shotOffset.lookY,
      1.2 + pathZ - lookAhead * stepZ * 0.12 + shotOffset.lookZ
    );
    camera.lookAt(camLookTarget);
    camera.rotation.z += idleRoll * Math.max(0.0, 1.0 - scrollProgress * 0.18);

    // Deep-dive progress is normally driven by the GSAP tweens in
    // triggerActiveTheoryCardDeepDive / closeActiveTheoryDeepDive (their
    // onUpdate writes into deepDiveProgress). This is only a fallback for the
    // rare case the GSAP CDN failed to load, so opening/closing still work.
    if (typeof gsap === 'undefined') {
      const targetProg = isDeepDiveActive ? 1.0 : 0.0;
      deepDiveProgress += (targetProg - deepDiveProgress) * 0.10;
    }
    cardEmissiveGlow *= 0.92;

    // Raycast for Hovered 3D Card (only active when cards are visible and user has interacted with pointer)
    if (scrollProgress >= 0.4 && deepDiveProgress < 0.1 && hasUserInteractedPointer) {
      raycaster.setFromCamera(raycastCoords, camera);
      const intersects = raycaster.intersectObjects(cardMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0];
        const hitMesh = hit.object;
        if (hitMesh.userData.jelloUniforms && hit.uv) {
          hitMesh.userData.jelloUniforms.uPointerUV.value.copy(hit.uv);
          hitMesh.userData.targetActive = 1.0;
        }
        if (hoveredCard !== hitMesh) {
          if (hoveredCard) hoveredCard.userData.isHovered = false;
          hoveredCard = hitMesh;
          hoveredCard.userData.isHovered = true;
          document.body.style.cursor = 'pointer';
          if (typeof window.playCyberSFX === 'function') {
            window.playCyberSFX('hover');
          }
        }
      } else {
        if (hoveredCard) {
          hoveredCard.userData.isHovered = false;
          hoveredCard = null;
          document.body.style.cursor = 'auto';
        }
      }
    } else {
      if (hoveredCard) {
        hoveredCard.userData.isHovered = false;
        hoveredCard = null;
        document.body.style.cursor = 'auto';
      }
    }

    // Position Cards in Unified tubeRigGroup with Full Active Theory Transition
    let closestIndex = -1;
    let minDistance = Infinity;

    cardMeshes.forEach((mesh) => {
      const i = mesh.userData.cardIndex;
      const targetCardScroll = i + 1; // Card 0 activates at scrollProgress = 1.0
      const relPos = targetCardScroll - scrollProgress;
      const distToCenter = Math.abs(relPos);

      const baseY = -(i + 1) * stepY;
      const baseZ = -(i + 1) * stepZ;
      const hoverPopZ = mesh.userData.isHovered ? 1.5 : 0.0;

      if (scrollProgress >= 0.4 && distToCenter < minDistance) {
        minDistance = distToCenter;
        closestIndex = i;
      }

      const isThisDeepDiveCard = (i === deepDiveCardIndex);

      if (isThisDeepDiveCard && deepDiveProgress > 0.001) {
        // Morph selected card directly forward into full viewport plane
        const p = deepDiveProgress;
        const smoothP = p * p * (3 - 2 * p); // smooth cubic hermite ease

        const curX = THREE.MathUtils.lerp(0, camera.position.x * 0.12, smoothP);
        const curY = THREE.MathUtils.lerp(baseY, camera.position.y, smoothP);
        const curZ = THREE.MathUtils.lerp(baseZ, camera.position.z - 8.5, smoothP);

        mesh.position.set(curX, curY, curZ);

        // Rotation: smoothly un-tilt to face camera straight-on
        const curRotY = THREE.MathUtils.lerp(0, 0, smoothP);
        const curRotX = THREE.MathUtils.lerp(-mouse.y * 0.12, 0, smoothP);
        mesh.rotation.set(curRotX, curRotY, 0);

        // Scale up towards full screen
        const baseScale = Math.max(0.70, 1.0 - distToCenter * 0.12);
        const curScale = THREE.MathUtils.lerp(baseScale, 1.45, smoothP);
        mesh.scale.set(curScale, curScale, curScale);

        mesh.material.opacity = Math.max(0.0, 0.95 - smoothP * 1.2);
        mesh.visible = mesh.material.opacity > 0.01;
      } else {
        // ── ANCHOR CARDS FIRMLY AT DOCKING STATIONS ("CARDS LOOK IN PLACE") ──
        // The cards remain mounted at their stations along the cybernetic column,
        // while the camera performs the dynamic orbital flyby around them!
        const stationAngle = stationAngles[i] || 0.0;
        const orbitRadius = isMobile ? 12.0 : 14.8;

        const cardLocalX = Math.sin(stationAngle) * orbitRadius;
        const cardLocalY = baseY - 0.75;
        const cardLocalZ = baseZ - 7.5 + Math.cos(stationAngle) * orbitRadius;

        mesh.position.set(cardLocalX, cardLocalY, cardLocalZ + hoverPopZ);
        mesh.renderOrder = 20;

        // Base station orientation: tilted to align with the cylinder tangent and face the camera corridor.
        // Hover parallax is damped twice over: the pointer itself is smoothed (smoothMouse), and the
        // hovered/not-hovered state is eased through hoverWeight instead of flipping 0<->1 on a boolean,
        // which is what previously made cards snap and visibly warp as the cursor crossed a hit boundary.
        const hoverTarget = (hasUserInteractedPointer && mesh.userData.isHovered) ? 1 : 0;
        if (mesh.userData.hoverWeight === undefined) mesh.userData.hoverWeight = 0;
        mesh.userData.hoverWeight += (hoverTarget - mesh.userData.hoverWeight) * 0.10;
        const hoverWeight = mesh.userData.hoverWeight;

        const parallaxX = smoothMouse.x * (isMobile ? 0.06 : 0.12) * hoverWeight;
        const parallaxY = -smoothMouse.y * (isMobile ? 0.05 : 0.10) * hoverWeight;

        // Assigned absolutely (not lerped) on purpose: the focus block below reads
        // mesh.quaternion, runs lookAt() and slerps it. Lerping rotation here would
        // make each frame start from that slerped result and fight the focus blend.
        // Smoothness comes from the damped inputs above, which is where the jitter was.
        mesh.rotation.x = parallaxY;
        mesh.rotation.y = -stationAngle * 0.82 + parallaxX;
        mesh.rotation.z = (i % 2 === 0 ? 0.025 : -0.025) - parallaxX * 0.10;

        const focusWeight = Math.max(0.0, 1.0 - Math.pow(Math.min(1.6, distToCenter) / 0.85, 1.4));
        if (focusWeight > 0.02) {
          _cardStationQuat.copy(mesh.quaternion);
          mesh.lookAt(camera.position);
          _cardLookQuat.copy(mesh.quaternion);
          mesh.quaternion.copy(_cardStationQuat).slerp(_cardLookQuat, focusWeight);
        }

        const heroFade = Math.max(0.0, Math.min(1.0, (scrollProgress - 0.06) / 0.55));

        // Incoming cards stay visible down the column so the descent reads as discovery.
        let cardStageAlpha = 0.0;
        if (relPos >= -0.38 && relPos <= 2.15) {
          if (relPos < 0) {
            cardStageAlpha = Math.max(0.0, 1.0 - Math.pow(Math.abs(relPos) / 0.38, 1.8));
          } else {
            cardStageAlpha = Math.max(0.0, 1.0 - Math.pow(relPos / 2.15, 1.25));
          }
        }
        let opacity = cardStageAlpha * heroFade;
        
        // Fade out non-selected cards during deep dive
        if (deepDiveProgress > 0.001) {
          opacity *= (1.0 - deepDiveProgress * 0.95);
        }

        mesh.material.opacity = opacity;
        mesh.visible = opacity > 0.008;

        const maxScale = isMobile ? 0.90 : 0.84;
        const scale = Math.max(0.68, maxScale - distToCenter * 0.08);
        mesh.scale.set(scale, scale, scale);
      }

      // ── CYBER JELLO FLUID SPRING RESTORATION ──
      const ju = mesh.userData.jelloUniforms;
      if (ju) {
        const target = mesh.userData.targetActive || 0.0;
        ju.uPointerActive.value += (target - ju.uPointerActive.value) * 0.14;
        ju.uJelloTime.value = timeVal;
        mesh.userData.targetActive = 0.0; // Decay target active back to 0 unless re-triggered by hover
      }
    });

    // ── UPDATE MECHANICAL CARD HANDLERS (HOLDING EACH CARD IN THE CYLINDER) ──
    cardHandlers.forEach((handler, hIdx) => {
      const mesh = cardMeshes[hIdx];
      if (!mesh || !mesh.visible || mesh.material.opacity < 0.02) {
        handler.group.visible = false;
        return;
      }
      handler.group.visible = true;

      const baseZ = -(hIdx + 1) * stepZ;
      // Card top-center edge in local space of tubeRigGroup
      const halfH = (isMobile ? 10.6 : 11.8) * 0.48;
      const topLocal = new THREE.Vector3(0, halfH, 0);
      const clampPos = topLocal.clone().applyQuaternion(mesh.quaternion).add(mesh.position);

      // Spine collar mount position on central column (x = 0, z = baseZ - 7.5)
      const spinePos = new THREE.Vector3(0, mesh.position.y + halfH * 1.02, baseZ - 7.5);

      // 1. Position Collar on central spine
      handler.collarGroup.position.copy(spinePos);

      // 2. Position Clamp at top edge of card & align with card rotation
      handler.clampGroup.position.copy(clampPos);
      handler.clampGroup.quaternion.copy(mesh.quaternion);

      // 3. Articulated Hydraulic Boom aiming from Spine to Clamp
      const boomVec = new THREE.Vector3().subVectors(clampPos, spinePos);
      const boomDist = Math.max(0.2, boomVec.length());
      const boomDir = boomVec.clone().normalize();
      const boomMid = new THREE.Vector3().addVectors(spinePos, clampPos).multiplyScalar(0.5);

      handler.boomGroup.position.copy(boomMid);
      handler.boomGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), boomDir);
      handler.boomGroup.scale.set(1, boomDist, 1);

      // Update clamp LED color to card color & pulse if hovered
      if (cardData[hIdx] && cardData[hIdx].color) {
        handler.clampLedMat.color.set(cardData[hIdx].color);
      }
      const ledGlow = mesh.userData.isHovered ? (1.6 + Math.sin(timeVal * 8.0) * 0.5) : 0.9;
      handler.clampLedMat.opacity = Math.min(1.0, mesh.material.opacity * ledGlow);
    });

    if (scrollProgress < 0.4) {
      if (activeCardIndex !== -1) {
        activeCardIndex = -1;
        window.dispatchEvent(new CustomEvent('activetheory-card-active', { detail: { isHero: true } }));
      }
    } else if (closestIndex !== -1 && closestIndex !== activeCardIndex) {
      activeCardIndex = closestIndex;
      window.dispatchEvent(new CustomEvent('activetheory-card-active', { detail: cardData[activeCardIndex] }));
    }


    // Dynamic Active Card Spotlight & Cyber Rim Light Tracking
    if (closestIndex !== -1 && cardMeshes[closestIndex]) {
      const activeMesh = cardMeshes[closestIndex];
      const colHex = parseInt(activeMesh.userData.cardData.color.replace('#', '0x'), 16) || 0x7DD3FC;
      activeCardSpotlight.intensity = 0.0; // Zero direct spotlight glare onto text surface

      activeCardRimLight.color.setHex(colHex);
      activeCardRimLight.position.set(activeMesh.position.x + (isMobile ? 2.5 : 5.0), activeMesh.position.y - 0.8, activeMesh.position.z + 3.5);
      activeCardRimLight.intensity = Math.max(0.3, 1.4 * (1.0 - Math.min(1.0, minDistance)));
    } else {
      activeCardSpotlight.intensity = 0.0;
      activeCardRimLight.intensity = 0.4;
    }


    // Smooth deep-dive scatter interpolation (warp speed explosion)
    deepDiveScatter += (deepDiveTransitionTarget - deepDiveScatter) * 0.08;

    // Tentacle energy light pulsing (reddish glow corresponds to tentacle state)
    const tentacleEnergy = (scrollProgress < 0.3 || scrollProgress >= 5.0) ? 1.0 : 0.3;
    const energyPulse = tentacleEnergy * (1.2 + Math.sin(timeVal * 3.0) * 0.6);
    tentacleEnergyLight1.intensity = energyPulse * 1.8;
    tentacleEnergyLight2.intensity = energyPulse * 1.2;
    tentacleEnergyLight1.position.y = 5 + scrollProgress * verticalStep * 0.3;
    tentacleEnergyLight2.position.y = -5 + scrollProgress * verticalStep * 0.3;

    // Interactive Quantum Plasma Particle Vortex (spread across entire scene)
    const cur3Dx = mouse.x * 14.0;
    const cur3Dy = mouse.y * 9.0;
    const heroVortexWeight = Math.max(0.0, 1.0 - scrollProgress * 1.5);

    const gPosAttr = glitterGeo.getAttribute('position');
    const gColAttr = glitterGeo.getAttribute('color');
    const gPos = gPosAttr.array;
    const gCol = gColAttr.array;

    for (let i = 0; i < glitterCount; i++) {
      const idx = i * 3;
      const d = glitterBaseData[i];

      const swirlSpeed = timeVal * (1.2 + d.freq * 0.08) + d.phase;
      // Spread particles broadly: hero = medium vortex, scrolled = wide ambient field
      const heroRadius = 2.0 + (i % 9) * 0.7;
      const scrolledRadius = 5.0 + (i % 12) * 2.0;
      const swirlRadius = heroRadius * heroVortexWeight + scrolledRadius * (1.0 - heroVortexWeight);

      // Base positions - widespread field
      let baseX = Math.cos(swirlSpeed) * swirlRadius * 1.2 + d.x0 * 0.15;
      let baseY = Math.sin(swirlSpeed) * swirlRadius * 0.9 + d.y0 * 0.2;
      let baseZ = d.z0 + Math.sin(timeVal * 1.5 + d.phase) * 3.0;

      // Deep-dive scatter: particles explode outward then reassemble
      if (deepDiveScatter > 0.01) {
        baseX += d.scatterX * deepDiveScatter;
        baseY += d.scatterY * deepDiveScatter;
        baseZ += d.scatterZ * deepDiveScatter;
      }

      // Mouse interaction (repulsion near cursor)
      if (scrollProgress < 0.6 && deepDiveScatter < 0.3) {
        const deltaX = (baseX + d.dx) - cur3Dx;
        const deltaY = (baseY + d.dy) - cur3Dy;
        const dist = Math.hypot(deltaX, deltaY) || 1;

        if (dist < 6.0) {
          const repelForce = (1.0 - dist / 6.0) * 0.3 / (dist + 0.5);
          d.vx += (deltaX / dist) * repelForce;
          d.vy += (deltaY / dist) * repelForce;
        }
      }

      d.vx -= d.dx * 0.05;
      d.vx *= 0.92;
      d.dx += d.vx;

      d.vy -= d.dy * 0.05;
      d.vy *= 0.92;
      d.dy += d.vy;

      d.vz -= d.dz * 0.05;
      d.vz *= 0.92;
      d.dz += d.vz;

      gPos[idx] = baseX + d.dx;
      gPos[idx + 1] = baseY + d.dy;
      gPos[idx + 2] = baseZ + d.dz;

      // Color: twinkle + reddish energy tint near tentacles
      const twinkle = 0.4 + 0.6 * Math.sin(timeVal * d.freq + d.phase);
      const scatterDim = 1.0 - deepDiveScatter * 0.4;
      gCol[idx] = d.baseColor.r * twinkle * scatterDim;
      gCol[idx + 1] = d.baseColor.g * twinkle * scatterDim;
      gCol[idx + 2] = d.baseColor.b * twinkle * scatterDim;
    }
    gPosAttr.needsUpdate = true;
    gColAttr.needsUpdate = true;

    // Update Quantum Entanglement Connection Lines
    const ePosAttr = entangleGeo.getAttribute('position');
    const eColAttr = entangleGeo.getAttribute('color');
    const ePos = ePosAttr.array;
    const eCol = eColAttr.array;
    const entangleVis = Math.max(0.0, (1.0 - deepDiveScatter * 2.0)) * 0.3;
    entangleLineMat.opacity = entangleVis;

    for (let l = 0; l < entangleLineCount; l++) {
      const li = l * 6;
      const pi = l % glitterCount;
      const pj = glitterBaseData[pi].entanglePartner;

      const ax = gPos[pi * 3], ay = gPos[pi * 3 + 1], az = gPos[pi * 3 + 2];
      const bx = gPos[pj * 3], by = gPos[pj * 3 + 1], bz = gPos[pj * 3 + 2];
      const linkDist = Math.hypot(ax - bx, ay - by, az - bz);
      const maxLink = 5.5 + deepDiveScatter * 15; // links stretch during scatter

      if (linkDist < maxLink && deepDiveScatter < 0.8) {
        ePos[li] = ax; ePos[li + 1] = ay; ePos[li + 2] = az;
        ePos[li + 3] = bx; ePos[li + 4] = by; ePos[li + 5] = bz;
        const brightness = (1.0 - linkDist / maxLink) * 0.7;
        const flicker = 0.5 + 0.5 * Math.sin(timeVal * 8.0 + l * 0.7);
        eCol[li] = currentColors.primary.r * brightness * flicker;
        eCol[li + 1] = currentColors.primary.g * brightness * flicker;
        eCol[li + 2] = currentColors.primary.b * brightness * flicker;
        eCol[li + 3] = currentColors.accent.r * brightness * flicker;
        eCol[li + 4] = currentColors.accent.g * brightness * flicker;
        eCol[li + 5] = currentColors.accent.b * brightness * flicker;
      } else {
        ePos[li] = 0; ePos[li + 1] = 0; ePos[li + 2] = -100;
        ePos[li + 3] = 0; ePos[li + 4] = 0; ePos[li + 5] = -100;
      }
    }
    ePosAttr.needsUpdate = true;
    eColAttr.needsUpdate = true;

    // Tube rig stays world-anchored; the camera travels. This is what makes
    // scroll read as first-person motion around the claw instead of a conveyor.
    tubeRigGroup.position.set(0, 0, 0);

    // ── FIX A: DRAMATIC CONTINUOUS BIDIRECTIONAL CLAW CLOSURE ──
    // Claws aggressively snap shut from wide open (-0.58 rad) into a locked drill beak (+0.52 rad)
    // as the user initiates scroll [0.0 -> 0.70], fully visible directly in front of the camera:
    const clawCloseProg = Math.min(1.0, Math.max(0.0, scrollProgress / 0.70));
    const easedClaw = clawCloseProg < 0.5
      ? 4 * clawCloseProg * clawCloseProg * clawCloseProg
      : 1 - Math.pow(-2 * clawCloseProg + 2, 3) / 2;

    // Rotational closure around pivot: -0.58 rad -> +0.52 rad (tightly clamped drill beak)
    const currentClawAngle = THREE.MathUtils.lerp(-0.58, 0.52, easedClaw);
    clawPincers.forEach((pincer, pIdx) => {
      const organicJitter = Math.sin(timeVal * 6.0 + pIdx * 1.8) * 0.008 * (1.0 - easedClaw);
      pincer.pivot.rotation.x = currentClawAngle + organicJitter;
    });

    // Head orientation: Keep claw head facing directly forward toward user (head-on)
    clawHeadGroup.rotation.x = 0.0 + (hasUserInteractedPointer ? -mouse.y * 0.04 : 0);
    clawHeadGroup.rotation.y = 0.0 + (hasUserInteractedPointer ? mouse.x * 0.04 : 0);
    clawHeadGroup.rotation.z = 0.0;

    // ── HIGH-INTENSITY LIVING PLASMA CORE & OPTICAL BLOOM ──
    const plasmaPulse = 4.8 + Math.sin(timeVal * 3.2) * 2.2;
    laserEyeCoreMat.emissiveIntensity = plasmaPulse;
    laserNucleusMat.emissiveIntensity = 6.5 + Math.sin(timeVal * 4.5) * 1.8;
    clawRedLight.intensity = 5.5 + plasmaPulse * 0.8;
    flareMesh.rotation.z = timeVal * 2.2;
    laserBeamMat.opacity = 0.45;
    if (coreInnerBloom) {
      coreInnerBloom.material.opacity = 0.55 + Math.sin(timeVal * 3.0) * 0.20;
    }
    if (coreOuterCorona) {
      coreOuterCorona.material.opacity = 0.28 + Math.sin(timeVal * 2.4) * 0.12;
    }

    // ── DEDICATED CYCLOTRON ENERGY SPARKS PHYSICS (FIX 2) ──
    if (clawSparkPoints) {
      const sparkPosAttr = clawSparkGeo.attributes.position;
      const timeOffset = timeVal * 3.5;
      for (let sp = 0; sp < clawSparkCount; sp++) {
        const d = clawSparkData[sp];
        d.theta += d.speed * 0.035;
        const currentR = d.baseRadius + Math.sin(timeOffset + d.pulsePhase) * 0.25;
        d.z += d.zSpeed * 0.02;
        if (d.z > 2.0) d.z = -1.2;
        if (d.z < -1.2) d.z = 2.0;

        sparkPosAttr.setXYZ(
          sp,
          Math.cos(d.theta) * currentR,
          Math.sin(d.theta) * currentR,
          d.z
        );
      }
      sparkPosAttr.needsUpdate = true;
    }

    // Kinetic Doc Ock Arm Organic Respiration Sway
    armSegments.forEach((seg) => {
      const sway = Math.sin(timeVal * 1.8 + seg.phase) * 0.05 * (1.0 - easedClaw * 0.6);
      seg.group.position.x = seg.basePos.x + sway;
      seg.group.rotation.y = sway * 0.04;
    });

    // Central Cyber Column Organic Sway, Neon Energy Ring Pulse, & Additive Bloom Halos
    spineSegments.forEach((seg) => {
      const sway = Math.sin(timeVal * 1.4 + seg.phase) * 0.04;
      seg.group.position.x = seg.basePos.x + sway;
      seg.group.rotation.y = sway * 0.03;
      const ringIntensity = 2.2 + Math.sin(timeVal * 3.2 + seg.phase) * 1.2;
      seg.neonRing.material.emissiveIntensity = ringIntensity;
      if (seg.bloomHalo) {
        seg.bloomHalo.material.opacity = 0.40 + Math.sin(timeVal * 3.2 + seg.phase) * 0.25;
      }
    });

    // ── PROCEDURAL CYBER CONDUIT TEXTURE UV ANIMATION ──
    if (armCyberEmissiveTex && spineCyberEmissiveTex) {
      const flowDelta = (0.0012 + Math.abs(scrollVelocity) * 0.006);
      armCyberEmissiveTex.offset.y -= flowDelta;
      spineCyberEmissiveTex.offset.y -= flowDelta;
    }

    // ── DATA PACKET TELEMETRY STREAM SIMULATION ALONG TUBE ──
    if (tubeDataPoints) {
      const dataPosAttr = tubeDataGeo.attributes.position;
      const vScrollBoost = Math.abs(scrollVelocity) * 2.4;
      const upVec = new THREE.Vector3(0, 1, 0);
      const rightVec = new THREE.Vector3(1, 0, 0);

      for (let dp = 0; dp < tubeDataCount; dp++) {
        const p = tubeDataParticles[dp];
        p.u = (p.u + (p.speed * 0.012 * (1.0 + vScrollBoost))) % 1.0;

        const pt = p.curve.getPointAt(p.u);
        const tan = p.curve.getTangentAt(p.u);
        let norm = new THREE.Vector3().crossVectors(tan, upVec);
        if (norm.lengthSq() < 0.001) norm.crossVectors(tan, rightVec);
        norm.normalize();
        const binorm = new THREE.Vector3().crossVectors(tan, norm).normalize();

        const curAngle = p.angle + Math.sin(timeVal * 2.0 + p.wobblePhase) * 0.15;
        const offX = (norm.x * Math.cos(curAngle) + binorm.x * Math.sin(curAngle)) * p.radius;
        const offY = (norm.y * Math.cos(curAngle) + binorm.y * Math.sin(curAngle)) * p.radius;
        const offZ = (norm.z * Math.cos(curAngle) + binorm.z * Math.sin(curAngle)) * p.radius;

        dataPosAttr.setXYZ(dp, pt.x + offX, pt.y + offY, pt.z + offZ);
      }
      dataPosAttr.needsUpdate = true;
    }

    // ── CRAWLING ELECTRIC LIGHTNING ARCS SIMULATION ──
    const arcUpVec = new THREE.Vector3(0, 1, 0);
    const arcRightVec = new THREE.Vector3(1, 0, 0);
    electricArcs.forEach((arc) => {
      if (!arc.active) {
        // Strike condition: higher probability when scrolling or near joints
        const strikeChance = 0.075 + Math.abs(scrollVelocity) * 0.15;
        if (Math.random() < strikeChance) {
          arc.active = true;
          arc.isArm = Math.random() < 0.35;
          arc.curve = arc.isArm ? armCurve : spineCurve;
          arc.radius = arc.isArm ? armTubeRadius : columnTubeRadius;
          arc.uStart = Math.random() * 0.85;
          arc.uEnd = Math.min(1.0, arc.uStart + 0.04 + Math.random() * 0.08);
          arc.angle = Math.random() * Math.PI * 2;
          arc.maxLife = 0.12 + Math.random() * 0.18;
          arc.life = arc.maxLife;

          // Color: cyan, crimson, or white-hot
          const pickCol = Math.random();
          if (pickCol < 0.55) {
            arc.mat.color.setHex(0xCBD5E1); // Cyan
          } else if (pickCol < 0.85) {
            arc.mat.color.setHex(0xff0055); // Crimson
          } else {
            arc.mat.color.setHex(0xffffff); // White
          }
        }
      } else {
        arc.life -= 0.016;
        if (arc.life <= 0) {
          arc.active = false;
          arc.mat.opacity = 0.0;
        } else {
          const lifeRatio = arc.life / arc.maxLife;
          arc.mat.opacity = Math.sin(lifeRatio * Math.PI) * 0.95;

          const arcPosAttr = arc.geo.attributes.position;
          for (let v = 0; v < arcVertsPerLine; v++) {
            const frac = v / (arcVertsPerLine - 1);
            const u = arc.uStart + (arc.uEnd - arc.uStart) * frac;
            const pt = arc.curve.getPointAt(u);
            const tan = arc.curve.getTangentAt(u);
            let norm = new THREE.Vector3().crossVectors(tan, arcUpVec);
            if (norm.lengthSq() < 0.001) norm.crossVectors(tan, arcRightVec);
            norm.normalize();
            const binorm = new THREE.Vector3().crossVectors(tan, norm).normalize();

            // High-frequency electric jitter
            const jitterR = (v === 0 || v === arcVertsPerLine - 1) ? 0 : (Math.random() - 0.5) * 0.32;
            const jitterTan = (v === 0 || v === arcVertsPerLine - 1) ? 0 : (Math.random() - 0.5) * 0.20;
            const rad = arc.radius * 1.04 + jitterR;

            const vertX = pt.x + (norm.x * Math.cos(arc.angle) + binorm.x * Math.sin(arc.angle)) * rad + tan.x * jitterTan;
            const vertY = pt.y + (norm.y * Math.cos(arc.angle) + binorm.y * Math.sin(arc.angle)) * rad + tan.y * jitterTan;
            const vertZ = pt.z + (norm.z * Math.cos(arc.angle) + binorm.z * Math.sin(arc.angle)) * rad + tan.z * jitterTan;

            arcPosAttr.setXYZ(v, vertX, vertY, vertZ);
          }
          arcPosAttr.needsUpdate = true;
        }
      }
    });

    // ── AMBIENT NEAR-TUBE EMBERS DRIFT ──
    if (tubeEmberPoints) {
      const emberPosAttr = tubeEmberGeo.attributes.position;
      const emberUpVec = new THREE.Vector3(0, 1, 0);
      const emberRightVec = new THREE.Vector3(1, 0, 0);

      for (let eb = 0; eb < tubeEmberCount; eb++) {
        const d = tubeEmberData[eb];
        d.u = (d.u + d.driftSpeed * 0.008) % 1.0;
        d.angle += d.rotSpeed * 0.015;

        const pt = d.curve.getPointAt(d.u);
        const tan = d.curve.getTangentAt(d.u);
        let norm = new THREE.Vector3().crossVectors(tan, emberUpVec);
        if (norm.lengthSq() < 0.001) norm.crossVectors(tan, emberRightVec);
        norm.normalize();
        const binorm = new THREE.Vector3().crossVectors(tan, norm).normalize();

        const curR = d.radialDist + Math.sin(timeVal * 1.8 + d.pulsePhase) * 0.35;
        const offX = (norm.x * Math.cos(d.angle) + binorm.x * Math.sin(d.angle)) * curR;
        const offY = (norm.y * Math.cos(d.angle) + binorm.y * Math.sin(d.angle)) * curR;
        const offZ = (norm.z * Math.cos(d.angle) + binorm.z * Math.sin(d.angle)) * curR;

        emberPosAttr.setXYZ(eb, pt.x + offX, pt.y + offY, pt.z + offZ);
      }
      emberPosAttr.needsUpdate = true;
    }

    // ── STREAMING GLOWING BINARY DATA DIGITS SIMULATION ──
    if (binaryPoints0 && binaryPoints1) {
      const posAttr0 = binaryGeo0.attributes.position;
      const posAttr1 = binaryGeo1.attributes.position;
      const bUpVec = new THREE.Vector3(0, 1, 0);
      const bRightVec = new THREE.Vector3(1, 0, 0);

      for (let bp = 0; bp < binaryCount; bp++) {
        const bItem = binaryParticles[bp];
        bItem.u = (bItem.u + bItem.speed * 0.009 * (1.0 + Math.abs(scrollVelocity) * 2.0)) % 1.0;
        bItem.angle += 0.02;

        const pt = bItem.curve.getPointAt(bItem.u);
        const tan = bItem.curve.getTangentAt(bItem.u);
        let norm = new THREE.Vector3().crossVectors(tan, bUpVec);
        if (norm.lengthSq() < 0.001) norm.crossVectors(tan, bRightVec);
        norm.normalize();
        const binorm = new THREE.Vector3().crossVectors(tan, norm).normalize();

        const curAngle = bItem.angle + Math.sin(timeVal * 2.5 + bItem.wobble) * 0.18;
        const offX = (norm.x * Math.cos(curAngle) + binorm.x * Math.sin(curAngle)) * bItem.radius;
        const offY = (norm.y * Math.cos(curAngle) + binorm.y * Math.sin(curAngle)) * bItem.radius;
        const offZ = (norm.z * Math.cos(curAngle) + binorm.z * Math.sin(curAngle)) * bItem.radius;

        if (bItem.isOne) {
          posAttr1.setXYZ(bItem.slotIdx, pt.x + offX, pt.y + offY, pt.z + offZ);
        } else {
          posAttr0.setXYZ(bItem.slotIdx, pt.x + offX, pt.y + offY, pt.z + offZ);
        }
      }
      posAttr0.needsUpdate = true;
      posAttr1.needsUpdate = true;
    }

    // ── TRAVELING HIGH-VOLTAGE ELECTRIC PLASMA SURGE RINGS ──
    if (electricSurgeRing1 && electricSurgeRing2) {
      const surgeCycle1 = (timeVal * 0.38) % 1.0;
      const surgePt1 = spineCurve.getPointAt(surgeCycle1);
      const surgeTan1 = spineCurve.getTangentAt(surgeCycle1);
      electricSurgeRing1.position.copy(surgePt1);
      electricSurgeRing1.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surgeTan1);
      electricSurgeRing1.scale.setScalar(1.0 + Math.sin(timeVal * 8.0) * 0.12);
      surgeRingMat1.opacity = 0.65 + Math.sin(timeVal * 6.0) * 0.30;

      const surgeCycle2 = (timeVal * 0.38 + 0.50) % 1.0;
      const surgePt2 = spineCurve.getPointAt(surgeCycle2);
      const surgeTan2 = spineCurve.getTangentAt(surgeCycle2);
      electricSurgeRing2.position.copy(surgePt2);
      electricSurgeRing2.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), surgeTan2);
      electricSurgeRing2.scale.setScalar(1.0 + Math.cos(timeVal * 8.0) * 0.12);
      surgeRingMat2.opacity = 0.65 + Math.cos(timeVal * 6.0) * 0.30;
    }

    // ── VOLUMETRIC CYBER GAS PARTICLE BURST PHYSICS ──
    if (gasBurstActive) {
      gasBurstTime += 0.016;
      const posAttr = gasGeo.attributes.position;
      for (let g = 0; g < gasParticleCount; g++) {
        const v = gasVelocities[g];
        posAttr.setX(g, posAttr.getX(g) + v.vx);
        posAttr.setY(g, posAttr.getY(g) + v.vy);
        posAttr.setZ(g, posAttr.getZ(g) + v.vz);
        v.vx += Math.sin(posAttr.getY(g) * 2.0 + timeVal * 3.0) * 0.001;
        v.vy += Math.cos(posAttr.getX(g) * 2.0 + timeVal * 3.0) * 0.001;
      }
      posAttr.needsUpdate = true;

      if (gasBurstTime < 0.35) {
        gasMaterial.opacity = (gasBurstTime / 0.35) * 0.85;
      } else {
        gasMaterial.opacity = Math.max(0.0, 0.85 - (gasBurstTime - 0.35) * 0.45);
        if (gasMaterial.opacity <= 0.01) {
          gasBurstActive = false;
          gasCloud.visible = false;
        }
      }
    }

    // Dynamic scene lighting translation
    spinePointLight.position.y = scrollProgress * verticalStep;
    spineAccentLight.position.y = scrollProgress * verticalStep - 20;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(render);
})();
