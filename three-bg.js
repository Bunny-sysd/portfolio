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
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });

  // Mobile/Performance detection
  const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
  renderer.setPixelRatio(isMobile ? 1.0 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Main interactive group containing all visual objects
  const mainGroup = new THREE.Group();
  scene.add(mainGroup);

  // Color Definitions (Cyber Theme)
  const colorGreen = new THREE.Color('#00ff66');
  const colorBlue = new THREE.Color('#0066ff');
  const colorCyan = new THREE.Color('#00d4ff');

  // Core configurations mapping to the 6 sections in index.html
  const coreConfigs = [
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
    const posX = isMobile ? 0.0 : cfg.x;
    coreGroup.position.set(posX, cfg.y, cfg.z);
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

    // Scanner Ring
    const ringGeo = new THREE.RingGeometry(cfg.scale * 1.5, cfg.scale * 1.53, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: cfg.color.clone(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.08
    });
    const scannerRing = new THREE.Mesh(ringGeo, ringMat);
    scannerRing.rotation.x = Math.PI / 3;
    coreGroup.add(scannerRing);

    cores.push({
      group: coreGroup,
      globe: globeMesh,
      inner: innerGlobe,
      ring: scannerRing,
      matOuter: sphereMat,
      matInner: innerMat,
      matRing: ringMat,
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
  const nodeCount = isMobile ? 44 : 150; // Even number for equal division
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
    const cpX = isMobile ? 0.0 : cfg.x;
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
    size: isMobile ? 0.38 : 0.55,
    map: texture0,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    alphaTest: 0.1,
    depthWrite: false
  });

  const nodesMat1 = new THREE.PointsMaterial({
    size: isMobile ? 0.38 : 0.55,
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

  // Proximity Connection Lines
  const maxConnections = isMobile ? 25 : 120;
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


  // ── GSAP SCROLLTRIGGER TIMELINE ─────────────────
  gsap.registerPlugin(ScrollTrigger);

  // Animatable camera flight parameters
  const scrollTarget = {
    camX: isMobile ? 0.0 : 2.0,
    camY: 0.0,
    camZ: 0.0,
    lookX: isMobile ? 0.0 : -2.0,
    lookY: -6.0,
    lookZ: -12.0
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2
    }
  });

  // Camera flight trajectory: holding plateaus alternate with dynamic space flights
  tl
    // Hero Plateau: hold at Core 1 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : 2.0,
      camY: 0.0,
      camZ: 0.0,
      lookX: isMobile ? 0.0 : -2.0,
      lookY: -6.0,
      lookZ: -12.0,
      duration: 0.5
    })
    // Flight 1: Core 1 to Core 2 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : -2.0,
      camY: -6.0,
      camZ: -12.0,
      lookX: isMobile ? 0.0 : 2.0,
      lookY: -12.0,
      lookZ: -24.0,
      duration: 0.5,
      ease: "power2.inOut"
    })
    // About Plateau: hold at Core 2 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : -2.0,
      camY: -6.0,
      camZ: -12.0,
      lookX: isMobile ? 0.0 : 2.0,
      lookY: -12.0,
      lookZ: -24.0,
      duration: 0.5
    })
    // Flight 2: Core 2 to Core 3 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : 2.0,
      camY: -12.0,
      camZ: -24.0,
      lookX: isMobile ? 0.0 : -1.8,
      lookY: -18.0,
      lookZ: -36.0,
      duration: 0.5,
      ease: "power2.inOut"
    })
    // Skills Plateau: hold at Core 3 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : 2.0,
      camY: -12.0,
      camZ: -24.0,
      lookX: isMobile ? 0.0 : -1.8,
      lookY: -18.0,
      lookZ: -36.0,
      duration: 0.5
    })
    // Flight 3: Core 3 to Core 4 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : -1.8,
      camY: -18.0,
      camZ: -36.0,
      lookX: isMobile ? 0.0 : 1.8,
      lookY: -24.0,
      lookZ: -48.0,
      duration: 0.5,
      ease: "power2.inOut"
    })
    // Projects Plateau: hold at Core 4 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : -1.8,
      camY: -18.0,
      camZ: -36.0,
      lookX: isMobile ? 0.0 : 1.8,
      lookY: -24.0,
      lookZ: -48.0,
      duration: 0.5
    })
    // Flight 4: Core 4 to Core 5 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : 1.8,
      camY: -24.0,
      camZ: -48.0,
      lookX: 0.0,
      lookY: -30.0,
      lookZ: -60.0,
      duration: 0.5,
      ease: "power2.inOut"
    })
    // Certs Plateau: hold at Core 5 center
    .to(scrollTarget, {
      camX: isMobile ? 0.0 : 1.8,
      camY: -24.0,
      camZ: -48.0,
      lookX: 0.0,
      lookY: -30.0,
      lookZ: -60.0,
      duration: 0.5
    })
    // Flight 5: Core 5 to Core 6 center
    .to(scrollTarget, {
      camX: 0.0,
      camY: -30.0,
      camZ: -60.0,
      lookX: 0.0,
      lookY: -30.0,
      lookZ: -66.0,
      duration: 0.5,
      ease: "power2.inOut"
    })
    // Contact Plateau: hold at Core 6 center
    .to(scrollTarget, {
      camX: 0.0,
      camY: -30.0,
      camZ: -60.0,
      lookX: 0.0,
      lookY: -30.0,
      lookZ: -66.0,
      duration: 0.5
    });


  // ── MOUSE PARALLAX TILT ──────────────────────────
  let mouseX = 0, mouseY = 0;
  let targetRotationX = 0, targetRotationY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(e.clientY / window.innerHeight) * 2 + 1;

    // Subtle tilting angles
    targetRotationY = mouseX * 0.35;
    targetRotationX = -mouseY * 0.35;
  });

  // Handle Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });


  // ── RENDER LOOP ─────────────────────────────────
  function animate() {
    requestAnimationFrame(animate);

    // Apply scroll-driven camera coordinates
    camera.position.set(scrollTarget.camX, scrollTarget.camY, scrollTarget.camZ);
    camera.lookAt(scrollTarget.lookX, scrollTarget.lookY, scrollTarget.lookZ);

    // Core rotations (spins much faster in projects section)
    cores.forEach((core, idx) => {
      const spinMultiplier = (idx === 3) ? 4.5 : 1.0;
      core.globe.rotation.y += 0.0012 * spinMultiplier;
      core.globe.rotation.x += 0.0005 * spinMultiplier;
      core.inner.rotation.y -= 0.0006 * spinMultiplier;
      core.ring.rotation.z += 0.003 * spinMultiplier;
    });

    // Update node positions with drift & orbit for both binary meshes
    const posAttr0 = nodesGeo0.getAttribute('position');
    const posAttr1 = nodesGeo1.getAttribute('position');
    const nodesArray0 = posAttr0.array;
    const nodesArray1 = posAttr1.array;

    for (let i = 0; i < nodeCount; i++) {
      const parentIdx = particleParents[i];
      const cfg = coreConfigs[parentIdx];
      const cpX = isMobile ? 0.0 : cfg.x;
      const cpY = cfg.y;
      const cpZ = cfg.z;

      const offset = particleOffsets[i];
      offset.x += nodeSpeeds[i].x;
      offset.y += nodeSpeeds[i].y;
      offset.z += nodeSpeeds[i].z;

      // Wrap-around bounds relative to parent core scale
      const dist = Math.sqrt(offset.x*offset.x + offset.y*offset.y + offset.z*offset.z);
      const maxDist = cfg.scale * 3.0;
      const minDist = cfg.scale * 1.1;
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
    const threshold = 2.4;

    for (let i = 0; i < nodeCount && lineIndex < maxConnections; i++) {
      const p1 = getParticlePosition(i);
      const parentIdx1 = particleParents[i];
      const cfg1 = coreConfigs[parentIdx1];

      for (let j = i + 1; j < nodeCount && lineIndex < maxConnections; j++) {
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
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < threshold) {
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

    // Mouse tilt calculations (lerped on top of main coordinates)
    mainGroup.rotation.y += (targetRotationY - mainGroup.rotation.y) * 0.05;
    mainGroup.rotation.x += (targetRotationX - mainGroup.rotation.x) * 0.05;

    renderer.render(scene, camera);
  }

  animate();
})();
