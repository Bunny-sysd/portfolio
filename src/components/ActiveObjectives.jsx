import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BookOpen, Cpu, Swords } from 'lucide-react';

export default function ActiveObjectives() {
  const prefersReducedMotion = useReducedMotion();

  const objectives = [
    {
      title: 'SANS Institute Scholar',
      text: 'Rigorous training for the GFACT certification, mastering foundational cybersecurity architecture, Linux, and applied cryptography.',
      icon: BookOpen,
      color: 'text-green',
      glow: 'rgba(0, 255, 102, 0.05)'
    },
    {
      title: 'Offensive Lab Environments',
      text: 'Actively escalating privileges and breaking boxes in TryHackMe and HackTheBox (HTB) to validate zero-day theories in simulated enterprise domains.',
      icon: Swords,
      color: 'text-green',
      glow: 'rgba(0, 255, 102, 0.05)'
    },
    {
      title: 'Bug Bounty & Vulnerability Research',
      text: 'Hunting for unauthenticated logic flaws and injection vulnerabilities in live web applications and API endpoints.',
      icon: Cpu,
      color: 'text-cyan',
      glow: 'rgba(0, 212, 255, 0.05)'
    }
  ];

  return (
    <div
      className="border border-white/5 rounded-2xl p-8"
      style={{
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(2, 4, 10, 0.50)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      }}
    >
      <h3 className="font-mono text-xs uppercase tracking-widest text-[#00ff66] mb-6">Active Objectives</h3>
      <div className="grid grid-cols-1 gap-4">
        {objectives.map((obj, i) => {
          const Icon = obj.icon;
          const enterAnim = prefersReducedMotion
            ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
            : { initial: { opacity: 0, y: 15 }, animate: { opacity: 1, y: 0 } };

          return (
            <motion.div
              key={obj.title}
              {...enterAnim}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={prefersReducedMotion ? {} : { y: -2, borderColor: 'rgba(255,255,255,0.12)', boxShadow: `0 8px 30px ${obj.glow}` }}
              className="p-5 border border-white/5 bg-[rgba(15,20,36,0.25)] backdrop-blur-md rounded-lg transition-all duration-300 relative overflow-hidden group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-md bg-white/[0.02] border border-white/5 ${obj.color === 'text-green' ? 'text-[#00ff66]' : 'text-[#00d4ff]'} group-hover:bg-white/[0.05] transition-colors duration-300`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1">
                  <h4 className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1.5">{obj.title}</h4>
                  <p className="text-sm text-gray-300 leading-relaxed font-sans">{obj.text}</p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
