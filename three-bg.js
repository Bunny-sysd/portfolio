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
  scene.fog = new THREE.FogExp2(baseFogColor, isMobile ? 0.018 : 0.012);

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
  const activeCardSpotlight = new THREE.SpotLight(0x00ff66, 3.5, 45, Math.PI / 4, 0.4, 1.2);
  activeCardSpotlight.position.set(0, 0, 18);
  scene.add(activeCardSpotlight);

  const activeCardRimLight = new THREE.PointLight(0x00e5ff, 2.0, 25);
  activeCardRimLight.position.set(0, 0, 10);
  scene.add(activeCardRimLight);

  const rootGroup = new THREE.Group();
  scene.add(rootGroup);

  // 2. Theme Palettes
  const themePalettes = {
    green: {
      primary: new THREE.Color('#00ff66'),
      secondary: new THREE.Color('#003b14'),
      accent: new THREE.Color('#00e5ff'),
      highlight: new THREE.Color('#ffffff'),
      fog: new THREE.Color('#030509'),
      spine1: new THREE.Color('#00ff66'),
      spine2: new THREE.Color('#00e5ff')
    },
    amber: {
      primary: new THREE.Color('#ffb000'),
      secondary: new THREE.Color('#3d2400'),
      accent: new THREE.Color('#ff3b00'),
      highlight: new THREE.Color('#fff6d6'),
      fog: new THREE.Color('#0a0602'),
      spine1: new THREE.Color('#ffb000'),
      spine2: new THREE.Color('#ff3b00')
    },
    cyan: {
      primary: new THREE.Color('#00e5ff'),
      secondary: new THREE.Color('#002b3d'),
      accent: new THREE.Color('#7000ff'),
      highlight: new THREE.Color('#e0ffff'),
      fog: new THREE.Color('#02060d'),
      spine1: new THREE.Color('#00e5ff'),
      spine2: new THREE.Color('#7000ff')
    },
    monokai: {
      primary: new THREE.Color('#f92672'),
      secondary: new THREE.Color('#3d0014'),
      accent: new THREE.Color('#66d9ef'),
      highlight: new THREE.Color('#ffe4ec'),
      fog: new THREE.Color('#0d0206'),
      spine1: new THREE.Color('#f92672'),
      spine2: new THREE.Color('#66d9ef')
    }
  };

  function getCurrentThemeKey() {
    return document.documentElement.dataset.theme || 'green';
  }

  let activeThemeKey = getCurrentThemeKey();
  let currentColors = {
    primary: (themePalettes[activeThemeKey] || themePalettes.green).primary.clone(),
    secondary: (themePalettes[activeThemeKey] || themePalettes.green).secondary.clone(),
    accent: (themePalettes[activeThemeKey] || themePalettes.green).accent.clone(),
    highlight: (themePalettes[activeThemeKey] || themePalettes.green).highlight.clone(),
    fog: (themePalettes[activeThemeKey] || themePalettes.green).fog.clone(),
    spine1: (themePalettes[activeThemeKey] || themePalettes.green).spine1.clone(),
    spine2: (themePalettes[activeThemeKey] || themePalettes.green).spine2.clone()
  };

  // 1.5 Cinematic Scene Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const mainDirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  mainDirLight.position.set(15, 25, 20);
  scene.add(mainDirLight);

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
  const tentacleEnergyLight1 = new THREE.PointLight(0xff1a1a, 1.8, 120);
  tentacleEnergyLight1.position.set(0, 5, -6);
  scene.add(tentacleEnergyLight1);

  const tentacleEnergyLight2 = new THREE.PointLight(0xff0033, 1.2, 80);
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

  // 4. Opening Hero Refractive Glass Emblem (Top Crown Anchor)
  const heroEmblemGroup = new THREE.Group();
  heroEmblemGroup.position.set(0, 8.2, -4.5);
  rootGroup.add(heroEmblemGroup);

  const emblemRingGeo = new THREE.TorusGeometry(3.2, 0.22, 24, isLowPower ? 36 : 64);
  const emblemGlassMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    emissive: currentColors.primary.clone(),
    emissiveIntensity: 0.35,
    metalness: 0.1,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85
  });
  const emblemRing = new THREE.Mesh(emblemRingGeo, emblemGlassMat);
  heroEmblemGroup.add(emblemRing);

  const innerEmblemGeo = new THREE.OctahedronGeometry(1.6, 1);
  const innerEmblemMat = new THREE.MeshBasicMaterial({
    color: currentColors.accent.clone(),
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const innerEmblem = new THREE.Mesh(innerEmblemGeo, innerEmblemMat);
  heroEmblemGroup.add(innerEmblem);

  const orbitHaloGeo = new THREE.TorusGeometry(4.2, 0.03, 8, 48);
  const orbitHaloMat = new THREE.MeshBasicMaterial({ color: currentColors.primary.clone(), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending });
  const orbitHalo = new THREE.Mesh(orbitHaloGeo, orbitHaloMat);
  orbitHalo.rotation.x = Math.PI / 3;
  heroEmblemGroup.add(orbitHalo);

  // 5. Central Titanium Cyber-Spine with Integrated Doc Ock Tentacle Arms
  const spineGroup = new THREE.Group();
  spineGroup.position.set(0, 0, -8);
  rootGroup.add(spineGroup);

  const spineHeight = 180;
  const spineSegmentCount = 48;
  const spineSegments = [];

  const titaniumCoreMat = new THREE.MeshStandardMaterial({
    color: 0x121822,
    metalness: 0.95,
    roughness: 0.14,
    emissive: 0x02050a,
    emissiveIntensity: 0.2
  });

  const vertebraChassisMat = new THREE.MeshStandardMaterial({
    color: 0x1f2b3e,
    metalness: 0.96,
    roughness: 0.12,
    emissive: currentColors.primary.clone(),
    emissiveIntensity: 0.35
  });

  const coreShaftGeo = new THREE.CylinderGeometry(1.2, 1.2, spineHeight, 32);
  const coreShaft = new THREE.Mesh(coreShaftGeo, titaniumCoreMat);
  coreShaft.position.y = -spineHeight / 2 + 20;
  spineGroup.add(coreShaft);

  const plasmaConduitMat = new THREE.MeshBasicMaterial({
    color: currentColors.accent.clone(),
    wireframe: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const plasmaConduitGeo = new THREE.CylinderGeometry(0.7, 0.7, spineHeight, 20);
  const plasmaConduit = new THREE.Mesh(plasmaConduitGeo, plasmaConduitMat);
  plasmaConduit.position.y = -spineHeight / 2 + 20;
  spineGroup.add(plasmaConduit);

  const vertebraChassisGeo = new THREE.TorusGeometry(2.2, 0.26, 16, 32);
  const ribStrutGeo = new THREE.BoxGeometry(0.35, 0.2, 2.6);
  const nodeBeadGeo = new THREE.SphereGeometry(0.24, 12, 12);
  const nodeBeadMat = new THREE.MeshBasicMaterial({
    color: currentColors.primary.clone(),
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < spineSegmentCount; i++) {
    const segGroup = new THREE.Group();
    const t = i / spineSegmentCount;
    const y = 20 - t * spineHeight;
    segGroup.position.set(0, y, 0);

    const chassis = new THREE.Mesh(vertebraChassisGeo, vertebraChassisMat.clone());
    chassis.rotation.x = Math.PI / 2;
    segGroup.add(chassis);

    const rib1 = new THREE.Mesh(ribStrutGeo, titaniumCoreMat);
    rib1.position.y = 0.35;
    segGroup.add(rib1);
    const rib2 = new THREE.Mesh(ribStrutGeo, titaniumCoreMat);
    rib2.position.y = -0.35;
    segGroup.add(rib2);

    const nodeLeft = new THREE.Mesh(nodeBeadGeo, nodeBeadMat.clone());
    nodeLeft.position.set(-2.2, 0, 0);
    segGroup.add(nodeLeft);

    const nodeRight = new THREE.Mesh(nodeBeadGeo, nodeBeadMat.clone());
    nodeRight.position.set(2.2, 0, 0);
    segGroup.add(nodeRight);

    spineGroup.add(segGroup);
    spineSegments.push({
      group: segGroup,
      baseY: y,
      phase: i * 0.22
    });
  }

  // 4 Articulated Doc Ock Robotic Tentacles emerging from Spine
  const docOckTentacles = [];
  const clawFingerGeos = {
    base: new THREE.BoxGeometry(0.20, 0.24, 0.80),
    mid: new THREE.BoxGeometry(0.15, 0.18, 0.70),
    tip: new THREE.ConeGeometry(0.11, 0.80, 8)
  };
  const clawCoreGeo = new THREE.SphereGeometry(0.34, 16, 16);
  const clawCoreMat = new THREE.MeshStandardMaterial({
    color: 0x00ff66,
    emissive: 0x00ff66,
    emissiveIntensity: 2.5,
    metalness: 0.2,
    roughness: 0.2
  });

  const tentacleArmConfigs = [
    { name: 'TL', originY: 5.5, curveOut: new THREE.Vector3(-8.5, 6.5, -4.5), target: new THREE.Vector3(-7.2, 3.2, -2.0), isLeft: true },
    { name: 'TR', originY: 5.5, curveOut: new THREE.Vector3(8.5, 6.5, -4.5), target: new THREE.Vector3(7.2, 3.2, -2.0), isLeft: false },
    { name: 'BL', originY: -5.5, curveOut: new THREE.Vector3(-8.5, -6.5, -4.5), target: new THREE.Vector3(-7.2, -3.2, -2.0), isLeft: true },
    { name: 'BR', originY: -5.5, curveOut: new THREE.Vector3(8.5, -6.5, -4.5), target: new THREE.Vector3(7.2, -3.2, -2.0), isLeft: false }
  ];

  tentacleArmConfigs.forEach((cfg, tIdx) => {
    const tGroup = new THREE.Group();
    spineGroup.add(tGroup);

    const segCount = 20;
    const segments = [];
    const origin = new THREE.Vector3(cfg.isLeft ? -1.5 : 1.5, cfg.originY, 0);
    const curve = new THREE.QuadraticBezierCurve3(origin, cfg.curveOut, cfg.target);
    const points = curve.getPoints(segCount);

    for (let s = 0; s < segCount; s++) {
      const segMeshGroup = new THREE.Group();
      const p = points[s];
      segMeshGroup.position.copy(p);

      const collar = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.16, 12, 20), titaniumCoreMat);
      collar.rotation.x = Math.PI / 2;
      segMeshGroup.add(collar);

      tGroup.add(segMeshGroup);
      segments.push({ group: segMeshGroup, basePos: p.clone(), index: s });
    }

    // 3-Prong Claw Head
    const clawHeadGroup = new THREE.Group();
    clawHeadGroup.position.copy(cfg.target);
    tGroup.add(clawHeadGroup);

    const clawHub = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.4, 16), titaniumCoreMat);
    clawHub.rotation.x = Math.PI / 2;
    clawHeadGroup.add(clawHub);

    // Glowing Red Laser Eye
    const redEye = new THREE.Mesh(clawCoreGeo, clawCoreMat);
    redEye.position.set(0, 0, 0.35);
    clawHeadGroup.add(redEye);

    const redLight = new THREE.PointLight(0xff0033, 1.8, 12);
    redLight.position.set(0, 0, 0.5);
    clawHeadGroup.add(redLight);

    // 3 Articulated Pincer Fingers
    const prongs = [];
    for (let p = 0; p < 3; p++) {
      const prongPivot = new THREE.Group();
      const angle = (p * Math.PI * 2) / 3;
      prongPivot.rotation.z = angle;

      const baseKnuckle = new THREE.Mesh(clawFingerGeos.base, vertebraChassisMat);
      baseKnuckle.position.set(0, 0.55, 0.4);
      prongPivot.add(baseKnuckle);

      const midPivot = new THREE.Group();
      midPivot.position.set(0, 0.55, 0.8);
      prongPivot.add(midPivot);

      const midKnuckle = new THREE.Mesh(clawFingerGeos.mid, titaniumCoreMat);
      midKnuckle.position.set(0, 0.08, 0.35);
      midPivot.add(midKnuckle);

      const tipClaw = new THREE.Mesh(clawFingerGeos.tip, vertebraChassisMat);
      tipClaw.position.set(0, 0.08, 1.0);
      tipClaw.rotation.x = Math.PI / 2 + 0.35;
      midPivot.add(tipClaw);

      clawHeadGroup.add(prongPivot);
      prongs.push({ pivot: prongPivot, midPivot });
    }

    docOckTentacles.push({
      group: tGroup,
      clawHead: clawHeadGroup,
      segments,
      prongs,
      redLight,
      config: cfg,
      phase: tIdx * 1.5
    });
  });

  // Bottom Anchor: Quantum Transceiver Core Emblem
  const endEmblemGroup = new THREE.Group();
  endEmblemGroup.position.set(0, 20 - spineHeight, -12);
  spineGroup.add(endEmblemGroup);

  const endRingGeo = new THREE.TorusGeometry(3.2, 0.22, 16, 48);
  const endRing = new THREE.Mesh(endRingGeo, emblemGlassMat.clone());
  endEmblemGroup.add(endRing);

  const endOctGeo = new THREE.OctahedronGeometry(1.6, 0);
  const endOct = new THREE.Mesh(endOctGeo, innerEmblemMat.clone());
  endEmblemGroup.add(endOct);

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
      color: '#00ff66',
      stats: [
        { k: 'CTF RANK', v: 'TOP 1%' },
        { k: 'ROOMS', v: '91+' },
        { k: 'GFACT', v: 'CERTIFIED' },
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
      color: '#00ff66',
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
      color: '#00e5ff',
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
      color: '#00ff66',
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
      color: '#00e5ff',
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
      color: '#00ff66',
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
  function generateCardTexture(data) {
    const w = 1024, h = 1380;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    const col = data.color || '#00ff66';

    // 1. Deep Obsidian Gradient Base
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#060a14');
    bgGrad.addColorStop(0.5, '#040711');
    bgGrad.addColorStop(1, '#0a0510');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Circuit Board Trace Pattern (subtle background texture)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    for (let cy = 120; cy < h - 160; cy += 60) {
      ctx.beginPath();
      ctx.moveTo(40, cy);
      const jx = 40 + Math.random() * 200;
      ctx.lineTo(jx, cy);
      ctx.lineTo(jx, cy + (Math.random() > 0.5 ? 30 : -30));
      ctx.lineTo(jx + 80 + Math.random() * 150, cy + (Math.random() > 0.5 ? 30 : -30));
      ctx.stroke();
      // Node dots at junctions
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.beginPath();
      ctx.arc(jx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Holographic Scanline Overlay
    for (let sy = 0; sy < h; sy += 4) {
      ctx.fillStyle = sy % 8 === 0 ? 'rgba(255,255,255,0.012)' : 'rgba(0,0,0,0.015)';
      ctx.fillRect(0, sy, w, 2);
    }

    // 4. Corner Bracket Accents (all 4 corners)
    ctx.strokeStyle = col;
    ctx.lineWidth = 6;
    const cornerLen = 80;
    // Top-left
    ctx.beginPath(); ctx.moveTo(16, 16 + cornerLen); ctx.lineTo(16, 16); ctx.lineTo(16 + cornerLen, 16); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(w - 16 - cornerLen, 16); ctx.lineTo(w - 16, 16); ctx.lineTo(w - 16, 16 + cornerLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(16, h - 16 - cornerLen); ctx.lineTo(16, h - 16); ctx.lineTo(16 + cornerLen, h - 16); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(w - 16 - cornerLen, h - 16); ctx.lineTo(w - 16, h - 16); ctx.lineTo(w - 16, h - 16 - cornerLen); ctx.stroke();

    // Inner faint border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 2;
    ctx.strokeRect(28, 28, w - 56, h - 56);

    // 5. Colored Glow Strip at Top
    const topGlow = ctx.createLinearGradient(0, 0, w, 0);
    topGlow.addColorStop(0, 'rgba(0,0,0,0)');
    topGlow.addColorStop(0.2, col);
    topGlow.addColorStop(0.8, col);
    topGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, 8);

    // 6. Index & Category Eyebrow
    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.fillText(`[ ${data.index} // ${data.category} ]`, 54, 76);

    // 7. Badge Pill
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    const badgeW = ctx.measureText(data.badge).width + 36;
    const badgeX = w - badgeW - 50;
    ctx.fillStyle = 'rgba(255, 30, 60, 0.20)';
    ctx.fillRect(badgeX, 48, badgeW, 40);
    ctx.strokeStyle = 'rgba(255, 30, 60, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(badgeX, 48, badgeW, 40);
    ctx.fillStyle = '#ff4466';
    ctx.fillText(data.badge, badgeX + 18, 75);

    // 8. Large Title with Glow
    ctx.save();
    ctx.shadowColor = col;
    ctx.shadowBlur = 24;
    ctx.font = '900 64px "Outfit", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(data.title, 54, 195);
    ctx.restore();

    // Subtitle
    ctx.font = '600 24px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.fillText(data.subtitle, 54, 245);

    // 9. Gradient Divider Line
    const divGrad = ctx.createLinearGradient(54, 0, w - 54, 0);
    divGrad.addColorStop(0, col);
    divGrad.addColorStop(0.6, 'rgba(255,255,255,0.3)');
    divGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.strokeStyle = divGrad;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(54, 280); ctx.lineTo(w - 54, 280); ctx.stroke();

    // 10. Body Description (High Contrast Bright White)
    ctx.font = '400 26px "Outfit", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    const words = data.desc.split(' ');
    let line = '', lineY = 340;
    const maxLineW = w - 108;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxLineW && n > 0) {
        ctx.fillText(line, 54, lineY);
        line = words[n] + ' ';
        lineY += 42;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 54, lineY);

    // 10b. 4-Element Telemetry Metrics Grid on 3D Card
    if (data.stats && data.stats.length === 4) {
      const statBoxY = lineY + 35;
      const statBoxW = (w - 108 - 36) / 4;
      data.stats.forEach((st, sIdx) => {
        const sx = 54 + sIdx * (statBoxW + 12);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(sx, statBoxY, statBoxW, 70);
        ctx.strokeStyle = col + '55';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx, statBoxY, statBoxW, 70);

        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.textAlign = 'center';
        ctx.fillText(st.k, sx + statBoxW / 2, statBoxY + 26);

        ctx.font = '900 22px "Outfit", sans-serif';
        ctx.fillStyle = col;
        ctx.fillText(st.v, sx + statBoxW / 2, statBoxY + 54);
        ctx.textAlign = 'left';
      });
    }

    // 11. Tags with Card-Accent Color Styling
    let tagX = 54, tagY = lineY + 140;
    ctx.font = 'bold 20px "JetBrains Mono", monospace';
    data.tags.forEach(t => {
      const tagW = ctx.measureText(t).width + 36;
      if (tagX + tagW > w - 54) { tagX = 54; tagY += 52; }
      ctx.fillStyle = col + '22';
      ctx.fillRect(tagX, tagY, tagW, 40);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(tagX, tagY, tagW, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(t, tagX + 18, tagY + 27);
      tagX += tagW + 14;
    });

    // 12. Bottom Action Bar with Arrow
    const barY = h - 130;
    const barGrad = ctx.createLinearGradient(54, barY, w - 54, barY);
    barGrad.addColorStop(0, col + '25');
    barGrad.addColorStop(1, 'rgba(255,255,255,0.05)');
    ctx.fillStyle = barGrad;
    ctx.fillRect(54, barY, w - 108, 68);
    ctx.strokeStyle = col;
    ctx.lineWidth = 2;
    ctx.strokeRect(54, barY, w - 108, 68);
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillStyle = col;
    ctx.fillText('EXPLORE DEEP DIVE', 90, barY + 43);
    // Arrow icon
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText('→', w - 120, barY + 45);

    // 13. Faint Hex Grid watermark at bottom-right
    ctx.globalAlpha = 0.04;
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

  // Create 3D Card Meshes & Unique 3D Holographic Artifacts
  const cardGeo = new THREE.PlaneGeometry(cardWidth, cardHeight);
  const holographicArtifacts = [];

  // Helper to create holographic line/wireframe material with theme support
  function createHoloMaterial(color, isWireframe = true, opacity = 0.85) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      wireframe: isWireframe,
      transparent: true,
      opacity: opacity,
      roughness: 0.2,
      metalness: 0.8
    });
  }

  cardData.forEach((data, i) => {
    const tex = generateCardTexture(data);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      opacity: 0.95,
      roughness: 0.15,
      metalness: 0.10,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(cardGeo, mat);
    mesh.userData = {
      cardIndex: i,
      cardId: data.id,
      cardData: data,
      isHovered: false
    };

    // ── UNIQUE 3D HOLOGRAPHIC SCULPTURE PER CARD ──
    const artifactGroup = new THREE.Group();
    artifactGroup.position.set(0, cardHeight * 0.15, 0.45); // Float on upper half of card
    const colHex = parseInt(data.color.replace('#', '0x'), 16) || 0x00ff66;

    if (i === 0) {
      // 01: IDENTITY // 3D Cyber Icosahedron + Dual Gimbal Rings
      const icoGeo = new THREE.IcosahedronGeometry(1.25, 1);
      const icoMat = createHoloMaterial(colHex, true, 0.9);
      const icoMesh = new THREE.Mesh(icoGeo, icoMat);
      
      const coreGeo = new THREE.SphereGeometry(0.55, 16, 16);
      const coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: colHex, emissiveIntensity: 1.2, roughness: 0.1 });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);

      const ringGeo1 = new THREE.TorusGeometry(1.85, 0.035, 16, 64);
      const ringMat1 = createHoloMaterial(colHex, false, 0.75);
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);

      const ringGeo2 = new THREE.TorusGeometry(2.15, 0.025, 16, 64);
      const ringMat2 = createHoloMaterial(0xffffff, false, 0.6);
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.x = Math.PI / 2.5;

      artifactGroup.add(icoMesh, coreMesh, ring1, ring2);
      artifactGroup.userData = { type: 'identity', ico: icoMesh, core: coreMesh, ring1, ring2 };

    } else if (i === 1) {
      // 02: MUTAGEN // 3D Quantum Torus Knot & Orbiting Particles
      const knotGeo = new THREE.TorusKnotGeometry(1.05, 0.26, 100, 16, 2, 3);
      const knotMat = createHoloMaterial(colHex, true, 0.85);
      const knotMesh = new THREE.Mesh(knotGeo, knotMat);

      // Orbiting Quantum Particle Ring
      const pCount = 80;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let p = 0; p < pCount; p++) {
        const theta = (p / pCount) * Math.PI * 2;
        const rad = 1.9 + (Math.random() - 0.5) * 0.4;
        pPos[p * 3] = Math.cos(theta) * rad;
        pPos[p * 3 + 1] = (Math.random() - 0.5) * 0.6;
        pPos[p * 3 + 2] = Math.sin(theta) * rad;
      }
      pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
      const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.9 });
      const pSystem = new THREE.Points(pGeo, pMat);

      artifactGroup.add(knotMesh, pSystem);
      artifactGroup.userData = { type: 'mutagen', knot: knotMesh, particles: pSystem };

    } else if (i === 2) {
      // 03: VIGIL // 3D Cyber Threat Radar Globe & Laser Sweep
      const sphereGeo = new THREE.SphereGeometry(1.35, 18, 14);
      const sphereMat = createHoloMaterial(colHex, true, 0.75);
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);

      const sweepGeo = new THREE.RingGeometry(0.1, 1.6, 32, 1, 0, Math.PI / 2.5);
      const sweepMat = new THREE.MeshBasicMaterial({ color: colHex, side: THREE.DoubleSide, transparent: true, opacity: 0.55 });
      const sweepMesh = new THREE.Mesh(sweepGeo, sweepMat);
      sweepMesh.rotation.x = Math.PI / 2;

      // Target blips on radar
      const blipGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
      const blipMat = new THREE.MeshBasicMaterial({ color: 0xff3366 });
      const blip1 = new THREE.Mesh(blipGeo, blipMat); blip1.position.set(0.8, 0.4, 0.6);
      const blip2 = new THREE.Mesh(blipGeo, blipMat); blip2.position.set(-0.7, -0.3, 0.9);

      artifactGroup.add(sphereMesh, sweepMesh, blip1, blip2);
      artifactGroup.userData = { type: 'vigil', sphere: sphereMesh, sweep: sweepMesh, blip1, blip2 };

    } else if (i === 3) {
      // 04: SIGNALHUB // 3D Financial Wave Grid & Pulse Pillars
      const waveGeo = new THREE.PlaneGeometry(2.8, 1.8, 14, 14);
      const waveMat = createHoloMaterial(colHex, true, 0.85);
      const waveMesh = new THREE.Mesh(waveGeo, waveMat);
      waveMesh.rotation.x = -Math.PI / 3;

      // Pulse pillars
      const pillarGroup = new THREE.Group();
      const pGeo = new THREE.BoxGeometry(0.12, 1.0, 0.12);
      for (let bar = 0; bar < 5; bar++) {
        const pMat = new THREE.MeshStandardMaterial({ color: colHex, emissive: colHex, emissiveIntensity: 0.8 });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.set(-0.8 + bar * 0.4, 0.3, 0);
        pillarGroup.add(pMesh);
      }

      artifactGroup.add(waveMesh, pillarGroup);
      artifactGroup.userData = { type: 'signalhub', wave: waveMesh, pillars: pillarGroup, waveGeo };

    } else if (i === 4) {
      // 05: PROVING GROUNDS // 3D Cyber Tesseract (Nested Hypercube)
      const outerCubeGeo = new THREE.BoxGeometry(2.0, 2.0, 2.0);
      const outerCubeMat = createHoloMaterial(colHex, true, 0.7);
      const outerCube = new THREE.Mesh(outerCubeGeo, outerCubeMat);

      const innerCubeGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      const innerCubeMat = createHoloMaterial(0xffffff, true, 0.95);
      const innerCube = new THREE.Mesh(innerCubeGeo, innerCubeMat);

      artifactGroup.add(outerCube, innerCube);
      artifactGroup.userData = { type: 'thm', outer: outerCube, inner: innerCube };

    } else if (i === 5) {
      // 06: TRANSMISSION // 3D Quantum Signal Dish & Radiating Pulse Rings
      const dishGeo = new THREE.CylinderGeometry(0.2, 1.5, 0.5, 32, 1, true);
      const dishMat = createHoloMaterial(colHex, true, 0.85);
      const dishMesh = new THREE.Mesh(dishGeo, dishMat);
      dishMesh.rotation.x = Math.PI / 2.5;

      const emitterGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const emitterMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: colHex, emissiveIntensity: 1.5 });
      const emitter = new THREE.Mesh(emitterGeo, emitterMat);
      emitter.position.set(0, 0, 0.4);

      // Radiating Wave Rings
      const waveRings = [];
      for (let r = 0; r < 3; r++) {
        const ringGeo = new THREE.RingGeometry(1.2 + r * 0.5, 1.25 + r * 0.5, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: colHex, side: THREE.DoubleSide, transparent: true, opacity: 0.6 - r * 0.18 });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 0, 0.6 + r * 0.35);
        artifactGroup.add(ring);
        waveRings.push(ring);
      }

      artifactGroup.add(dishMesh, emitter);
      artifactGroup.userData = { type: 'transmission', dish: dishMesh, emitter, rings: waveRings };
    }

    mesh.add(artifactGroup);
    mesh.userData.artifact = artifactGroup;
    holographicArtifacts.push(artifactGroup);

    rootGroup.add(mesh);
    cardMeshes.push(mesh);
  });

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
  });

  window.addEventListener('pointermove', (e) => {
    updatePointerCoords(e.clientX, e.clientY);
    if (isDragging) {
      const deltaY = dragStartY - e.clientY;
      const deltaX = dragStartX - e.clientX;
      totalDragDistance = Math.hypot(deltaX, deltaY);
      const dragSensitivity = isMobile ? 0.0055 : 0.004;
      targetScroll = Math.max(0, Math.min(6.0, dragStartProgress + deltaY * dragSensitivity));
    }
  });

  window.addEventListener('pointerup', () => { isDragging = false; });
  window.addEventListener('pointercancel', () => { isDragging = false; });

  // Camera Zoom & Deep Dive Transition Engine (Active Theory Style)
  let isDeepDiveActive = false;
  let targetCameraZ = 24;
  let targetCameraY = 0;
  let deepDiveTransitionTarget = 0; // particles scatter target (0 normal, 1 exploded)
  let deepDiveCardIndex = -1;
  let deepDiveProgress = 0; // 0 normal orbit, 1 fully expanded to fullscreen
  let cardEmissiveGlow = 0; // extra flash on transition

  window.triggerActiveTheoryCardDeepDive = function(cardId) {
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

    // Trigger Cyber Audio SFX if available
    if (typeof window.playCyberSFX === 'function') {
      window.playCyberSFX('warpTransition');
    }

    if (typeof window.openActiveTheoryDrawer === 'function') {
      window.openActiveTheoryDrawer(cardData[targetIdx].id);
    }
  };

  window.closeActiveTheoryDeepDive = function() {
    isDeepDiveActive = false;
    deepDiveTransitionTarget = 0;
    targetCameraZ = 24;
    targetCameraY = 0;
    cardEmissiveGlow = 0.5;

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

  // Raycaster for Card Hover & Click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2(0, 0);
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
    if (totalDragDistance > 8) return;
    if (e.target.closest('.interactive-ui') || e.target.closest('.at-drawer') || e.target.closest('button') || e.target.closest('a')) return;

    updatePointerCoords(e.clientX, e.clientY);
    raycaster.setFromCamera(raycastCoords, camera);
    const intersects = raycaster.intersectObjects(cardMeshes);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const cardId = hit.userData.cardId;
      const idx = hit.userData.cardIndex;
      window.rotateCylinderToCard(idx + 1);
      window.triggerActiveTheoryCardDeepDive(cardId);
    }
  });

  // 8. Real-Time Theme Palette Updates
  function updateTheme(newThemeKey) {
    const pal = themePalettes[newThemeKey] || themePalettes.green;
    activeThemeKey = newThemeKey;

    currentColors.primary.copy(pal.primary);
    currentColors.secondary.copy(pal.secondary);
    currentColors.accent.copy(pal.accent);
    currentColors.highlight.copy(pal.highlight);
    currentColors.fog.copy(pal.fog);
    currentColors.spine1.copy(pal.spine1);
    currentColors.spine2.copy(pal.spine2);

    scene.fog.color.copy(pal.fog);
    emblemGlassMat.emissive.copy(pal.primary);
    innerEmblemMat.color.copy(pal.accent);
    orbitHaloMat.color.copy(pal.primary);

    spinePointLight.color.copy(pal.primary);
    spineAccentLight.color.copy(pal.accent);
    rimLight.color.copy(pal.accent);
    vertebraChassisMat.emissive.copy(pal.primary);
    nodeBeadMat.color.copy(pal.primary);
    plasmaConduitMat.color.copy(pal.accent);
  }

  const themeObserver = new MutationObserver(() => {
    const currentTheme = getCurrentThemeKey();
    if (currentTheme !== activeThemeKey) updateTheme(currentTheme);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

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

    // Scroll Physics & Boundary Clamping (0.0 Hero -> 8.0 Card 08)
    if (!isDragging && !isDeepDiveActive) {
      targetScroll += scrollVelocity;
      scrollVelocity *= 0.90;
      if (Math.abs(scrollVelocity) < 0.0001) scrollVelocity = 0;
    }
    targetScroll = Math.max(0, Math.min(6.0, targetScroll));
    scrollProgress += (targetScroll - scrollProgress) * 0.12;

    // Camera Zoom Interpolation (Active Theory Push-In)
    camera.position.z += (targetCameraZ - camera.position.z) * 0.08;
    camera.position.y += (targetCameraY - camera.position.y) * 0.08;

    // Deep-dive progress interpolation (smooth ease-in-out morph)
    const targetProg = isDeepDiveActive ? 1.0 : 0.0;
    deepDiveProgress += (targetProg - deepDiveProgress) * 0.10;
    cardEmissiveGlow *= 0.92;

    // Raycast for Hovered 3D Card (only active when cards are visible and user has interacted with pointer)
    if (scrollProgress >= 0.4 && deepDiveProgress < 0.1 && hasUserInteractedPointer) {
      raycaster.setFromCamera(raycastCoords, camera);
      const intersects = raycaster.intersectObjects(cardMeshes);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        if (hoveredCard !== hit) {
          if (hoveredCard) hoveredCard.userData.isHovered = false;
          hoveredCard = hit;
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

    // Position Cards along Centered Helical Rail with Full Active Theory Transition
    let closestIndex = -1;
    let minDistance = Infinity;

    cardMeshes.forEach((mesh) => {
      const i = mesh.userData.cardIndex;
      const targetCardScroll = i + 1; // Card 0 activates at scrollProgress = 1.0
      const relPos = targetCardScroll - scrollProgress;
      const distToCenter = Math.abs(relPos);
      const angle = relPos * angleStep;

      // Centered rail math: active card converges directly to (0, 0, 0)
      const xFactor = isMobile ? 2.2 : 6.5;
      const helixX = Math.sin(angle) * xFactor * Math.min(1.0, distToCenter * 1.5);
      const helixY = -relPos * verticalStep;
      const depthFactor = isMobile ? 4.2 : 5.8;
      const helixZ = -Math.pow(distToCenter, 1.25) * depthFactor + (mesh.userData.isHovered ? 2.5 : 0);

      if (scrollProgress >= 0.4 && distToCenter < minDistance) {
        minDistance = distToCenter;
        closestIndex = i;
      }

      const isThisDeepDiveCard = (i === deepDiveCardIndex);

      if (isThisDeepDiveCard && deepDiveProgress > 0.001) {
        // Morph selected card directly forward into full viewport plane
        const p = deepDiveProgress;
        const smoothP = p * p * (3 - 2 * p); // smooth cubic hermite ease

        const curX = THREE.MathUtils.lerp(helixX, 0, smoothP);
        const curY = THREE.MathUtils.lerp(helixY, 0, smoothP);
        const curZ = THREE.MathUtils.lerp(helixZ, camera.position.z - 8.5, smoothP);

        mesh.position.set(curX, curY, curZ);

        // Rotation: smoothly un-tilt to face camera straight-on
        const curRotY = THREE.MathUtils.lerp(0, 0, smoothP);
        const curRotX = THREE.MathUtils.lerp(-mouse.y * 0.12, 0, smoothP);
        mesh.rotation.set(curRotX, curRotY, 0);

        // Scale up towards full screen
        const baseScale = Math.max(0.70, 1.0 - distToCenter * 0.12);
        const curScale = THREE.MathUtils.lerp(baseScale, 1.45, smoothP);
        mesh.scale.set(curScale, curScale, curScale);

        mesh.material.opacity = THREE.MathUtils.lerp(0.95, 1.0, smoothP);
        mesh.visible = true;
      } else {
        // Normal Centered Track with Active Theory Front-Facing Alignment
        mesh.position.set(helixX, helixY, helixZ);

        // Rotation: Align squarely to face the camera as distToCenter approaches 0
        const alignWeight = Math.max(0.0, 1.0 - Math.pow(distToCenter / 0.85, 1.2));
        const rawRotY = angle * (isMobile ? 0.25 : 0.45);
        const rotY = rawRotY * (1.0 - alignWeight);

        // Responsive tactile parallax when facing user (strictly 0 without user interaction)
        const parallaxX = (hasUserInteractedPointer ? mouse.x : 0) * (isMobile ? 0.08 : 0.16);
        const parallaxY = (hasUserInteractedPointer ? -mouse.y : 0) * (isMobile ? 0.06 : 0.12);

        mesh.rotation.y = rotY + parallaxX * alignWeight;
        mesh.rotation.x = parallaxY * alignWeight;
        mesh.rotation.z = -parallaxX * 0.15 * alignWeight;

        const heroFade = Math.max(0.0, Math.min(1.0, (scrollProgress - 0.2) / 0.6));
        let opacity = Math.max(0.0, 1.0 - Math.pow(distToCenter / 1.7, 1.5)) * heroFade;
        
        // Fade out non-selected cards during deep dive
        if (deepDiveProgress > 0.001) {
          opacity *= (1.0 - deepDiveProgress * 0.95);
        }

        mesh.material.opacity = opacity;
        mesh.visible = opacity > 0.01;

        const scale = Math.max(0.70, 1.0 - distToCenter * 0.12);
        mesh.scale.set(scale, scale, scale);
      }

      // ── ANIMATE UNIQUE 3D HOLOGRAPHIC ARTIFACTS ──
      const art = mesh.userData.artifact;
      if (art && art.userData) {
        const u = art.userData;
        if (u.type === 'identity') {
          u.ico.rotation.y = timeVal * 0.6;
          u.ico.rotation.x = timeVal * 0.4;
          u.core.scale.setScalar(0.9 + Math.sin(timeVal * 4.0) * 0.15);
          u.ring1.rotation.y = timeVal * 0.9;
          u.ring1.rotation.z = timeVal * 0.4;
          u.ring2.rotation.x = -timeVal * 0.7;
          u.ring2.rotation.z = timeVal * 0.5;
        } else if (u.type === 'mutagen') {
          u.knot.rotation.x = timeVal * 0.7;
          u.knot.rotation.y = timeVal * 0.9;
          u.knot.rotation.z = timeVal * 0.3;
          u.particles.rotation.y = -timeVal * 1.4;
        } else if (u.type === 'vigil') {
          u.sphere.rotation.y = timeVal * 0.3;
          u.sweep.rotation.z = -timeVal * 2.2;
          const blipPulse = 0.8 + Math.sin(timeVal * 6.0) * 0.4;
          u.blip1.scale.setScalar(blipPulse);
          u.blip2.scale.setScalar(1.4 - blipPulse * 0.4);
        } else if (u.type === 'signalhub') {
          if (u.waveGeo) {
            const pos = u.waveGeo.attributes.position;
            for (let v = 0; v < pos.count; v++) {
              const vx = pos.getX(v);
              const vy = pos.getY(v);
              pos.setZ(v, Math.sin(vx * 3.0 + timeVal * 4.0) * 0.25 + Math.cos(vy * 2.5 + timeVal * 3.0) * 0.2);
            }
            pos.needsUpdate = true;
          }
          u.pillars.children.forEach((p, pIdx) => {
            const h = 0.4 + Math.sin(timeVal * 4.0 + pIdx * 1.2) * 0.35 + 0.35;
            p.scale.y = Math.max(0.2, h);
            p.position.y = (p.scale.y * 1.0) / 2;
          });
        } else if (u.type === 'thm') {
          u.outer.rotation.x = timeVal * 0.4;
          u.outer.rotation.y = timeVal * 0.6;
          u.inner.rotation.x = -timeVal * 0.8;
          u.inner.rotation.y = -timeVal * 1.1;
        } else if (u.type === 'transmission') {
          u.dish.rotation.z = Math.sin(timeVal * 1.2) * 0.2;
          u.emitter.scale.setScalar(0.85 + Math.sin(timeVal * 6.0) * 0.2);
          u.rings.forEach((r, rIdx) => {
            const phase = (timeVal * 1.5 + rIdx * 0.8) % 2.5;
            const rScale = 0.6 + phase * 0.5;
            r.scale.set(rScale, rScale, 1.0);
            r.material.opacity = Math.max(0, 0.7 - (phase / 2.5) * 0.7);
          });
        }
      }
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

    // Hero Emblem Animation & Scaling
    emblemRing.rotation.y = timeVal * 0.4;
    innerEmblem.rotation.y = -timeVal * 0.6;
    orbitHalo.rotation.z = timeVal * 0.3;

    // Dynamic Active Card Spotlight & Cyber Rim Light Tracking
    if (closestIndex !== -1 && cardMeshes[closestIndex]) {
      const activeMesh = cardMeshes[closestIndex];
      const colHex = parseInt(activeMesh.userData.cardData.color.replace('#', '0x'), 16) || 0x00ff66;
      activeCardSpotlight.color.setHex(colHex);
      activeCardSpotlight.position.set(activeMesh.position.x, activeMesh.position.y + 1.5, activeMesh.position.z + 8);
      activeCardSpotlight.target = activeMesh;
      activeCardSpotlight.intensity = Math.max(0.8, 3.5 * (1.0 - Math.min(1.0, minDistance)));

      activeCardRimLight.color.setHex(colHex);
      activeCardRimLight.position.set(activeMesh.position.x + (isMobile ? 2.5 : 5.0), activeMesh.position.y - 0.8, activeMesh.position.z + 3.5);
      activeCardRimLight.intensity = Math.max(0.5, 2.5 * (1.0 - Math.min(1.0, minDistance)));
    } else {
      activeCardSpotlight.intensity = 0.5;
      activeCardRimLight.intensity = 0.5;
    }

    // Hero Opening Emblem position & subtle breathe
    heroEmblemGroup.position.y = 8.2 + scrollProgress * verticalStep * 0.45;
    heroEmblemGroup.position.z = -4.5;
    const emblemScale = Math.max(0.65, 1.0 - scrollProgress * 0.15);
    heroEmblemGroup.scale.set(emblemScale, emblemScale, emblemScale);

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

    // Doc Ock Tentacle Kinematics: Wide Open at Hero, Close during Scroll, Re-open at Bottom
    let targetClawAngle = 0.10;
    let clawCenterWeight = 0.0;
    let clawSpreadFactor = 0.0;
    if (scrollProgress < 0.5) {
      clawCenterWeight = Math.max(0.0, 1.0 - scrollProgress * 2.0);
      clawSpreadFactor = clawCenterWeight;
      // Wide open in hero, gradually closing as you scroll
      targetClawAngle = 0.85 * clawCenterWeight + 0.08 * (1.0 - clawCenterWeight);
    } else if (scrollProgress >= 5.0) {
      const reopenT = Math.min(1.0, (scrollProgress - 5.0) / 1.0);
      clawSpreadFactor = reopenT * 0.7;
      targetClawAngle = 0.08 + 0.77 * reopenT;
    }

    docOckTentacles.forEach((t, tIdx) => {
      // Tentacles reach forward in hero, pull back when scrolled
      const targetX = t.config.target.x * (1.0 - clawCenterWeight * 0.35);
      const targetY = t.config.target.y * (1.0 - clawCenterWeight * 0.25);
      const targetZ = t.config.target.z * (1.0 - clawSpreadFactor) + 3.5 * clawSpreadFactor;

      t.segments.forEach((s) => {
        const wave = Math.sin(timeVal * 1.6 + s.index * 0.25 + t.phase);
        const waveCos = Math.cos(timeVal * 1.2 + s.index * 0.25 + t.phase);
        // Electricity-like high freq oscillation on segments
        const elecJitter = Math.sin(timeVal * 18.0 + s.index * 2.5 + tIdx * 7.0) * 0.04 * clawSpreadFactor;
        s.group.position.x = s.basePos.x * (1.0 - clawCenterWeight * 0.4) + wave * 0.35 + elecJitter;
        s.group.position.y = s.basePos.y * (1.0 - clawCenterWeight * 0.3) + waveCos * 0.25 + elecJitter;
        s.group.position.z = s.basePos.z * (1.0 - clawSpreadFactor) + (s.index / 20) * 2.2 * clawSpreadFactor;
      });

      t.clawHead.position.set(targetX, targetY, targetZ);
      // Animate claw prongs with slight independent jitter for organic feel
      t.prongs.forEach((prong, pIdx) => {
        const prongJitter = Math.sin(timeVal * 12.0 + pIdx * 2.1 + tIdx) * 0.06 * clawSpreadFactor;
        prong.pivot.rotation.x = -targetClawAngle + prongJitter;
        prong.midPivot.rotation.x = targetClawAngle * 0.65 - prongJitter * 0.5;
      });

      // Pulsing red core intensity based on claw state
      const isCoreHot = (scrollProgress < 0.3 || scrollProgress >= 5.0);
      const pulseIntensity = isCoreHot
        ? 3.5 + Math.sin(timeVal * 6.0 + tIdx * 1.5) * 1.5
        : 0.6 + Math.sin(timeVal * 2.0 + tIdx) * 0.3;
      t.redLight.intensity = pulseIntensity;
    });

    // Sleek Central Spine Undulation
    spineSegments.forEach((seg) => {
      const wave = Math.sin(timeVal * 1.5 + seg.phase);
      const waveCos = Math.cos(timeVal * 1.2 + seg.phase);
      seg.group.position.x = wave * 0.5;
      seg.group.position.z = waveCos * 0.4;
      seg.group.rotation.z = wave * 0.06;
      seg.group.rotation.y = timeVal * 0.25 + seg.phase * 0.15;
    });

    // Translate spine with scroll
    spineGroup.position.y = scrollProgress * verticalStep;
    spinePointLight.position.y = scrollProgress * verticalStep;
    spineAccentLight.position.y = scrollProgress * verticalStep - 20;
    endEmblemGroup.rotation.y = timeVal * 0.5;

    renderer.render(scene, camera);
  }

  requestAnimationFrame(render);
})();
