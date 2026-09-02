import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Shield, Cpu, Activity, Award, Terminal } from 'lucide-react';

export default function HeroSection() {
  const [counts, setCounts] = useState({ rooms: 0, htb: 0, projects: 0 });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const targets = { rooms: 91, htb: 50, projects: 4 };
    const duration = 1600;
    const steps = 40;
    const interval = duration / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      setCounts({
        rooms: Math.min(Math.round((targets.rooms / steps) * step), targets.rooms),
        htb: Math.min(Math.round((targets.htb / steps) * step), targets.htb),
        projects: Math.min(Math.round((targets.projects / steps) * step), targets.projects),
      });

      if (step >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  const handleScrollToProjects = (e) => {
    e.preventDefault();
    const projectsSec = document.getElementById('projects');
    if (projectsSec) {
      projectsSec.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const enterAnim = prefersReducedMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-[92dvh] flex flex-col justify-center items-center text-center px-4 py-20 md:py-32 relative overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] md:w-[850px] h-[450px] md:h-[850px] bg-[radial-gradient(circle,rgba(0,255,102,0.08)_0%,rgba(0,229,255,0.03)_45%,transparent_70%)] pointer-events-none z-0" />

      <motion.div
        {...enterAnim}
        transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto relative z-10 w-full"
      >
        {/* Double-Bezel Main Hero Card (Active Theory / Basement Machined Architecture) */}
        <div className="double-bezel-outer p-1.5 md:p-2 rounded-[2rem] md:rounded-[2.5rem] bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl mb-12 shadow-2xl transition-all duration-500 hover:border-white/20">
          <div className="double-bezel-inner rounded-[calc(2rem-0.375rem)] md:rounded-[calc(2.5rem-0.5rem)] p-8 md:p-16 bg-[#03060f]/85 border border-white/[0.08] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] relative overflow-hidden">
            
            {/* Top Coordinate Eyebrow */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-8 pb-6 border-b border-white/[0.06] text-[11px] font-mono tracking-widest text-slate-400">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                [ 00 // AUTONOMOUS CYBER DEFENSE ]
              </div>
              <span className="text-slate-500 uppercase tracking-widest hidden sm:inline">
                CLEARANCE // LEVEL-5 TS
              </span>
              <span className="text-cyan-400 font-mono">
                COORD // 43.6532° N, 79.3832° W
              </span>
            </div>

            {/* Monumental Typographic Title (Syne / Clash Display Tier) */}
            <h1 className="hero-monumental-heading text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight leading-[0.95] mb-8 uppercase font-['Syne',sans-serif]">
              AARON ALVA<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff66] via-[#00e5ff] to-[#ffffff] drop-shadow-[0_0_35px_rgba(0,255,102,0.4)]">
                SECURITY RESEARCHER
              </span>
            </h1>

            {/* Editorial Lead Paragraph */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-12 font-sans font-light tracking-wide">
              Grade 11 Cybersecurity Researcher &amp; Systems Developer pioneering <span className="text-white font-medium">autonomous fuzzing engines</span>, compiler vulnerability harnesses, and low-level Linux exploit automation.
            </p>

            {/* Awwwards-Tier Nested CTA Architecture */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <a
                href="#projects"
                onClick={handleScrollToProjects}
                className="group relative inline-flex items-center justify-between gap-4 px-7 py-3.5 rounded-full bg-[#00ff66] text-[#03060f] font-mono font-bold text-sm tracking-wider uppercase transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(0,255,102,0.6)] min-h-[50px]"
              >
                <span>EXPLORE ZERO-DAY LABS</span>
                <span className="w-7 h-7 rounded-full bg-[#03060f]/15 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
                  <ArrowUpRight className="w-4 h-4 text-[#03060f]" />
                </span>
              </a>

              <a
                href="#contact"
                className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-white/30 text-white font-mono text-sm tracking-wider uppercase transition-all duration-300 min-h-[50px]"
              >
                <span>TRANSMIT SIGNAL</span>
                <Terminal className="w-4 h-4 text-cyan-400 transition-transform group-hover:rotate-12" />
              </a>
            </div>
          </div>
        </div>

        {/* Double-Bezel Operational Telemetry Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          {[
            {
              icon: Shield,
              value: `${counts.rooms}+ Completed`,
              badge: 'TOP 1% WORLDWIDE',
              label: 'TRYHACKME DEFENSIVE & OFFENSIVE',
              color: 'emerald',
            },
            {
              icon: Activity,
              value: 'Active Player',
              badge: 'PROVING GROUNDS',
              label: 'HACK THE BOX CTF ARSENAL',
              color: 'cyan',
            },
            {
              icon: Award,
              value: 'GIAC GFACT',
              badge: 'GFACT CERTIFIED',
              label: 'SANS CYBERSTART SCHOLAR',
              color: 'emerald',
            },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-white/20 transition-all duration-300 group"
              >
                <div className="p-5 rounded-[calc(1rem-2px)] bg-[#03060f]/80 border border-white/[0.04] text-center flex flex-col items-center justify-between h-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="flex items-center justify-between w-full mb-3">
                    <StatIcon className={`w-4 h-4 ${stat.color === 'emerald' ? 'text-[#00ff66]' : 'text-[#00e5ff]'} opacity-90`} />
                    <span className="text-[9px] font-mono tracking-widest px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-400 border border-white/[0.06]">
                      {stat.badge}
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight my-1">
                    {stat.value}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
