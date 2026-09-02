import React from 'react';
import { Terminal, Shield, Code, Cpu, Award } from 'lucide-react';

export default function OperationalSpecs() {
  const specs = [
    {
      icon: Code,
      label: 'Primary Stack',
      value: 'Python 3.12 (Security Automation & Agents)',
    },
    {
      icon: Terminal,
      label: 'Security Systems',
      value: 'Kali Linux, Docker Sandboxes, Ghidra',
    },
    {
      icon: Shield,
      label: 'Hands-on CTF',
      value: 'TryHackMe (Top 1%, 91 Rooms) & Daily HTB',
    },
    {
      icon: Award,
      label: 'Certification / Scholarship',
      value: 'GIAC GFACT Certified (CyberStart Canada National Scholar)',
    },
  ];

  return (
    <div
      className="border border-white/5 rounded-xl p-6"
      style={{
        position: 'relative',
        zIndex: 10,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        background: 'rgba(2, 4, 10, 0.40)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Cpu className="w-4 h-4 text-[#00ff66]" />
        <h4 className="text-xs font-mono font-bold tracking-widest text-white uppercase">
          Profile Specs
        </h4>
      </div>

      <div className="space-y-4">
        {specs.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] font-mono text-gray-400 uppercase tracking-wider">
                  {item.label}
                </span>
              </div>
              <p className="text-sm font-mono text-slate-200 pl-5.5">
                {item.value}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
        <span className="text-gray-400">Current Standing:</span>
        <span className="text-[#00ff66] font-semibold">Grade 11 Student Researcher</span>
      </div>
    </div>
  );
}
