import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Crosshair, Bug, ShieldCheck, Zap, Activity, Terminal } from 'lucide-react';

// ─── GLSL SHADERS ───────────────────────────────────────────────────────────
const VERT_SRC = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG_SRC = `
precision mediump float;
uniform float u_time;
uniform vec2 u_resolution;

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Scale for grid density
  vec2 grid = uv * 28.0;

  // Topographic sine-wave distortion — slow drift
  grid.y += sin(grid.x * 0.4 + u_time * 0.12) * 2.2;
  grid.x += cos(grid.y * 0.35 + u_time * 0.09) * 1.6;

  // Height field for contour bands
  float h = sin(uv.x * 4.5 + u_time * 0.07) * cos(uv.y * 3.2 - u_time * 0.05);
  h += sin((uv.x + uv.y) * 6.5 + u_time * 0.1) * 0.35;

  // Wireframe grid lines
  vec2 f = fract(grid);
  float lx = smoothstep(0.0, 0.035, f.x) * smoothstep(1.0, 0.965, f.x);
  float ly = smoothstep(0.0, 0.035, f.y) * smoothstep(1.0, 0.965, f.y);
  float wire = 1.0 - min(lx, ly);

  // Contour isolines from height field
  float contour = fract(h * 7.0);
  float cLine = smoothstep(0.0, 0.055, contour) * smoothstep(0.11, 0.055, contour);

  float intensity = max(wire * 0.12, cLine * 0.22);

  // Edge vignette fade
  float fade = smoothstep(0.0, 0.12, uv.x) * smoothstep(1.0, 0.88, uv.x)
             * smoothstep(0.0, 0.12, uv.y) * smoothstep(1.0, 0.88, uv.y);

  vec3 color = vec3(0.0, 1.0, 0.4) * intensity * fade;
  gl_FragColor = vec4(color, 1.0);
}`;

