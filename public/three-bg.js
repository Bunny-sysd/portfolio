/* ═══════════════════════════════════════════
   0xPortfolio — three-bg.js
   Scroll-Driven Shifting Focal Core Portal
   Uses GSAP & ScrollTrigger for 3D Camera Journeys
   Optimized for Desktop & Mobile Viewports
   ═══════════════════════════════════════════ */

(function initThreeBackground() {
  // Check WebGL support
  function isWebGLSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  if (!isWebGLSupported()) {
    console.warn('> WebGL not supported. Falling back to static cyber grid.');
    document.body.classList.add('no-webgl');
    return;
  }

  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  // Scene setup
  const scene = new THREE.Scene();
  // Mobile/Performance detection — checked early so FOV, scale, spacing all adapt
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent) || window.innerWidth < 768;

  scene.fog = new THREE.FogExp2('#02040a', isMobile ? 0.016 : 0.022); // thinner fog on mobile for dome visibility
  const camera = new THREE.PerspectiveCamera(
    isMobile ? 75 : 60,   // wider FOV on portrait screens so domes actually fit
    window.innerWidth / window.innerHeight,
    0.1, 150
  );
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: !isMobile   // skip AA on mobile for perf
  });

  renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Main interactive group containing all visual objects
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Color Definitions (Cyber Theme)
  const colorGreen = new THREE.Color('#00ff41'); // Piercing terminal green
  const colorBlue = new THREE.Color('#008822');  // Dark forest cyber green
  const colorCyan = new THREE.Color('#ffffff');  // Luminous white contrast

  // Core configurations mapping to the 6 sections in index.html
  // Mobile: center all domes on x-axis, use compressed Z-spacing, smaller scales
  const mobileScale = 0.7;  // domes are 70% size on mobile
  const coreConfigs = isMobile ? [
    { name: 'hero',     color: colorGreen, scale: 1.6 * mobileScale, x: 0.0, y: 0.0,   z: 0.0 },
    { name: 'about',    color: colorBlue,  scale: 1.3 * mobileScale, x: 0.0, y: -5.0,  z: -8.0 },
    { name: 'skills',   color: colorGreen, scale: 1.4 * mobileScale, x: 0.0, y: -10.0, z: -16.0 },
    { name: 'projects', color: colorBlue,  scale: 1.2 * mobileScale, x: 0.0, y: -15.0, z: -24.0 },
    { name: 'certs',    color: colorCyan,  scale: 1.3 * mobileScale, x: 0.0, y: -20.0, z: -32.0 },
    { name: 'contact',  color: colorCyan,  scale: 1.5 * mobileScale, x: 0.0, y: -25.0, z: -40.0 }
  ] : [
    { name: 'hero',     color: colorGreen, scale: 1.6, x: 2.0,  y: 0.0,   z: 0.0 },
    { name: 'about',    color: colorBlue,  scale: 1.3, x: -2.0, y: -6.0,  z: -12.0 },
    { name: 'skills',   color: colorGreen, scale: 1.4, x: 2.0,  y: -12.0, z: -24.0 },
    { name: 'projects', color: colorBlue,  scale: 1.2, x: -1.8, y: -18.0, z: -36.0 },
    { name: 'certs',    color: colorCyan,  scale: 1.3, x: 1.8,  y: -24.0, z: -48.0 },
    { name: 'contact',  color: colorCyan,  scale: 1.5, x: 0.0,  y: -30.0, z: -60.0 }
  ];

  const cores = [];

  // Instantiate 6 stationary wireframe cores
  coreConfigs.forEach((cfg) => {
    const coreGroup = new THREE.Group();
    coreGroup.position.set(cfg.x, cfg.y, cfg.z);
    mainGroup.add(coreGroup);

    // Wireframe Outer Globe (The page particle representation)
    const sphereGeo = new THREE.IcosahedronGeometry(cfg.scale, 2);
    const sphereMat = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.18
    });
    const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    coreGroup.add(globeMesh);

    // Inner Solid-ish Globe
    const innerGeo = new THREE.IcosahedronGeometry(cfg.scale * 0.85, 1);
    const innerMat = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      wireframe: true,
      transparent: true,
      opacity: 0.04
    });
    const innerGlobe = new THREE.Mesh(innerGeo, innerMat);
    coreGroup.add(innerGlobe);

    // Scanner Ring 1 (Medium, X-tilted)
    const ringGeo1 = new THREE.RingGeometry(cfg.scale * 1.48, cfg.scale * 1.51, 64);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.09
    });
    const scannerRing1 = new THREE.Mesh(ringGeo1, ringMat1);
    scannerRing1.rotation.x = Math.PI / 3;
    coreGroup.add(scannerRing1);

    // Scanner Ring 2 (Large, Y-tilted)
    const ringGeo2 = new THREE.RingGeometry(cfg.scale * 1.54, cfg.scale * 1.57, 64);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.06
    });
    const scannerRing2 = new THREE.Mesh(ringGeo2, ringMat2);
    scannerRing2.rotation.y = Math.PI / 4;
    coreGroup.add(scannerRing2);

    // Scanner Ring 3 (Small, Z-tilted)
    const ringGeo3 = new THREE.RingGeometry(cfg.scale * 1.42, cfg.scale * 1.45, 64);
    const ringMat3 = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.05
    });
    const scannerRing3 = new THREE.Mesh(ringGeo3, ringMat3);
    scannerRing3.rotation.z = Math.PI / 6;
    coreGroup.add(scannerRing3);

    cores.push({
      group: coreGroup,
      globe: globeMesh,
      inner: innerGlobe,
      ring1: scannerRing1,
      ring2: scannerRing2,
      ring3: scannerRing3,
      matOuter: sphereMat,
      matInner: innerMat,
      matRing1: ringMat1,
      matRing2: ringMat2,
      matRing3: ringMat3,
      baseScale: cfg.scale,
      baseColor: cfg.color
    });
  });

  // Canvas texture generator for glowing binary characters ('0' or '1')
  function createBinaryTexture(char) {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    // Drawmonospace character
    ctx.font = 'bold 50px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Add green/cyan/blue cyber glow shadow
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 10;
    
    ctx.fillText(char, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }

  const texture0 = createBinaryTexture('0');
  const texture1 = createBinaryTexture('1');

  // Surrounding Network Node Particles (Distributed among the 6 cores, split into binary 0s and 1s)
  const nodeCount = isMobile ? 100 : 1200; // Reduced further on mobile for perf
  const connectionNodeCount = isMobile ? 40 : 350;
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
    const cpX = cfg.x;
    const cpY = cfg.y;
    const cpZ = cfg.z;

    // Generate coordinates relative to parent core center
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = cfg.scale * 1.2 + Math.random() * (cfg.scale * 1.8);

    const xSph = radius * Math.sin(phi) * Math.cos(theta);
    const ySph = radius * Math.sin(phi) * Math.sin(theta);
    const zSph = radius * Math.cos(phi);

    particleOffsets.push({ x: xSph, y: ySph, z: zSph });

    // Drifting velocity vector
    nodeSpeeds.push({
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      z: (Math.random() - 0.5) * 0.003
    });

    if (i < nodeCount0) {
      const idx = i * 3;
      positions0[idx] = cpX + xSph;
      positions0[idx + 1] = cpY + ySph;
      positions0[idx + 2] = cpZ + zSph;

      colors0[idx] = cfg.color.r;
      colors0[idx + 1] = cfg.color.g;
      colors0[idx + 2] = cfg.color.b;
    } else {
      const idx = (i - nodeCount0) * 3;
      positions1[idx] = cpX + xSph;
      positions1[idx + 1] = cpY + ySph;
      positions1[idx + 2] = cpZ + zSph;

      colors1[idx] = cfg.color.r;
      colors1[idx + 1] = cfg.color.g;
      colors1[idx + 2] = cfg.color.b;
    }
  }

  nodesGeo0.setAttribute('position', new THREE.BufferAttribute(positions0, 3));
  nodesGeo0.setAttribute('color', new THREE.BufferAttribute(colors0, 3));

  nodesGeo1.setAttribute('position', new THREE.BufferAttribute(positions1, 3));
  nodesGeo1.setAttribute('color', new THREE.BufferAttribute(colors1, 3));

  const nodesMat0 = new THREE.PointsMaterial({
    size: isMobile ? 0.40 : 0.60,
    map: texture0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.1,
    depthWrite: false
  });

  const nodesMat1 = new THREE.PointsMaterial({
    size: isMobile ? 0.40 : 0.60,
    map: texture1,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.1,
    depthWrite: false
  });

  const nodes0 = new THREE.Points(nodesGeo0, nodesMat0);
  const nodes1 = new THREE.Points(nodesGeo1, nodesMat1);
  mainGroup.add(nodes0);
  mainGroup.add(nodes1);

  // ── GLOBAL FLOATING BINARY STARFIELD (INSANELY WILD BACKDROP) ──
  const globalNodeCount = isMobile ? 200 : 1800;
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
    const y = Math.random() * -50 + 15;
    const z = Math.random() * -100 + 20;

    let pColor = colorGreen;
    if (z < -45) {
      pColor = colorCyan;
    } else if (z < -15) {
      pColor = colorBlue;
    }

    globalSpeeds.push({
      x: (Math.random() - 0.5) * 0.005,
      y: (Math.random() - 0.5) * 0.005,
      z: (Math.random() - 0.5) * 0.005
    });

    if (i < globalNodeCount0) {
      const idx = i * 3;
      globalPos0[idx] = x;
      globalPos0[idx + 1] = y;
      globalPos0[idx + 2] = z;

      globalCol0[idx] = pColor.r;
      globalCol0[idx + 1] = pColor.g;
      globalCol0[idx + 2] = pColor.b;
    } else {
      const idx = (i - globalNodeCount0) * 3;
      globalPos1[idx] = x;
      globalPos1[idx + 1] = y;
      globalPos1[idx + 2] = z;

      globalCol1[idx] = pColor.r;
      globalCol1[idx + 1] = pColor.g;
      globalCol1[idx + 2] = pColor.b;
    }
  }

  globalGeo0.setAttribute('position', new THREE.BufferAttribute(globalPos0, 3));
  globalGeo0.setAttribute('color', new THREE.BufferAttribute(globalCol0, 3));

  globalGeo1.setAttribute('position', new THREE.BufferAttribute(globalPos1, 3));
  globalGeo1.setAttribute('color', new THREE.BufferAttribute(globalCol1, 3));

  const globalMat0 = new THREE.PointsMaterial({
    size: isMobile ? 0.35 : 0.50,
    map: texture0,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.1,
    depthWrite: false
  });

  const globalMat1 = new THREE.PointsMaterial({
    size: isMobile ? 0.35 : 0.50,
    map: texture1,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    alphaTest: 0.1,
    depthWrite: false
  });

  const globalNodes0 = new THREE.Points(globalGeo0, globalMat0);
  const globalNodes1 = new THREE.Points(globalGeo1, globalMat1);
  mainGroup.add(globalNodes0);
  mainGroup.add(globalNodes1);

  // Proximity Connection Lines
  const maxConnections = isMobile ? 60 : 350;
  const lineGeo = new THREE.BufferGeometry();
  const linePositions = new Float32Array(maxConnections * 2 * 3);
  const lineColors = new Float32Array(maxConnections * 2 * 3);

  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
  lineGeo.setAttribute('color', new THREE.BufferAttribute(lineColors, 3));

  const lineMat = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 0.15
  });

  const connectionLines = new THREE.LineSegments(lineGeo, lineMat);
  mainGroup.add(connectionLines);


  // ── SCROLL STATE TRACKING FOR CENTER ALIGNMENT ──
  let isScrolling = false;
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    isScrolling = true;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, 150);
  }, { passive: true });


  // ── GSAP SCROLLTRIGGER TIMELINE ─────────────────
  gsap.registerPlugin(ScrollTrigger);

  // Camera offset: sit IN FRONT of each dome, never inside it
  // This eliminates the backward-clip effect entirely
  const CAM_Z_OFFSET = isMobile ? 3.5 : 5.0;  // camera distance in front of dome
  const CAM_Y_OFFSET = isMobile ? 1.0 : 1.5;   // slight elevation above dome center

  // Build camera waypoints from coreConfigs programmatically
  // Camera sits at (dome.x, dome.y + offset, dome.z + CAM_Z_OFFSET)
  // Camera looks at the NEXT dome center (or straight ahead for the last one)
  function getCamPos(idx) {
    const c = coreConfigs[idx];
    return { x: c.x, y: c.y + CAM_Y_OFFSET, z: c.z + CAM_Z_OFFSET };
  }
  function getLookTarget(idx) {
    // Look at the dome we're currently sitting in front of
    const c = coreConfigs[idx];
    return { x: c.x, y: c.y, z: c.z };
  }

  // Initial camera state: in front of Hero dome, looking at Hero dome
  const initCam = getCamPos(0);
  const initLook = getLookTarget(0);

  const scrollTarget = {
    camX:  initCam.x,
    camY:  initCam.y,
    camZ:  initCam.z,
    lookX: initLook.x,
    lookY: initLook.y,
    lookZ: initLook.z
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6   // tighter scrub = less lag = no perceivable bounce
    }
  });

  // Camera flight: each keyframe moves camera to sit in front of the NEXT dome
  // All Z values strictly decrease (move forward), no backwards motion ever
  for (let i = 1; i < coreConfigs.length; i++) {
    const cam = getCamPos(i);
    const look = getLookTarget(i);
    tl.to(scrollTarget, {
      camX:  cam.x,
      camY:  cam.y,
      camZ:  cam.z,
      lookX: look.x,
      lookY: look.y,
      lookZ: look.z,
      duration: 1.0,
      ease: "none"
    });
  }
  // Final keyframe: drift past the last dome (Contact) for exit
  const lastCfg = coreConfigs[coreConfigs.length - 1];
  tl.to(scrollTarget, {
    camX:  lastCfg.x,
    camY:  lastCfg.y - 5.0,
    camZ:  lastCfg.z - CAM_Z_OFFSET * 2,
    lookX: lastCfg.x,
    lookY: lastCfg.y - 8.0,
    lookZ: lastCfg.z - CAM_Z_OFFSET * 4,
    duration: 1.0,
    ease: "none"
  });


  // ── MOUSE PARALLAX TILT ──────────────────────────
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;

  // Mouse parallax: completely disabled on mobile (touch has no hover),
  // and reduced to very subtle on desktop to prevent misalignment
  const TILT_STRENGTH = isMobile ? 0.0 : 0.08;  // reduced from 0.12

  window.addEventListener('mousemove', (e) => {
    if (isMobile || isScrolling) {
      targetRotationX = 0;
      targetRotationY = 0;
      return;
    }
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    targetRotationY = mouseX * TILT_STRENGTH;
    targetRotationX = -mouseY * TILT_STRENGTH;
  });


  // Handle Resize — also re-check mobile for orientation changes
  window.addEventListener('resize', () => {
    const nowMobile = window.innerWidth < 768;
    camera.fov = nowMobile ? 75 : 60;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let prevCamZ = 0.0;
  let currentParallaxX = 0.0;
  let currentParallaxY = 0.0;

  // ── RENDER LOOP ─────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    // Track scroll velocity for warp effects
    const deltaZ = scrollTarget.camZ - prevCamZ;
    const absoluteSpeedZ = Math.abs(deltaZ);
    prevCamZ = scrollTarget.camZ;

    // Smoothly interpolate current parallax offset (damped to 0 while scrolling)
    const activeTargetX = isScrolling ? 0.0 : targetRotationX;
    const activeTargetY = isScrolling ? 0.0 : targetRotationY;
    currentParallaxX += (activeTargetX - currentParallaxX) * 0.05;
    currentParallaxY += (activeTargetY - currentParallaxY) * 0.05;

    // Apply scroll-driven camera coordinates + camera mouse parallax shift (lookAt keeps targets centered!)
    camera.position.set(
      scrollTarget.camX + currentParallaxY * 4.0, // horizontal camera shift
      scrollTarget.camY + currentParallaxX * 4.0, // vertical camera shift
      scrollTarget.camZ
    );
    camera.lookAt(scrollTarget.lookX, scrollTarget.lookY, scrollTarget.lookZ);

    // Core rotations (spins much faster in projects section)
    cores.forEach((core, idx) => {
      const spinMultiplier = (idx === 3) ? 4.5 : 1.0;
      core.globe.rotation.y += 0.0012 * spinMultiplier;
      core.globe.rotation.x += 0.0005 * spinMultiplier;
      core.inner.rotation.y -= 0.0006 * spinMultiplier;
      core.ring1.rotation.z += 0.0025 * spinMultiplier;
      core.ring2.rotation.x -= 0.0015 * spinMultiplier;
      core.ring3.rotation.y += 0.0020 * spinMultiplier;
    });

    // Update node positions with drift & orbit for both binary meshes
    const posAttr0 = nodesGeo0.getAttribute('position');
    const posAttr1 = nodesGeo1.getAttribute('position');
    const nodesArray0 = posAttr0.array;
    const nodesArray1 = posAttr1.array;

    for (let i = 0; i < nodeCount; i++) {
      const parentIdx = particleParents[i];
      const cfg = coreConfigs[parentIdx];
      const cpX = cfg.x;
      const cpY = cfg.y;
      const cpZ = cfg.z;

      const offset = particleOffsets[i];
      offset.x += nodeSpeeds[i].x;
      offset.y += nodeSpeeds[i].y;
      offset.z += nodeSpeeds[i].z;

      // Wrap-around bounds relative to parent core scale
      const dist = Math.sqrt(offset.x*offset.x + offset.y*offset.y + offset.z*offset.z);
      const maxDist = cfg.scale * 3.5;
      const minDist = cfg.scale * 1.0;
      if (dist > maxDist || dist < minDist) {
        nodeSpeeds[i].x *= -1;
        nodeSpeeds[i].y *= -1;
        nodeSpeeds[i].z *= -1;
      }

      if (i < nodeCount0) {
        const idx = i * 3;
        nodesArray0[idx] = cpX + offset.x;
        nodesArray0[idx + 1] = cpY + offset.y;
        nodesArray0[idx + 2] = cpZ + offset.z;
      } else {
        const idx = (i - nodeCount0) * 3;
        nodesArray1[idx] = cpX + offset.x;
        nodesArray1[idx + 1] = cpY + offset.y;
        nodesArray1[idx + 2] = cpZ + offset.z;
      }
    }
    posAttr0.needsUpdate = true;
    posAttr1.needsUpdate = true;

    // Gentle pulsing micro-animation for local particles
    const pulse = 1.0 + Math.sin(Date.now() * 0.0035) * 0.12;
    nodesMat0.size = (isMobile ? 0.40 : 0.60) * pulse;
    nodesMat1.size = (isMobile ? 0.40 : 0.60) * pulse;

    // Update global drifting particles with scroll-speed warp amplification
    const gPosAttr0 = globalGeo0.getAttribute('position');
    const gPosAttr1 = globalGeo1.getAttribute('position');
    const gNodesArray0 = gPosAttr0.array;
    const gNodesArray1 = gPosAttr1.array;

    const warpFactor = 1.0 + Math.min(absoluteSpeedZ * 12.0, 18.0);
    
    // Scale global particles size & opacity slightly during fast scrolls
    globalMat0.size = (isMobile ? 0.35 : 0.50) * (1.0 + Math.min(absoluteSpeedZ * 1.5, 0.8));
    globalMat1.size = (isMobile ? 0.35 : 0.50) * (1.0 + Math.min(absoluteSpeedZ * 1.5, 0.8));
    globalMat0.opacity = 0.55 + Math.min(absoluteSpeedZ * 0.3, 0.35);
    globalMat1.opacity = 0.55 + Math.min(absoluteSpeedZ * 0.3, 0.35);

    for (let i = 0; i < globalNodeCount; i++) {
      const speed = globalSpeeds[i];
      // Add relative camera speed translation along Z axis (flying opposite of scroll flight direction)
      const dynamicZSpeed = speed.z - deltaZ * 0.45;

      if (i < globalNodeCount0) {
        const idx = i * 3;
        gNodesArray0[idx] += speed.x;
        gNodesArray0[idx + 1] += speed.y;
        gNodesArray0[idx + 2] += dynamicZSpeed * warpFactor;

        if (gNodesArray0[idx] > 27.5 || gNodesArray0[idx] < -27.5) speed.x *= -1;
        if (gNodesArray0[idx + 1] > 15 || gNodesArray0[idx + 1] < -45) speed.y *= -1;
        
        // Wrap-around bounds for depth to keep them inside the active flight volume
        if (gNodesArray0[idx + 2] > 20) {
          gNodesArray0[idx + 2] = -80;
        } else if (gNodesArray0[idx + 2] < -80) {
          gNodesArray0[idx + 2] = 20;
        }
      } else {
        const idx = (i - globalNodeCount0) * 3;
        gNodesArray1[idx] += speed.x;
        gNodesArray1[idx + 1] += speed.y;
        gNodesArray1[idx + 2] += dynamicZSpeed * warpFactor;

        if (gNodesArray1[idx] > 27.5 || gNodesArray1[idx] < -27.5) speed.x *= -1;
        if (gNodesArray1[idx + 1] > 15 || gNodesArray1[idx + 1] < -45) speed.y *= -1;

        if (gNodesArray1[idx + 2] > 20) {
          gNodesArray1[idx + 2] = -80;
        } else if (gNodesArray1[idx + 2] < -80) {
          gNodesArray1[idx + 2] = 20;
        }
      }
    }
    gPosAttr0.needsUpdate = true;
    gPosAttr1.needsUpdate = true;

    // Helper reader for absolute particle positions
    function getParticlePosition(idx) {
      if (idx < nodeCount0) {
        return {
          x: nodesArray0[idx * 3],
          y: nodesArray0[idx * 3 + 1],
          z: nodesArray0[idx * 3 + 2]
        };
      } else {
        const oIdx = (idx - nodeCount0) * 3;
        return {
          x: nodesArray1[oIdx],
          y: nodesArray1[oIdx + 1],
          z: nodesArray1[oIdx + 2]
        };
      }
    }

    // Calculate proximity connection lines dynamically
    const linePosAttr = connectionLines.geometry.getAttribute('position');
    const lineColAttr = connectionLines.geometry.getAttribute('color');
    const linePosArray = linePosAttr.array;
    const lineColArray = lineColAttr.array;

    let lineIndex = 0;
    const threshold = 2.8;
    const thresholdSq = threshold * threshold;

    for (let i = 0; i < connectionNodeCount && lineIndex < maxConnections; i++) {
      const p1 = getParticlePosition(i);
      const parentIdx1 = particleParents[i];
      const cfg1 = coreConfigs[parentIdx1];

      for (let j = i + 1; j < connectionNodeCount && lineIndex < maxConnections; j++) {
        // Fast optimization: only calculate lines between nodes belonging to the same or adjacent cores
        if (particleParents[i] !== particleParents[j]) {
          if (Math.abs(particleParents[i] - particleParents[j]) > 1) {
            continue;
          }
        }

        const p2 = getParticlePosition(j);

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        // Perform fast squared distance check first to avoid Math.sqrt overhead on millions of checks
        if (distSq < thresholdSq) {
          const distance = Math.sqrt(distSq);
          const idx = lineIndex * 6;
          
          linePosArray[idx] = p1.x;
          linePosArray[idx + 1] = p1.y;
          linePosArray[idx + 2] = p1.z;
          
          linePosArray[idx + 3] = p2.x;
          linePosArray[idx + 4] = p2.y;
          linePosArray[idx + 5] = p2.z;

          // Connect matching gradient colors
          const parentIdx2 = particleParents[j];
          const cfg2 = coreConfigs[parentIdx2];

          lineColArray[idx] = cfg1.color.r;
          lineColArray[idx + 1] = cfg1.color.g;
          lineColArray[idx + 2] = cfg1.color.b;

          lineColArray[idx + 3] = cfg2.color.r;
          lineColArray[idx + 4] = cfg2.color.g;
          lineColArray[idx + 5] = cfg2.color.b;

          lineIndex++;
        }
      }
    }

    // Zero out unused line segments
    for (let k = lineIndex; k < maxConnections; k++) {
      const idx = k * 6;
      linePosArray[idx] = 0;
      linePosArray[idx + 1] = 0;
      linePosArray[idx + 2] = 0;
      linePosArray[idx + 3] = 0;
      linePosArray[idx + 4] = 0;
      linePosArray[idx + 5] = 0;
    }

    linePosAttr.needsUpdate = true;
    lineColAttr.needsUpdate = true;

    // mainGroup rotation removed to prevent pendulum/alignment shifts on domes.
    // Parallax is now applied directly to camera positioning.

    renderer.render(scene, camera);
  }

  animate();
})();
