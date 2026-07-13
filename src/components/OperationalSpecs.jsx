import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Brain, Layers, ShieldCheck, Cpu, Activity } from 'lucide-react';

export default function OperationalSpecs() {
  const specs = [
    {
      label: 'HOST_OS',
      value: 'Kali Linux / Kernel v6.12',
      desc: 'Base operating environment hosting secure scripts.',
      icon: Cpu,
      color: 'text-cyan'
    },
    {
      label: 'LOCAL_MODEL',
      value: 'Gemma-4-Security-FineTune',
      desc: 'Locally hosted AI model for autonomous auditing.',
      icon: Brain,
      color: 'text-green'
    },
    {
      label: 'TARGET_ARCH',
      value: 'x86_64 ELF / PE32 Binaries',
      desc: 'Primary binary compilation architectures targets audited.',
      icon: Layers,
      color: 'text-cyan'
    },
    {
      label: 'ACTIVE_MISSION',
      value: 'Closed-Loop Binary Patching',
      desc: 'Main system objective for autonomous code vulnerability remediation.',
      icon: ShieldCheck,
      color: 'text-green'
    },
    {
      label: 'SANDBOX_LAB',
      value: 'VM Sandbox / Host Isolation',
      desc: 'Isolated network sandbox environment for malware safety.',
      icon: Terminal,
      color: 'text-cyan'
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 mt-6">
      {specs.map((spec, i) => {
        const IconComponent = spec.icon;
        return (
          <motion.div
            key={spec.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
            className="p-4 border border-[rgba(255,255,255,0.05)] bg-[rgba(15,20,36,0.35)] backdrop-blur-md rounded-[4px] relative overflow-hidden group hover:border-[rgba(0,255,102,0.2)] transition-all duration-300"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <span className="text-[10px] tracking-wider text-[#4f5e75] font-mono block mb-1">
                  {spec.label}:
                </span>
                <span className="text-sm font-semibold text-white font-mono block leading-snug">
                  {spec.value}
                </span>
                <p className="text-[11px] text-[#A0AAB0] mt-1 leading-normal">
                  {spec.desc}
                </p>
              </div>
              <IconComponent className={`w-4 h-4 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${spec.color === 'text-green' ? 'text-[#00ff66]' : 'text-[#00d4ff]'}`} />
            </div>
          </motion.div>
        );
      })}

      {/* PIPELINE STATUS */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: specs.length * 0.08 }}
        className="p-4 border border-[rgba(255,255,255,0.05)] bg-[rgba(15,20,36,0.35)] backdrop-blur-md rounded-[4px] relative overflow-hidden group hover:border-[rgba(0,255,102,0.2)] transition-all duration-300"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] tracking-wider text-[#4f5e75] font-mono block mb-1">
              PIPELINE_STATUS:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#00ff66] font-mono">
                [ ACTIVE_MONITORING ]
              </span>
            </div>
            <p className="text-[11px] text-[#A0AAB0] mt-1 leading-normal">
              Continuous integration status monitors.
            </p>
          </div>
          <div className="flex items-center gap-2 pr-1">
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="w-2.5 h-2.5 rounded-full bg-[#00ff66] shadow-[0_0_8px_#00ff66]"
            />
            <Activity className="w-4 h-4 text-[#00ff66] opacity-60" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
