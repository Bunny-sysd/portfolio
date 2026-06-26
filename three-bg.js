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

  // Color Definitions (Cyber Theme: Green, Blue, Black/Cyan)
  const colorGreen = new THREE.Color('#00ff66');
  const colorBlue = new THREE.Color('#0066ff');
  const colorCyan = new THREE.Color('#00d4ff');

  // 1. Shifting Focal Core (Wireframe Globe)
  const sphereGeo = new THREE.IcosahedronGeometry(1.6, 2);
  const sphereMat = new THREE.MeshBasicMaterial({
    color: colorGreen.clone(),
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
  mainGroup.add(globeMesh);

  // Inner solid core with low opacity
  const innerGeo = new THREE.IcosahedronGeometry(1.4, 1);
  const innerMat = new THREE.MeshBasicMaterial({
    color: colorCyan.clone(),
    wireframe: true,
    transparent: true,
    opacity: 0.04
  });
  const innerGlobe = new THREE.Mesh(innerGeo, innerMat);
  mainGroup.add(innerGlobe);

  // Orbiting scanner ring
  const ringGeo = new THREE.RingGeometry(2.4, 2.45, 64);
  const ringMat = new THREE.MeshBasicMaterial({
    color: colorCyan.clone(),
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.08
  });
  const scannerRing = new THREE.Mesh(ringGeo, ringMat);
  scannerRing.rotation.x = Math.PI / 3;
  mainGroup.add(scannerRing);

  // 2. Surrounding Network Node Particles
  const nodeCount = isMobile ? 45 : 150; // Optimized particle buffer
  const nodesGeo = new THREE.BufferGeometry();
  
  // Coordinate Arrays for Particle Constellations
  const basePositions = [];
  const skillsPositions = [];
  const projectsPositions = [];
  const contactPositions = [];
  
  const positions = new Float32Array(nodeCount * 3);
  const colors = new Float32Array(nodeCount * 3);
  const nodeSpeeds = [];

  for (let i = 0; i < nodeCount; i++) {
    // A. Base spherical layout (starts orbiting around the focal node)
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const radius = 2.0 + Math.random() * 2.5;

    const xSph = radius * Math.sin(phi) * Math.cos(theta);
    const ySph = radius * Math.sin(phi) * Math.sin(theta);
    const zSph = radius * Math.cos(phi);

    basePositions.push({ x: xSph, y: ySph, z: zSph });

    positions[i * 3] = xSph;
    positions[i * 3 + 1] = ySph;
    positions[i * 3 + 2] = zSph;

    // Drifting velocity vector
    nodeSpeeds.push({
      x: (Math.random() - 0.5) * 0.002,
      y: (Math.random() - 0.5) * 0.002,
      z: (Math.random() - 0.5) * 0.002
    });

    // B. Skills stage coords (split into 3 local constellations)
    let cx = 0, cy = 0, cz = 0;
    if (i % 3 === 0) { // Cluster 1: Left-Top
      cx = -2.5; cy = 1.5; cz = 0.5;
    } else if (i % 3 === 1) { // Cluster 2: Right-Center
      cx = 2.5; cy = -0.5; cz = -1.0;
    } else { // Cluster 3: Bottom-Left
      cx = -1.5; cy = -2.0; cz = 1.0;
    }
    skillsPositions.push({
      x: cx + (Math.random() - 0.5) * 1.2,
      y: cy + (Math.random() - 0.5) * 1.2,
      z: cz + (Math.random() - 0.5) * 1.2
    });

    // C. Projects horizontal scan plane coords
    projectsPositions.push({
      x: (Math.random() - 0.5) * 8.0,
      y: -2.0 + (Math.random() - 0.5) * 0.6,
      z: (Math.random() - 0.5) * 8.0
    });

    // D. Contact wide star constellation
    contactPositions.push({
      x: (Math.random() - 0.5) * 16.0,
      y: (Math.random() - 0.5) * 16.0,
      z: (Math.random() - 0.5) * 16.0
    });

    // Colors: mix of green, blue, cyan
    const colorChance = Math.random();
    let selectedColor = colorGreen;
    if (colorChance > 0.7) selectedColor = colorBlue;
    else if (colorChance > 0.4) selectedColor = colorCyan;

    colors[i * 3] = selectedColor.r;
    colors[i * 3 + 1] = selectedColor.g;
    colors[i * 3 + 2] = selectedColor.b;
  }

  nodesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  nodesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const nodesMat = new THREE.PointsMaterial({
    size: isMobile ? 0.08 : 0.12,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });

  const nodes = new THREE.Points(nodesGeo, nodesMat);
  mainGroup.add(nodes);

  // 3. Proximity Connection Lines
  const maxConnections = isMobile ? 25 : 120; // Drastically optimized mobile connection checking
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

  // Animatable configuration object
  const scrollTarget = {
    // Morph blend weights
    factorSkills: 0,
    factorProjects: 0,
    factorContact: 0,

    // Shifting Focal Globe Core values (scale, coordinates, color index)
    globeScale: isMobile ? 3.2 : 5.0,  // HUGE core representing one giant particle on landing page
    globeX: isMobile ? 0 : 2.4,        // Aligned right on desktop to clear text
    globeY: isMobile ? -1.0 : 0.0,
    globeZ: 0,
    globeOpacity: 0.18,
    colorFactor: 0.0,                  // 0 = Green, 1 = Blue, 2 = Green, 3 = Blue, 4 = Cyan

    // Camera parameters
    cameraZ: isMobile ? 9.0 : 7.0,
    cameraY: 0.0,
    cameraRotationX: 0.0,
    cameraRotationY: 0.0
  };

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 1.2
    }
  });

  // Dynamic Scroll Transitions
  tl
    // 1. Transition into About: focal core shrinks and shifts left
    .to(scrollTarget, {
      globeScale: 0.9,
      globeX: isMobile ? 0 : -2.2,
      globeY: isMobile ? 1.0 : 0.0,
      globeOpacity: 0.12,
      colorFactor: 1.0,  // Morphs color to Cyber Blue
      cameraZ: isMobile ? 6.5 : 5.5,
      duration: 1
    })
    // 2. Transition into Skills: focal core shifts right, particles morph to clusters
    .to(scrollTarget, {
      factorSkills: 1.0,
      globeScale: 1.1,
      globeX: isMobile ? 0 : 2.4,
      globeY: isMobile ? -1.2 : 0.0,
      colorFactor: 2.0,  // Morphs color back to Green
      cameraZ: isMobile ? 8.0 : 6.0,
      cameraRotationY: -0.15,
      duration: 1
    })
    // 3. Transition into Projects: focal core shrinks further, shifts bottom-right
    .to(scrollTarget, {
      factorSkills: 0.0,
      factorProjects: 1.0,
      globeScale: 0.65,
      globeX: isMobile ? 0 : 1.8,
      globeY: isMobile ? -1.5 : -1.0,
      colorFactor: 3.0,  // Morphs color back to Blue
      cameraZ: isMobile ? 7.5 : 5.5,
      cameraY: -1.2,
      cameraRotationX: 0.28,
      duration: 1
    })
    // 4. Transition into Contact: center out, expand to constellation stars
    .to(scrollTarget, {
      factorProjects: 0.0,
      factorContact: 1.0,
      globeScale: 1.0,
      globeX: 0,
      globeY: 0,
      globeOpacity: 0.08,
      colorFactor: 4.0,  // Morphs color to Cyan
      cameraZ: isMobile ? 11.0 : 9.5,
      cameraY: 0,
      cameraRotationX: 0,
      cameraRotationY: 0.4,
      duration: 1
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

    // Apply scroll triggers from GSAP targets
    camera.position.z = scrollTarget.cameraZ;
    camera.position.y = scrollTarget.cameraY;
    camera.rotation.x = scrollTarget.cameraRotationX;
    camera.rotation.y = scrollTarget.cameraRotationY;
    
    // Core transforms (Shifting focal globe core)
    globeMesh.position.x = scrollTarget.globeX;
    globeMesh.position.y = scrollTarget.globeY;
    globeMesh.position.z = scrollTarget.globeZ;
    
    innerGlobe.position.copy(globeMesh.position);
    scannerRing.position.copy(globeMesh.position);

    globeMesh.scale.set(scrollTarget.globeScale, scrollTarget.globeScale, scrollTarget.globeScale);
    innerGlobe.scale.copy(globeMesh.scale);
    scannerRing.scale.set(scrollTarget.globeScale * 1.3, scrollTarget.globeScale * 1.3, scrollTarget.globeScale * 1.3);

    sphereMat.opacity = scrollTarget.globeOpacity;

    // Apply Color Blending on the shifting focal core
    let activeColor = new THREE.Color();
    const factor = scrollTarget.colorFactor;
    if (factor < 1) {
      activeColor.lerpColors(colorGreen, colorBlue, factor);
    } else if (factor < 2) {
      activeColor.lerpColors(colorBlue, colorGreen, factor - 1);
    } else if (factor < 3) {
      activeColor.lerpColors(colorGreen, colorBlue, factor - 2);
    } else {
      activeColor.lerpColors(colorBlue, colorCyan, Math.min(factor - 3, 1));
    }
    
    sphereMat.color.copy(activeColor);
    innerMat.color.copy(activeColor);
    ringMat.color.copy(activeColor);

    // Core rotations (spins much faster in projects section)
    const spinMultiplier = scrollTarget.factorProjects > 0.5 ? 4.5 : 1.0;
    globeMesh.rotation.y += 0.0012 * spinMultiplier;
    globeMesh.rotation.x += 0.0005 * spinMultiplier;
    innerGlobe.rotation.y -= 0.0006 * spinMultiplier;
    scannerRing.rotation.z += 0.003 * spinMultiplier;

    // Calculate node coordinates based on animation morph factors
    const posAttr = nodesGeo.getAttribute('position');
    const nodesArray = posAttr.array;

    for (let i = 0; i < nodeCount; i++) {
      // Base sphere coords + noise drift
      const base = basePositions[i];
      base.x += nodeSpeeds[i].x;
      base.y += nodeSpeeds[i].y;
      base.z += nodeSpeeds[i].z;

      // Wrap-around bounds limit
      const dist = Math.sqrt(base.x*base.x + base.y*base.y + base.z*base.z);
      if (dist > 4.5 || dist < 2.0) {
        nodeSpeeds[i].x *= -1;
        nodeSpeeds[i].y *= -1;
        nodeSpeeds[i].z *= -1;
      }

      // Linear interpolations for morphing targets
      let x = base.x;
      let y = base.y;
      let z = base.z;

      // Local offset relative to shifting focal globe core
      x += globeMesh.position.x;
      y += globeMesh.position.y;
      z += globeMesh.position.z;

      // Morph to Skills Clusters
      x = x + (skillsPositions[i].x - x) * scrollTarget.factorSkills;
      y = y + (skillsPositions[i].y - y) * scrollTarget.factorSkills;
      z = z + (skillsPositions[i].z - z) * scrollTarget.factorSkills;

      // Morph to Projects Grid Plane
      x = x + (projectsPositions[i].x - x) * scrollTarget.factorProjects;
      y = y + (projectsPositions[i].y - y) * scrollTarget.factorProjects;
      z = z + (projectsPositions[i].z - z) * scrollTarget.factorProjects;

      // Morph to Contact Wide Space
      x = x + (contactPositions[i].x - x) * scrollTarget.factorContact;
      y = y + (contactPositions[i].y - y) * scrollTarget.factorContact;
      z = z + (contactPositions[i].z - z) * scrollTarget.factorContact;

      nodesArray[i * 3] = x;
      nodesArray[i * 3 + 1] = y;
      nodesArray[i * 3 + 2] = z;
    }
    posAttr.needsUpdate = true;

    // Calculate proximity connection lines dynamically
    const linePosAttr = connectionLines.geometry.getAttribute('position');
    const lineColAttr = connectionLines.geometry.getAttribute('color');
    const linePosArray = linePosAttr.array;
    const lineColArray = lineColAttr.array;

    let lineIndex = 0;
    const threshold = scrollTarget.factorContact > 0.5 ? 4.5 : 1.6;

    for (let i = 0; i < nodeCount && lineIndex < maxConnections; i++) {
      const x1 = nodesArray[i * 3];
      const y1 = nodesArray[i * 3 + 1];
      const z1 = nodesArray[i * 3 + 2];

      const r1 = colors[i * 3];
      const g1 = colors[i * 3 + 1];
      const b1 = colors[i * 3 + 2];

      for (let j = i + 1; j < nodeCount && lineIndex < maxConnections; j++) {
        const x2 = nodesArray[j * 3];
        const y2 = nodesArray[j * 3 + 1];
        const z2 = nodesArray[j * 3 + 2];

        const dx = x1 - x2;
        const dy = y1 - y2;
        const dz = z1 - z2;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        if (distance < threshold) {
          const idx = lineIndex * 6;
          
          linePosArray[idx] = x1;
          linePosArray[idx + 1] = y1;
          linePosArray[idx + 2] = z1;
          
          linePosArray[idx + 3] = x2;
          linePosArray[idx + 4] = y2;
          linePosArray[idx + 5] = z2;

          // Connect matching gradient colors
          lineColArray[idx] = r1;
          lineColArray[idx + 1] = g1;
          lineColArray[idx + 2] = b1;

          lineColArray[idx + 3] = colors[j * 3];
          lineColArray[idx + 4] = colors[j * 3 + 1];
          lineColArray[idx + 5] = colors[j * 3 + 2];

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
