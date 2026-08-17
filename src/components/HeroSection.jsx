import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Shield, Cpu, Activity, Award } from 'lucide-react';

export default function HeroSection() {
  const [counts, setCounts] = useState({ rooms: 0, htb: 0, projects: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const targets = { rooms: 91, htb: 50, projects: 4 };
    const duration = 1500;
    const steps = 50;
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
    : { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center text-center px-4 py-16 md:py-24 relative overflow-hidden">
      {/* Abstract Glowing Accent Ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-[radial-gradient(circle,rgba(0,255,102,0.06)_0%,transparent_70%)] pointer-events-none z-0" />

      <motion.div
        {...enterAnim}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-4xl mx-auto relative"
        style={{ zIndex: 10 }}
      >
        <div
          className="border border-white/5 rounded-2xl p-8 md:p-12 mb-8"
          style={{
            position: 'relative',
            zIndex: 10,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            background: 'rgba(2, 4, 10, 0.50)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          }}
        >
          {/* Category tag */}
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-green/20 bg-green/5 text-green text-[11px] font-mono tracking-widest uppercase mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            Security Tooling &amp; Vulnerability Research
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6">
            Hi, I'm Aaron.<br />
            <span className="text-[#00ff66]" style={{ textShadow: '0 0 20px rgba(0, 255, 102, 0.45), 0 0 40px rgba(0, 255, 102, 0.15)' }}>
              I build security tools.
            </span>
          </h1>

          {/* Sub-headline */}
          <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            Grade 11 cybersecurity researcher building open-source security tools in Python, focused on autonomous fuzzing workflows, threat intelligence parsing, and offensive security automation.
          </p>

          {/* CTA Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="#projects"
              onClick={handleScrollToProjects}
              className="group px-6 py-3 border border-green bg-green/5 hover:bg-green text-green hover:text-black font-mono text-sm font-semibold rounded-md shadow-[0_0_15px_rgba(0,255,102,0.15)] hover:shadow-[0_0_25px_rgba(0,255,102,0.35)] transition-all duration-300 flex items-center gap-2 min-h-[44px]"
            >
              View Projects
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#contact"
              className="px-6 py-3 border border-white/10 hover:border-white/30 text-gray-300 hover:text-white font-mono text-sm rounded-md transition-all duration-300 min-h-[44px]"
            >
              Contact Me
            </a>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {[
            { icon: Shield, value: counts.rooms, label: 'TryHackMe Rooms (Top 1%)', color: 'text-green' },
            { icon: Activity, value: 'Active', label: 'Hack The Box CTFs', color: 'text-cyan' },
            { icon: Award, value: 'GFACT', label: 'CyberStart Canada Scholar', color: 'text-green' },
          ].map((stat) => {
            const StatIcon = stat.icon;
            return (
              <div
                key={stat.label}
                className="p-5 border border-white/5 rounded-lg text-center flex flex-col items-center"
                style={{
                  position: 'relative',
                  zIndex: 10,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  background: 'rgba(255, 255, 255, 0.02)',
                }}
              >
                <StatIcon className={`w-5 h-5 ${stat.color === 'text-green' ? 'text-[#00ff66]' : 'text-[#00d4ff]'} mb-2 opacity-80`} />
                <span className="text-2xl md:text-3xl font-bold text-white font-mono leading-none">
                  {stat.value}
                </span>
                <span className="text-[11px] text-gray-400 mt-2 font-mono uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