// ─── WEBGL BOOTSTRAP ────────────────────────────────────────────────────────
function initShaderCanvas(canvas) {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // Fullscreen quad
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const pos = gl.getAttribLocation(prog, 'a_position');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  return {
    gl,
    timeLoc: gl.getUniformLocation(prog, 'u_time'),
    resLoc: gl.getUniformLocation(prog, 'u_resolution'),
    cleanup: () => { gl.deleteProgram(prog); gl.deleteShader(vs); gl.deleteShader(fs); gl.deleteBuffer(buf); }
  };
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function MutagenCard() {
  const containerRef = useRef(null);
  const cardRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const lastMoveRef = useRef(0);
  const [isMobile, setIsMobile] = useState(false);

  // ── Accessibility: respect OS-level reduced motion ──
  const prefersReducedMotion = useReducedMotion();
  const disableTilt = isMobile || prefersReducedMotion;

  // ── Dampened 3D tilt via Framer Motion ──
  // Heavy friction spring: high damping kills wobble, controlled stiffness prevents overshoot
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const springCfg = { stiffness: 100, damping: 30, mass: 1 };

  // Clamp tilt to ±10 degrees max — prevents violent flipping on fast mouse swipes
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), springCfg);
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), springCfg);

  // ── Debounced mouse handler (16ms throttle — one frame at 60fps) ──
  const onMove = useCallback((e) => {
    if (disableTilt || !containerRef.current) return;

    const now = performance.now();
    if (now - lastMoveRef.current < 16) return; // 16ms throttle
    lastMoveRef.current = now;

    const r = containerRef.current.getBoundingClientRect();
    // Normalize to [-0.5, 0.5] range
    const normalX = (e.clientX - r.left) / r.width - 0.5;
    const normalY = (e.clientY - r.top) / r.height - 0.5;

    // Clamp input values to prevent extreme readings from fast cursor edge exits
    mx.set(Math.max(-0.5, Math.min(0.5, normalX)));
    my.set(Math.max(-0.5, Math.min(0.5, normalY)));
  }, [disableTilt, mx, my]);

  const onLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  // ── Viewport tracking ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // ── WebGL lifecycle — disabled on mobile and reduced motion ──
  useEffect(() => {
    if (disableTilt || !canvasRef.current) return;
    const ctx = initShaderCanvas(canvasRef.current);
    if (!ctx) return;

    const { gl, timeLoc, resLoc, cleanup } = ctx;
    const t0 = performance.now();

    const resize = () => {
      const rect = canvasRef.current.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvasRef.current.width = rect.width * dpr;
      canvasRef.current.height = rect.height * dpr;
      gl.viewport(0, 0, canvasRef.current.width, canvasRef.current.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const loop = () => {
      gl.uniform1f(timeLoc, (performance.now() - t0) / 1000);
      gl.uniform2f(resLoc, canvasRef.current.width, canvasRef.current.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      cleanup();
    };
  }, [disableTilt]);

  // ── Data ──
  const stats = [
    { label: 'TARGETS_SCANNED', value: '2,847', icon: Crosshair, desc: 'Binary targets ingested' },
    { label: 'VULNS_CONFIRMED', value: '156', icon: Bug, desc: 'Crash-verified exploits' },
    { label: 'PATCHES_DEPLOYED', value: '89', icon: ShieldCheck, desc: 'Source-level auto-fixes' },
    { label: 'PIPELINE_UPTIME', value: '99.7%', icon: Activity, desc: 'Continuous operation' },
  ];

  const stages = [
    { tag: 'INGEST', desc: 'Binary + source intake' },
    { tag: 'GHIDRA', desc: 'Headless decompiler' },
    { tag: 'FUZZ', desc: 'Overflow crash hunt' },
    { tag: 'ANALYZE', desc: 'Root-cause triage' },
    { tag: 'PATCH', desc: 'Auto-fix source buffers' },
    { tag: 'VERIFY', desc: 'Re-fuzz validation' },
  ];

  // ── Mobile tap-scale props (simple, lightweight) ──
  const mobileTapProps = isMobile ? { whileTap: { scale: 0.98 } } : {};

  return (
    <div 
      ref={containerRef}
      onMouseMove={disableTilt ? undefined : onMove}
      onMouseLeave={disableTilt ? undefined : onLeave}
      style={{ perspective: disableTilt ? 'none' : '1200px' }} 
      className="w-full max-w-3xl mx-auto mt-8 mb-4 cursor-pointer"
    >
      <motion.div
        ref={cardRef}
        style={disableTilt ? {} : {
          rotateX: rotX,
          rotateY: rotY,
          transformStyle: 'preserve-3d',
        }}
        {...mobileTapProps}
        className="relative w-full border border-[rgba(0,255,102,0.1)] rounded-lg overflow-hidden"
      >
        {/* ── Shader bg / Mobile tactical grid fallback ── */}
        {(isMobile || prefersReducedMotion) ? (
          <div className="absolute inset-0 z-0" style={{
            background: '#02040a',
            backgroundImage: `
              linear-gradient(rgba(0,255,102,0.035) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,255,102,0.035) 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }} />
        ) : (
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0" style={{ background: '#02040a' }} />
        )}

        {/* ── Content ── */}
        <div className="relative z-10 p-6 md:p-8" style={{ background: 'linear-gradient(180deg, rgba(2,4,10,0.65) 0%, rgba(2,4,10,0.92) 100%)' }}>

          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <Zap className="w-5 h-5 text-[#00ff66] shrink-0" />
            <h3 className="text-white font-mono text-base md:text-lg font-bold tracking-wider leading-tight">
              MUTAGEN ZERO-DAY FUZZER
            </h3>
          </div>
          <p className="text-[#A0AAB0] font-mono text-[11px] mb-6 ml-8">
            Autonomous binary vulnerability discovery &amp; patch synthesis pipeline
          </p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mb-6">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-3 border border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.45)] rounded-[4px] group">
                  <Icon className="w-3.5 h-3.5 text-[#00ff66] mb-1.5 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="text-white font-mono text-lg font-bold block leading-none">{s.value}</span>
                  <span className="text-[#4f5e75] font-mono text-[9px] tracking-wider block mt-1">{s.label}</span>
                  <span className="text-[#A0AAB0] text-[10px] block mt-0.5 leading-tight">{s.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Pipeline flow */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none snap-x snap-mandatory pb-1">
            {stages.map((st, i) => (
              <React.Fragment key={st.tag}>
                <div className="flex flex-col items-center px-2 py-1.5 min-h-[44px] min-w-[72px] justify-center border border-[rgba(0,255,102,0.12)] bg-[rgba(0,255,102,0.025)] rounded-[3px] shrink-0 snap-center">
                  <span className="font-mono text-[10px] tracking-wider text-[#00ff66] font-bold">{st.tag}</span>
                  <span className="font-mono text-[8px] text-[#4f5e75] mt-0.5">{st.desc}</span>
                </div>
                {i < stages.length - 1 && (
                  <span className="text-[#00ff66] font-mono text-[10px] px-1 shrink-0 opacity-40">→</span>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Console footer */}
          <div className="flex items-center gap-2 mt-4 p-3 border border-[rgba(255,255,255,0.04)] bg-[rgba(0,0,0,0.5)] rounded-[4px] font-mono text-[10px]">
            <Terminal className="w-3 h-3 text-[#00ff66] shrink-0" />
            <span className="text-[#00ff66] font-bold">&gt;</span>
            <span className="text-[#00d4ff] truncate">fuzzer.run() // scanning 3 active targets on x86_64 ELF pipeline...</span>
            <motion.span
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="w-1.5 h-3.5 bg-[#00ff66] ml-auto shrink-0"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
