/* ═════════════════════════════════════════════════════════════════════
   0xPortfolio — three-bg.js (v2.1 Adaptive Universal Core)
   Scroll-Driven Holographic Cyber Matrix with GLSL Shaders
   - Ultra-Lightweight Adaptive Performance Engine
   - Automatic Software Renderer & Integrated GPU Detection
   - Dynamic FPS Throttling & Low-Power Auto-Degradation
   - Mobile Touch & Low-End Device Zero-Lag Guarantee
   - Live CRT Theme Synchronization (Green / Amber / Cyan / Monokai)
   - 100% Client-Side Isolated GPU Acceleration + Auto-Sleep
   ═════════════════════════════════════════════════════════════════════ */

(function initThreeCyberMatrix() {
  'use strict';

  // 1. WebGL Compatibility & Hardware Capability Check
  function getWebGLContext(canvasEl) {
    try {
      return canvasEl.getContext('webgl', { powerPreference: 'high-performance', antialias: false }) ||
             canvasEl.getContext('experimental-webgl');
    } catch (e) {
      return null;
    }
  }

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const testGl = getWebGLContext(canvas);
  if (!testGl) {
    console.warn('> [0xPortfolio] WebGL unsupported. Applying static cyber-matrix fallback.');
    document.body.classList.add('no-webgl');
    return;
  }

  // Detect Software / Non-GPU Renderers (e.g. SwiftShader, LLVMpipe, Virtual Machine adapters)
  let isSoftwareRenderer = false;
  try {
    const debugInfo = testGl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const unmaskedRenderer = testGl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
      if (/swiftshader|llvmpipe|software|mesa|microsoft basic render|virtualbox|vmware/i.test(unmaskedRenderer)) {
        isSoftwareRenderer = true;
        console.info('> [0xPortfolio] Software / Non-GPU renderer detected. Activating low-power profile.');
      }
    }
  } catch (e) {}

  // 2. Hardware & Viewport Detection
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  const isLowPowerDevice = isSoftwareRenderer || isMobile;

  // Adaptive DPR capping: strictly 1.0 for low-end / mobile / software renderers; max 1.35 on desktop
  const baseDPR = isLowPowerDevice ? 1.0 : Math.min(window.devicePixelRatio || 1, 1.35);

  // 3. Scene, Camera & Renderer Setup
  const scene = new THREE.Scene();
  const baseFogColor = new THREE.Color('#02040a');
  scene.fog = new THREE.FogExp2(baseFogColor, isMobile ? 0.016 : 0.020);

  const camera = new THREE.PerspectiveCamera(
    isMobile ? 75 : 60,
    window.innerWidth / window.innerHeight,
    0.1,
    180
  );

  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isLowPowerDevice,
    powerPreference: 'high-performance',
    precision: isLowPowerDevice ? 'mediump' : 'highp'
  });

  renderer.setPixelRatio(baseDPR);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // 4. CRT Theme Palettes & Dynamic Interpolation
  const themePalettes = {
    green: {
      primary: new THREE.Color('#00ff41'),
      secondary: new THREE.Color('#008822'),
      highlight: new THREE.Color('#ffffff'),
      fog: new THREE.Color('#02040a')
    },
    amber: {
      primary: new THREE.Color('#ffb000'),
      secondary: new THREE.Color('#996600'),
      highlight: new THREE.Color('#fff4cc'),
      fog: new THREE.Color('#080502')
    },
    cyan: {
      primary: new THREE.Color('#00e5ff'),
      secondary: new THREE.Color('#006688'),
      highlight: new THREE.Color('#e0ffff'),
      fog: new THREE.Color('#02060a')
    },
    monokai: {
      primary: new THREE.Color('#f92672'),
      secondary: new THREE.Color('#881144'),
      highlight: new THREE.Color('#ffe4ec'),
      fog: new THREE.Color('#0a0206')
    }
  };

  function getCurrentThemeKey() {
    return document.documentElement.dataset.theme || 'green';
  }

  let activeThemeKey = getCurrentThemeKey();
  let currentColors = {
    primary: themePalettes[activeThemeKey]?.primary.clone() || themePalettes.green.primary.clone(),
    secondary: themePalettes[activeThemeKey]?.secondary.clone() || themePalettes.green.secondary.clone(),
    highlight: themePalettes[activeThemeKey]?.highlight.clone() || themePalettes.green.highlight.clone(),
    fog: themePalettes[activeThemeKey]?.fog.clone() || themePalettes.green.fog.clone()
  };

  // 5. Core Domes Configurations (Mapping to Section Waypoints)
  const mobileScale = 0.72;
  const coreConfigs = isMobile ? [
    { name: 'hero',     scale: 1.6 * mobileScale, x: 0.0, y: 0.0,   z: 0.0 },
    { name: 'about',    scale: 1.3 * mobileScale, x: 0.0, y: -5.0,  z: -8.0 },
    { name: 'skills',   scale: 1.4 * mobileScale, x: 0.0, y: -10.0, z: -16.0 },
    { name: 'projects', scale: 1.2 * mobileScale, x: 0.0, y: -15.0, z: -24.0 },
    { name: 'certs',    scale: 1.3 * mobileScale, x: 0.0, y: -20.0, z: -32.0 },
    { name: 'contact',  scale: 1.5 * mobileScale, x: 0.0, y: -25.0, z: -40.0 }
  ] : [
    { name: 'hero',     scale: 1.65, x: 2.0,  y: 0.0,   z: 0.0 },
    { name: 'about',    scale: 1.35, x: -2.0, y: -6.0,  z: -12.0 },
    { name: 'skills',   scale: 1.45, x: 2.0,  y: -12.0, z: -24.0 },
    { name: 'projects', scale: 1.25, x: -1.8, y: -18.0, z: -36.0 },
    { name: 'certs',    scale: 1.35, x: 1.8,  y: -24.0, z: -48.0 },
    { name: 'contact',  scale: 1.55, x: 0.0,  y: -30.0, z: -60.0 }
  ];

  // 6. Custom GLSL Holographic Shader Definition (Optimized Precision)
  const HolographicShader = {
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: currentColors.primary },
      uFresnelPower: { value: 2.5 },
      uScanlineDensity: { value: 14.0 },
      uOpacity: { value: 0.85 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform float uTime;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        vViewDir = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);

        vec3 displaced = position + normal * (sin(position.y * 3.0 + uTime * 2.0) * 0.03);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uFresnelPower;
      uniform float uScanlineDensity;
      uniform float uOpacity;

      void main() {
        float fresnel = pow(1.0 - max(dot(vNormal, vViewDir), 0.0), uFresnelPower);
        float scanline = sin(vWorldPos.y * uScanlineDensity - uTime * 4.0) * 0.5 + 0.5;
        scanline = scanline * scanline;

        vec3 glowColor = uColor * (fresnel * 1.4 + scanline * 0.3 + 0.06);
        float alpha = (fresnel * 0.7 + scanline * 0.2 + 0.04) * uOpacity;

        gl_FragColor = vec4(glowColor, clamp(alpha, 0.0, 1.0));
      }
    `
  };

  // 7. Instantiate Holographic Cores & Scanner Rings
  const cores = [];
  const shaderMaterials = [];

  coreConfigs.forEach((cfg) => {
    const coreGroup = new THREE.Group();
    coreGroup.position.set(cfg.x, cfg.y, cfg.z);
    mainGroup.add(coreGroup);

    // Outer Holographic Energy Shell
    const holoMat = new THREE.ShaderMaterial({
      vertexShader: HolographicShader.vertexShader,
      fragmentShader: HolographicShader.fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: currentColors.primary.clone() },
        uFresnelPower: { value: isLowPowerDevice ? 2.0 : 2.6 },
        uScanlineDensity: { value: isLowPowerDevice ? 10.0 : 16.0 },
        uOpacity: { value: 0.88 }
      },
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    shaderMaterials.push(holoMat);

    const sphereGeo = new THREE.IcosahedronGeometry(cfg.scale, isLowPowerDevice ? 1 : 2);
    const holoMesh = new THREE.Mesh(sphereGeo, holoMat);
    coreGroup.add(holoMesh);

    // Inner Wireframe Geodesic Core
    const innerGeo = new THREE.IcosahedronGeometry(cfg.scale * 0.82, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: currentColors.secondary.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const innerGlobe = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerGlobe);

    // Concentric Gyroscope Scanner Rings
    const ringSegments = isLowPowerDevice ? 28 : 48;
    
    const ringGeo1 = new THREE.RingGeometry(cfg.scale * 1.44, cfg.scale * 1.48, ringSegments);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: currentColors.primary.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    coreGroup.add(ring1);

    const ringGeo2 = new THREE.RingGeometry(cfg.scale * 1.56, cfg.scale * 1.60, ringSegments);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: currentColors.highlight.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.10,
      blending: THREE.AdditiveBlending
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    coreGroup.add(ring2);

    const ringGeo3 = new THREE.RingGeometry(cfg.scale * 1.36, cfg.scale * 1.40, ringSegments);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: currentColors.secondary.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending
    });
    const ring3 = new THREE.Mesh(ringGeo3, ringMat3);
    ring3.rotation.z = Math.PI / 6;
    coreGroup.add(ring3);

    // Vertical Quantum Data Stream Pillar
    const cylinderGeo = new THREE.CylinderGeometry(0.04, 0.04, cfg.scale * 6.5, 6, 1, true);
    const cylinderMat = new THREE.MeshBasicMaterial({
      color: currentColors.primary.clone(),
      transparent: true,
      opacity: 0.10,
      wireframe: true,
      blending: THREE.AdditiveBlending
    });
    const beam = new THREE.Mesh(cylinderGeo, cylinderMat);
    coreGroup.add(beam);

    cores.push({
      group: coreGroup,
      holo: holoMesh,
      holoMat: holoMat,
      inner: innerGlobe,
      innerMat: innerMat,
      ring1: ring1,
      ring2: ring2,
      ring3: ring3,
      ringMat1: ringMat1,
      ringMat2: ringMat2,
      ringMat3: ringMat3,
      beam: beam,
      beamMat: cylinderMat,
      scale: cfg.scale
    });
  });

  // 8. Infinite Cyber Perspective Grid Floor (GLSL Grid Shader)
  const CyberGridShader = {
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      varying vec3 vWorldPos;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uFogColor;

      void main() {
        vec2 grid = abs(fract(vWorldPos.xz * 0.25 - vec2(0.0, uTime * 0.12)) - 0.5) / fwidth(vWorldPos.xz * 0.25);
        float line = min(grid.x, grid.y);
        float gridAlpha = 1.0 - min(line, 1.0);

        float dist = length(vWorldPos.xz);
        float fog = clamp(exp(-dist * 0.024), 0.0, 1.0);

        vec3 finalColor = mix(uFogColor, uColor, gridAlpha * 0.32);
        gl_FragColor = vec4(finalColor, gridAlpha * fog * 0.22);
      }
    `
  };

  const gridMat = new THREE.ShaderMaterial({
    vertexShader: CyberGridShader.vertexShader,
    fragmentShader: CyberGridShader.fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: currentColors.primary.clone() },
      uFogColor: { value: currentColors.fog.clone() }
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const gridGeo = new THREE.PlaneGeometry(140, 180, 1, 1);
  const gridFloor = new THREE.Mesh(gridGeo, gridMat);
  gridFloor.rotation.x = -Math.PI / 2;
  gridFloor.position.set(0, isMobile ? -26 : -32, -40);
  mainGroup.add(gridFloor);

  // 9. Procedural Binary Canvas Textures Generator
  function createGlowingGlyphTexture(char) {
    const size = 64;
    const canvasEl = document.createElement('canvas');
    canvasEl.width = size;
    canvasEl.height = size;
    const ctx = canvasEl.getContext('2d');

    ctx.clearRect(0, 0, size, size);
    ctx.font = 'bold 44px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff41';
    ctx.shadowBlur = 10;
    ctx.fillText(char, size / 2, size / 2);

    return new THREE.CanvasTexture(canvasEl);
  }

  const texture0 = createGlowingGlyphTexture('0');
  const texture1 = createGlowingGlyphTexture('1');

  // 10. Adaptive Particle Budgets (Scale dynamically based on device capability)
  const nodeCount = isSoftwareRenderer ? 80 : (isMobile ? 120 : 800);
  const globalNodeCount = isSoftwareRenderer ? 150 : (isMobile ? 200 : 1200);
  let connectionLimit = isSoftwareRenderer ? 0 : (isMobile ? 30 : 220); // Disabled on pure software renderers for max FPS

  const nodeCount0 = Math.floor(nodeCount / 2);
  const nodeCount1 = nodeCount - nodeCount0;

  const nodesGeo0 = new THREE.BufferGeometry();
  const nodesGeo1 = new THREE.BufferGeometry();

  const particleOffsets = [];
  const particleParents = [];
  const nodeSpeeds = [];

  const positions0 = new Float32Array(nodeCount0 * 3);
  const colors0 = new Float32Array(nodeCount0 * 3);
  const positions1 = new Float32Array(nodeCount1 * 3);
  const colors1 = new Float32Array(nodeCount1 * 3);

  for (let i = 0; i < nodeCount; i++) {
    const parentIdx = i % coreConfigs.length;
    particleParents.push(parentIdx);

    const cfg = coreConfigs[parentIdx];
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = cfg.scale * 1.15 + Math.random() * (cfg.scale * 1.6);

    const xSph = radius * Math.sin(phi) * Math.cos(theta);
    const ySph = radius * Math.sin(phi) * Math.sin(theta);
    const zSph = radius * Math.cos(phi);

    particleOffsets.push({ x: xSph, y: ySph, z: zSph });

    nodeSpeeds.push({
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      z: (Math.random() - 0.5) * 0.003
    });

    if (i < nodeCount0) {
      const idx = i * 3;
      positions0[idx] = cfg.x + xSph;
      positions0[idx + 1] = cfg.y + ySph;
      positions0[idx + 2] = cfg.z + zSph;
      colors0[idx] = currentColors.primary.r;
      colors0[idx + 1] = currentColors.primary.g;
      colors0[idx + 2] = currentColors.primary.b;
    } else {
      const idx = (i - nodeCount0) * 3;
      positions1[idx] = cfg.x + xSph;
      positions1[idx + 1] = cfg.y + ySph;
      positions1[idx + 2] = cfg.z + zSph;
      colors1[idx] = currentColors.primary.r;
      colors1[idx + 1] = currentColors.primary.g;
      colors1[idx + 2] = currentColors.primary.b;
    }
  }

  nodesGeo0.setAttribute('position', new THREE.BufferAttribute(positions0, 3));
  nodesGeo0.setAttribute('color', new THREE.BufferAttribute(colors0, 3));
  nodesGeo1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
  nodesGeo1.setAttribute('color', new THREE.BufferAttribute(colors1, 3));

  const nodesMat0 = new THREE.PointsMaterial({
    size: isMobile ? 0.36 : 0.54,
    map: texture0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const nodesMat1 = new THREE.PointsMaterial({
    size: isMobile ? 0.36 : 0.54,
    map: texture1,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const nodes0 = new THREE.Points(nodesGeo0, nodesMat0);
  const nodes1 = new THREE.Points(nodesGeo1, nodesMat1);
  mainGroup.add(nodes0);
  mainGroup.add(nodes1);

  // 11. Global Floating Starfield Matrix
  const globalNodeCount0 = Math.floor(globalNodeCount / 2);
  const globalNodeCount1 = globalNodeCount - globalNodeCount0;

  const globalGeo0 = new THREE.BufferGeometry();
  const globalGeo1 = new THREE.BufferGeometry();

  const globalPos0 = new Float32Array(globalNodeCount0 * 3);
  const globalCol0 = new Float32Array(globalNodeCount0 * 3);
  const globalPos1 = new Float32Array(globalNodeCount1 * 3);
  const globalCol1 = new Float32Array(globalNodeCount1 * 3);

  const globalSpeeds = [];

  for (let i = 0; i < globalNodeCount; i++) {
    const x = (Math.random() - 0.5) * 55;
    const y = Math.random() * -45 + 12;
    const z = Math.random() * -90 + 15;

    globalSpeeds.push({
      x: (Math.random() - 0.5) * 0.004,
      y: (Math.random() - 0.5) * 0.004,
      z: (Math.random() - 0.5) * 0.004
    });

    if (i < globalNodeCount0) {
      const idx = i * 3;
      globalPos0[idx] = x;
      globalPos0[idx + 1] = y;
      globalPos0[idx + 2] = z;
      globalCol0[idx] = currentColors.primary.r;
      globalCol0[idx + 1] = currentColors.primary.g;
      globalCol0[idx + 2] = currentColors.primary.b;
    } else {
      const idx = (i - globalNodeCount0) * 3;
      globalPos1[idx] = x;
      globalPos1[idx + 1] = y;
      globalPos1[idx + 2] = z;
      globalCol1[idx] = currentColors.primary.r;
      globalCol1[idx + 1] = currentColors.primary.g;
      globalCol1[idx + 2] = currentColors.primary.b;
    }
  }

  globalGeo0.setAttribute('position', new THREE.BufferAttribute(globalPos0, 3));
  globalGeo0.setAttribute('color', new THREE.BufferAttribute(globalCol0, 3));
  globalGeo1.setAttribute('position', new THREE.BufferAttribute(globalPos1, 3));
  globalGeo1.setAttribute('color', new THREE.BufferAttribute(globalCol1, 3));

  const globalMat0 = new THREE.PointsMaterial({
    size: isMobile ? 0.30 : 0.44,
    map: texture0,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const globalMat1 = new THREE.PointsMaterial({
    size: isMobile ? 0.30 : 0.44,
    map: texture1,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.08,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const globalNodes0 = new THREE.Points(globalGeo0, globalMat0);
  const globalNodes1 = new THREE.Points(globalGeo1, globalMat1);
  mainGroup.add(globalNodes0);
  mainGroup.add(globalNodes1);

  // 12. Dynamic Proximity Line Web (Lightweight buffer)
  const lineGeo = new THREE.BufferGeometry();
  const maxLines = Math.max(connectionLimit, 1);
  const linePositions = new Float32Array(maxLines * 2 * 3);
  const lineColors = new Float32Array(maxLines * 2 * 3);

  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.20,
    blending: THREE.AdditiveBlending
  });

  const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
  if (connectionLimit > 0) {
    mainGroup.add(connectionLines);
  }

  // 13. GSAP ScrollTrigger Camera Flight
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    const CAM_Z_OFFSET = isMobile ? 3.6 : 5.2;
    const CAM_Y_OFFSET = isMobile ? 1.0 : 1.6;

    function getCamPos(idx) {
      const c = coreConfigs[idx];
      return { x: c.x, y: c.y + CAM_Y_OFFSET, z: c.z + CAM_Z_OFFSET };
    }
    function getLookTarget(idx) {
      const c = coreConfigs[idx];
      return { x: c.x, y: c.y, z: c.z };
    }

    const initCam = getCamPos(0);
    const initLook = getLookTarget(0);

    const scrollTarget = {
      camX: initCam.x,
      camY: initCam.y,
      camZ: initCam.z,
      lookX: initLook.x,
      lookY: initLook.y,
      lookZ: initLook.z
    };

    window.__scrollTarget = scrollTarget;

    const flightTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.65
      }
    });

    for (let i = 1; i < coreConfigs.length; i++) {
      const cam = getCamPos(i);
      const look = getLookTarget(i);
      flightTimeline.to(scrollTarget, {
        camX: cam.x,
        camY: cam.y,
        camZ: cam.z,
        lookX: look.x,
        lookY: look.y,
        lookZ: look.z,
        duration: 1.0,
        ease: "none"
      });
    }

    const lastCfg = coreConfigs[coreConfigs.length - 1];
    flightTimeline.to(scrollTarget, {
      camX: lastCfg.x,
      camY: lastCfg.y - 5.0,
      camZ: lastCfg.z - CAM_Z_OFFSET * 2,
      lookX: lastCfg.x,
      lookY: lastCfg.y - 8.0,
      lookZ: lastCfg.z - CAM_Z_OFFSET * 4,
      duration: 1.0,
      ease: "none"
    });
  }

  // 14. Interactive Mouse Parallax (Throttled & Disabled during fast scrolls or mobile)
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;
  let currentParallaxX = 0, currentParallaxY = 0;
  const TILT_STRENGTH = isLowPowerDevice ? 0.0 : 0.07;

  let isScrolling = false;
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 120);
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    if (isLowPowerDevice || isScrolling) return;
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    targetRotationY = mouseX * TILT_STRENGTH;
    targetRotationX = -mouseY * TILT_STRENGTH;
  }, { passive: true });

  // 15. Dynamic Theme Colors Updater
  function updateThemeColors(newThemeKey) {
    const pal = themePalettes[newThemeKey] || themePalettes.green;
    activeThemeKey = newThemeKey;

    currentColors.primary.copy(pal.primary);
    currentColors.secondary.copy(pal.secondary);
    currentColors.highlight.copy(pal.highlight);
    currentColors.fog.copy(pal.fog);

    scene.fog.color.copy(pal.fog);
    gridMat.uniforms.uColor.value.copy(pal.primary);
    gridMat.uniforms.uFogColor.value.copy(pal.fog);

    cores.forEach(core => {
      core.holoMat.uniforms.uColor.value.copy(pal.primary);
      core.innerMat.color.copy(pal.secondary);
      core.ringMat1.color.copy(pal.primary);
      core.ringMat2.color.copy(pal.highlight);
      core.ringMat3.color.copy(pal.secondary);
      core.beamMat.color.copy(pal.primary);
    });

    const c0 = nodesGeo0.getAttribute('color');
    const c1 = nodesGeo1.getAttribute('color');
    const gc0 = globalGeo0.getAttribute('color');
    const gc1 = globalGeo1.getAttribute('color');

    for (let i = 0; i < c0.count; i++) c0.setXYZ(i, pal.primary.r, pal.primary.g, pal.primary.b);
    for (let i = 0; i < c1.count; i++) c1.setXYZ(i, pal.primary.r, pal.primary.g, pal.primary.b);
    for (let i = 0; i < gc0.count; i++) gc0.setXYZ(i, pal.primary.r, pal.primary.g, pal.primary.b);
    for (let i = 0; i < gc1.count; i++) gc1.setXYZ(i, pal.primary.r, pal.primary.g, pal.primary.b);

    c0.needsUpdate = true;
    c1.needsUpdate = true;
    gc0.needsUpdate = true;
    gc1.needsUpdate = true;
  }

  const themeObserver = new MutationObserver(() => {
    const currentTheme = getCurrentThemeKey();
    if (currentTheme !== activeThemeKey) {
      updateThemeColors(currentTheme);
    }
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  window.addEventListener('themechange', (e) => {
    if (e.detail?.theme) {
      updateThemeColors(e.detail.theme);
    }
  });

  // 16. Window Resize Handler with Orientation Change Detection
  window.addEventListener('resize', () => {
    const isNowMobile = window.innerWidth < 768;
    camera.fov = isNowMobile ? 75 : 60;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  // 17. Battery & Performance Auto-Sleep (Visibility API)
  let isPageVisible = !document.hidden;
  document.addEventListener('visibilitychange', () => {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
      lastFrameTime = performance.now();
      requestAnimationFrame(renderLoop);
    }
  });

  // 18. Dynamic Adaptive Performance & FPS Monitor
  let lastFrameTime = performance.now();
  let prevCamZ = 0.0;
  let pulsePhase = 0.0;
  let slowFrameCount = 0;
  let isAutoThrottled = isLowPowerDevice;

  function renderLoop(now) {
    if (!isPageVisible) return; // Automatic Sleep when tab backgrounded

    requestAnimationFrame(renderLoop);

    const deltaMs = now - lastFrameTime;
    const delta = Math.min(deltaMs * 0.001, 0.1);
    lastFrameTime = now;

    // Automatic Performance Guardrail:
    // If the device struggles (frame time > 42ms / < 24 FPS) over 30 consecutive frames,
    // automatically reduce resolution and disable line calculations.
    if (deltaMs > 42) {
      slowFrameCount++;
      if (slowFrameCount > 30 && !isAutoThrottled) {
        isAutoThrottled = true;
        renderer.setPixelRatio(0.9);
        connectionLimit = 0;
        if (connectionLines.parent) {
          mainGroup.remove(connectionLines);
        }
        console.info('> [0xPortfolio] Adaptive throttle engaged for 60 FPS stability.');
      }
    } else {
      slowFrameCount = Math.max(0, slowFrameCount - 1);
    }

    const scrollTarget = window.__scrollTarget || {
      camX: coreConfigs[0].x,
      camY: coreConfigs[0].y + (isMobile ? 1.0 : 1.6),
      camZ: coreConfigs[0].z + (isMobile ? 3.6 : 5.2),
      lookX: coreConfigs[0].x,
      lookY: coreConfigs[0].y,
      lookZ: coreConfigs[0].z
    };

    const deltaZ = scrollTarget.camZ - prevCamZ;
    const scrollSpeedZ = Math.abs(deltaZ);
    prevCamZ = scrollTarget.camZ;

    const activeTargetX = (isScrolling || isAutoThrottled) ? 0.0 : targetRotationX;
    const activeTargetY = (isScrolling || isAutoThrottled) ? 0.0 : targetRotationY;
    currentParallaxX += (activeTargetX - currentParallaxX) * 0.06;
    currentParallaxY += (activeTargetY - currentParallaxY) * 0.06;

    camera.position.set(
      scrollTarget.camX + currentParallaxY * 3.5,
      scrollTarget.camY + currentParallaxX * 3.5,
      scrollTarget.camZ
    );
    camera.lookAt(scrollTarget.lookX, scrollTarget.lookY, scrollTarget.lookZ);

    const timeVal = now * 0.001;
    gridMat.uniforms.uTime.value = timeVal;
    shaderMaterials.forEach(mat => {
      mat.uniforms.uTime.value = timeVal;
    });

    cores.forEach((core, idx) => {
      const spinSpeed = (idx === 3) ? 3.0 : 1.0;
      core.holo.rotation.y += 0.0010 * spinSpeed;
      core.holo.rotation.x += 0.0005 * spinSpeed;
      core.inner.rotation.y -= 0.0006 * spinSpeed;
      core.ring1.rotation.z += 0.0024 * spinSpeed;
      core.ring2.rotation.x -= 0.0015 * spinSpeed;
      core.ring3.rotation.y += 0.0018 * spinSpeed;
      core.beam.rotation.y += 0.0035 * spinSpeed;
    });

    // Update Local Binary Particles
    const posAttr0 = nodesGeo0.getAttribute('position');
    const posAttr1 = nodesGeo1.getAttribute('position');
    const nodesArray0 = posAttr0.array;
    const nodesArray1 = posAttr1.array;

    for (let i = 0; i < nodeCount; i++) {
      const parentIdx = particleParents[i];
      const cfg = coreConfigs[parentIdx];
      const offset = particleOffsets[i];

      offset.x += nodeSpeeds[i].x;
      offset.y += nodeSpeeds[i].y;
      offset.z += nodeSpeeds[i].z;

      const dist = Math.sqrt(offset.x * offset.x + offset.y * offset.y + offset.z * offset.z);
      const maxDist = cfg.scale * 3.2;
      const minDist = cfg.scale * 0.95;

      if (dist > maxDist || dist < minDist) {
        nodeSpeeds[i].x *= -1;
        nodeSpeeds[i].y *= -1;
        nodeSpeeds[i].z *= -1;
      }

      if (i < nodeCount0) {
        const idx = i * 3;
        nodesArray0[idx] = cfg.x + offset.x;
        nodesArray0[idx + 1] = cfg.y + offset.y;
        nodesArray0[idx + 2] = cfg.z + offset.z;
      } else {
        const idx = (i - nodeCount0) * 3;
        nodesArray1[idx] = cfg.x + offset.x;
        nodesArray1[idx + 1] = cfg.y + offset.y;
        nodesArray1[idx + 2] = cfg.z + offset.z;
      }
    }
    posAttr0.needsUpdate = true;
    posAttr1.needsUpdate = true;

    pulsePhase += delta * 3.0;
    const pulse = 1.0 + Math.sin(pulsePhase) * 0.10;
    nodesMat0.size = (isMobile ? 0.36 : 0.54) * pulse;
    nodesMat1.size = (isMobile ? 0.36 : 0.54) * pulse;

    // Update Global Starfield
    const gPosAttr0 = globalGeo0.getAttribute('position');
    const gPosAttr1 = globalGeo1.getAttribute('position');
    const gNodesArray0 = gPosAttr0.array;
    const gNodesArray1 = gPosAttr1.array;

    const warpAmp = 1.0 + Math.min(scrollSpeedZ * 12.0, 16.0);

    for (let i = 0; i < globalNodeCount; i++) {
      const speed = globalSpeeds[i];
      const dynamicZSpeed = speed.z - deltaZ * 0.40;

      if (i < globalNodeCount0) {
        const idx = i * 3;
        gNodesArray0[idx] += speed.x;
        gNodesArray0[idx + 1] += speed.y;
        gNodesArray0[idx + 2] += dynamicZSpeed * warpAmp;

        if (gNodesArray0[idx] > 28.0 || gNodesArray0[idx] < -28.0) speed.x *= -1;
        if (gNodesArray0[idx + 1] > 15.0 || gNodesArray0[idx + 1] < -46.0) speed.y *= -1;
        if (gNodesArray0[idx + 2] > 18.0) gNodesArray0[idx + 2] = -82.0;
        else if (gNodesArray0[idx + 2] < -82.0) gNodesArray0[idx + 2] = 18.0;
      } else {
        const idx = (i - globalNodeCount0) * 3;
        gNodesArray1[idx] += speed.x;
        gNodesArray1[idx + 1] += speed.y;
        gNodesArray1[idx + 2] += dynamicZSpeed * warpAmp;

        if (gNodesArray1[idx] > 28.0 || gNodesArray1[idx] < -28.0) speed.x *= -1;
        if (gNodesArray1[idx + 1] > 15.0 || gNodesArray1[idx + 1] < -46.0) speed.y *= -1;
        if (gNodesArray1[idx + 2] > 18.0) gNodesArray1[idx + 2] = -82.0;
        else if (gNodesArray1[idx + 2] < -82.0) gNodesArray1[idx + 2] = 18.0;
      }
    }
    gPosAttr0.needsUpdate = true;
    gPosAttr1.needsUpdate = true;

    // Proximity Line Web (Only calculated if not throttled)
    if (connectionLimit > 0 && !isAutoThrottled) {
      function getNodePos(idx) {
        if (idx < nodeCount0) {
          return { x: nodesArray0[idx * 3], y: nodesArray0[idx * 3 + 1], z: nodesArray0[idx * 3 + 2] };
        } else {
          const oIdx = (idx - nodeCount0) * 3;
          return { x: nodesArray1[oIdx], y: nodesArray1[oIdx + 1], z: nodesArray1[oIdx + 2] };
        }
      }

      const linePosAttr = connectionLines.geometry.getAttribute('position');
      const lineColAttr = connectionLines.geometry.getAttribute('color');
      const lPos = linePosAttr.array;
      const lCol = lineColAttr.array;

      let lineIdx = 0;
      const thresholdSq = 2.8 * 2.8;

      for (let i = 0; i < connectionLimit && lineIdx < connectionLimit; i++) {
        const p1 = getNodePos(i);
        const parent1 = particleParents[i];

        for (let j = i + 1; j < connectionLimit && lineIdx < connectionLimit; j++) {
          if (particleParents[i] !== particleParents[j] && Math.abs(particleParents[i] - particleParents[j]) > 1) {
            continue;
          }

          const p2 = getNodePos(j);
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const distSq = dx * dx + dy * dy + dz * dz;

          if (distSq < thresholdSq) {
            const idx = lineIdx * 6;
            lPos[idx] = p1.x;     lPos[idx + 1] = p1.y;     lPos[idx + 2] = p1.z;
            lPos[idx + 3] = p2.x; lPos[idx + 4] = p2.y; lPos[idx + 5] = p2.z;

            lCol[idx] = currentColors.primary.r;     lCol[idx + 1] = currentColors.primary.g;     lCol[idx + 2] = currentColors.primary.b;
            lCol[idx + 3] = currentColors.primary.r; lCol[idx + 4] = currentColors.primary.g; lCol[idx + 5] = currentColors.primary.b;

            lineIdx++;
          }
        }
      }

      for (let k = lineIdx; k < connectionLimit; k++) {
        const idx = k * 6;
        lPos[idx] = 0; lPos[idx + 1] = 0; lPos[idx + 2] = 0;
        lPos[idx + 3] = 0; lPos[idx + 4] = 0; lPos[idx + 5] = 0;
      }

      linePosAttr.needsUpdate = true;
      lineColAttr.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  requestAnimationFrame(renderLoop);
})();
