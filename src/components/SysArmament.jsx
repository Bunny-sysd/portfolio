import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Eye, Binary, Cloud, Brain, Swords, X, ArrowRight, Activity, Terminal, Zap } from 'lucide-react';

/* deterministic hash for particle speed variation */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export default function SysArmament() {
  const [activeTab, setActiveTab] = useState('redteam');
  const [isMobile, setIsMobile] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [connData, setConnData] = useState(null);
  const [hoveredTool, setHoveredTool] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [hoveredSkillName, setHoveredSkillName] = useState(null);

  const containerRef = useRef(null);
  const tabRefs = useRef({});
  const toolRefs = useRef({});
  const hubRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 0) setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    const t = setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', handleResize); };
  }, []);

  const tabs = [
    { id: 'redteam', label: 'RED TEAM', icon: Swords },
    { id: 'blueteam', label: 'BLUE TEAM', icon: Shield },
    { id: 'recon', label: 'OSINT & RECON', icon: Eye },
    { id: 'reversing', label: 'REVERSE ENGINEERING', icon: Binary },
    { id: 'cloud', label: 'CLOUD & INFRA', icon: Cloud },
    { id: 'aiml', label: 'AI / ML SECURITY', icon: Brain }
  ];

  /* ═══════════════════════════════════════════════════
     TOOL DETAILS — title · summary · use-case scenario
     ═══════════════════════════════════════════════════ */
  const toolDetails = {
    // ── RED TEAM ──
    'Metasploit': { title: 'Metasploit Exploitation Framework', summary: 'Industry standard for exploit development, payload generation, and remote code execution.', scenario: 'Built custom Ruby exploits and executed payloads to verify remote buffer overflows in secure sandbox containers.' },
    'Cobalt Strike': { title: 'Cobalt Strike Red Team C2', summary: 'Adversary simulation software for post-exploitation, threat beaconing, and lateral movement.', scenario: 'Configured custom malleable C2 profiles to evaluate detection rules and trace bypass flags inside secure network perimeters.' },
    'Sliver C2': { title: 'Sliver Cross-Platform C2 Framework', summary: 'Open-source adversary emulation framework from Bishop Fox supporting mTLS, HTTPS, DNS transports.', scenario: 'Deployed cross-platform implants using DNS-over-HTTPS tunneling to evade corporate DLP and egress filtering.' },
    'Mythic C2': { title: 'Mythic Modular C2 Framework', summary: 'Containerized micro-service C2 with research-first design and custom agent crafting.', scenario: 'Built bespoke Mythic agents with unique callback protocols to bypass signature-based C2 detection engines.' },
    'AdaptixC2': { title: 'AdaptixC2 Extensible Framework', summary: 'Open-source C2 with modular extender architecture for custom payloads and cross-platform ops.', scenario: 'Deployed lab-specific payloads through the extender API, testing detection coverage across multiple EDR vendors.' },
    'Evilginx3': { title: 'Evilginx3 Reverse-Proxy Phishing', summary: 'Advanced Man-in-the-Middle reverse proxy framework designed to bypass MFA security.', scenario: 'Captured session cookies and authorization keys in controlled environments, bypassing hardware-key MFA configurations.' },
    'Burp Suite Pro': { title: 'Burp Suite Web Security Suite', summary: 'Industry leading web application traffic interceptor, scanner, and payload sequencer.', scenario: 'Discovered critical IDORs and SSRF vulnerabilities across production bug bounty targets using custom Intruder payloads.' },
    'Sqlmap': { title: 'Sqlmap SQL Injection Scanner', summary: 'Advanced automation tool for SQL injection flaw discovery and database extraction.', scenario: 'Automated blind SQL injection exploitation, mapping database schemas and dumping tables over rate-limited endpoints.' },
    'CrackMapExec': { title: 'CrackMapExec AD Exploitation', summary: 'Post-exploitation network scanner for Active Directory domain auditing and lateral movement.', scenario: 'Automated credential spray attacks and lateral movement across Windows domains via SMB and WMI protocols.' },
    'Mimikatz': { title: 'Mimikatz Windows Credential Extractor', summary: 'Exploit tool to dump passwords, hash keys, and Kerberos tickets from Windows LSASS memory.', scenario: 'Extracted clear-text credentials and generated golden tickets to demonstrate complete domain controller compromises.' },
    'BloodHound': { title: 'BloodHound Active Directory Mapper', summary: 'Graph theory tool for mapping attack paths inside complex Active Directory domains.', scenario: 'Mapped trust paths and permission relationships, locating shortest paths to Domain Admin status in enterprise environments.' },
    'Responder': { title: 'Responder NetBIOS Poisoner', summary: 'LLMNR, NBT-NS and MDNS poisoner for harvesting NTLMv2 hashes inside internal networks.', scenario: 'Captured NetBIOS session hashes during internal network penetration tests to gain initial domain access.' },
    'PoshC2': { title: 'PoshC2 Proxy-Aware C2 Framework', summary: 'Python-based, OPSEC-focused C2 framework with built-in AMSI bypass and proxy-aware comms.', scenario: 'Evaded endpoint detection during red team engagements by routing beacons through legitimate proxy infrastructure.' },
    'Impacket': { title: 'Impacket Network Protocol Toolkit', summary: 'Python library for low-level network protocol manipulation including SMB, MSRPC, and Kerberos.', scenario: 'Used secretsdump.py and psexec.py to extract NTDS.dit and execute commands remotely on domain controllers.' },
    'Caldera': { title: 'Caldera Automated Adversary Emulation', summary: 'MITRE ATT&CK-mapped automated adversary emulation platform for structured red team exercises.', scenario: 'Ran end-to-end ATT&CK chain simulations and generated gap analysis reports identifying 23 undetected techniques.' },
    'TURNt': { title: 'TURNt Covert Traffic Routing', summary: 'Covert C2 routing through web conferencing TURN media servers to exploit enterprise whitelists.', scenario: 'Established high-bandwidth interactive C2 sessions disguised as legitimate video conferencing media traffic.' },
    'PentAGI': { title: 'PentAGI Autonomous Pentest Agent', summary: 'Multi-agent AI system for fully autonomous penetration testing with knowledge graph memory.', scenario: 'Deployed autonomous recon-to-exploit pipeline that chained Nmap discovery, Metasploit exploitation, and report generation without human input.' },
    // ── BLUE TEAM ──
    'Velociraptor': { title: 'Velociraptor Endpoint Forensics', summary: 'Powerful endpoint visibility and hunt tool for querying thousands of endpoints in real-time.', scenario: 'Ran live VQL queries across 500+ endpoints to detect persistence mechanisms during active incident response.' },
    'Atomic Red Team': { title: 'Atomic Red Team Detection Validation', summary: 'MITRE ATT&CK-mapped test library for validating detection rules and SIEM alert coverage.', scenario: 'Executed T1059 and T1053 atomics to verify Splunk correlation rules triggered correctly for command execution.' },
    'Sysmon': { title: 'Sysmon Advanced Event Logging', summary: 'Microsoft system monitor providing detailed telemetry on process creation, network connections, and file changes.', scenario: 'Deployed SwiftOnSecurity-tuned Sysmon configs to capture high-fidelity events while filtering background noise.' },
    'YARA Rules': { title: 'YARA Malware Pattern Matching', summary: 'Pattern-matching engine for identifying and classifying malware families based on binary signatures.', scenario: 'Wrote custom YARA rules to detect polymorphic RAT variants across quarantined samples in automated sandboxes.' },
    'Suricata': { title: 'Suricata Network IDS/IPS', summary: 'High-performance network intrusion detection and prevention engine with protocol analysis.', scenario: 'Tuned Suricata rulesets to detect lateral movement traffic patterns while maintaining sub-millisecond packet inspection.' },
    'Splunk SIEM': { title: 'Splunk Security Information & Event Management', summary: 'Enterprise log aggregation, correlation, and threat hunting platform.', scenario: 'Built correlation searches and dashboard panels to detect anomalous authentication patterns across distributed endpoints.' },
    'TheHive / Cortex': { title: 'TheHive Incident Response Platform', summary: 'Open-source Security Incident Response Platform with built-in analyzer integrations.', scenario: 'Orchestrated multi-analyst case management workflows with automated IOC enrichment via Cortex analyzers.' },
    'GreyNoise': { title: 'GreyNoise Internet Intelligence', summary: 'Internet-wide scanner that classifies noise from targeted attacks to reduce analyst fatigue.', scenario: 'Filtered 70% of false positive alerts by classifying incoming IPs as known internet scanners vs targeted threats.' },
    'Wazuh XDR': { title: 'Wazuh Open-Source XDR & SIEM', summary: 'Comprehensive free SIEM and XDR with file integrity monitoring, vulnerability detection, and incident response.', scenario: 'Deployed Wazuh agents fleet-wide for unified FIM, rootkit detection, and CIS compliance scanning across hybrid infrastructure.' },
    'Arkime': { title: 'Arkime Full Packet Capture', summary: 'Large-scale indexed packet capture and search system for retrospective network traffic analysis.', scenario: 'Performed retrospective PCAP analysis on 48 hours of network traffic to reconstruct full attack chain timelines.' },
    'OpenCTI': { title: 'OpenCTI Threat Intelligence Platform', summary: 'Modern threat intel platform with relationship visualization and MITRE ATT&CK integration.', scenario: 'Correlated threat actor TTPs across multiple campaigns using OpenCTI graph analysis to predict next-stage attack vectors.' },
    'MISP': { title: 'MISP IOC Sharing Platform', summary: 'Community-driven malware information sharing platform for indicator of compromise distribution.', scenario: 'Automated IOC ingestion pipelines feeding MISP indicators directly into Suricata and Splunk detection rules.' },
    'Tines SOAR': { title: 'Tines No-Code Security Orchestration', summary: 'No-code SOAR platform for automating repetitive SOC workflows across disparate security tools.', scenario: 'Built automated playbooks that triaged phishing alerts, extracted IOCs, and quarantined endpoints in under 90 seconds.' },
    'Falco': { title: 'Falco Runtime Security', summary: 'eBPF-powered cloud-native runtime threat detection for containers and Kubernetes workloads.', scenario: 'Detected container escape attempts and anomalous syscall patterns in production Kubernetes clusters in real-time.' },
    'Cyber Triage': { title: 'Cyber Triage Automated IR', summary: 'Automated endpoint forensic collection and analysis for rapid incident investigation.', scenario: 'Reduced mean-time-to-investigate from hours to minutes by automating artifact collection across compromised hosts.' },
    'Maltrail': { title: 'Maltrail Malicious Traffic Detector', summary: 'Open-source traffic detection system matching against known malicious indicators and patterns.', scenario: 'Detected beaconing behavior to known C2 infrastructure by correlating DNS query patterns against threat feeds.' },
    // ── OSINT & RECON ──
    'Nmap / Masscan': { title: 'Network Discovery & Port Scanning', summary: 'Tools for target host discovery, large range sweeping, and live service enumeration.', scenario: 'Swept public server IP ranges during target discovery, identifying unpatched services in under a minute with Masscan.' },
    'Nuclei Scanner': { title: 'Nuclei Template-Based Vuln Scanner', summary: 'YAML-template-based vulnerability scanner for rapid, customizable web service testing.', scenario: 'Wrote custom nuclei templates to detect newly disclosed zero-days across large enterprise attack surfaces.' },
    'Subfinder / Amass': { title: 'Subdomain Enumeration Engines', summary: 'Passive and active subdomain discovery tools for comprehensive attack surface mapping.', scenario: 'Chained Subfinder with httpx and Nuclei to automate discovery-to-vulnerability pipelines across bug bounty scopes.' },
    'Maltego': { title: 'Maltego Link Analysis Platform', summary: 'Graph-based OSINT platform for visualizing complex relationships between domains, IPs, and entities.', scenario: 'Mapped organizational infrastructure relationships to identify shadow IT and forgotten cloud assets.' },
    'SpiderFoot': { title: 'SpiderFoot OSINT Automation', summary: 'Automation framework integrating 100+ data sources for comprehensive target reconnaissance.', scenario: 'Ran automated recon pipelines correlating domain registrations, email addresses, and social media profiles.' },
    'Shodan / Censys': { title: 'Internet-Connected Device Search', summary: 'Search engines for discovering exposed services, IoT devices, and misconfigured infrastructure.', scenario: 'Identified unprotected MongoDB instances and exposed Kubernetes dashboards across target IP ranges.' },
    'BBOT': { title: 'BBOT Recursive Internet Scanner', summary: 'Modular, recursive internet scanner for large-scale attack surface mapping and OSINT.', scenario: 'Mapped complete external attack surfaces including forgotten subdomains, cloud buckets, and exposed APIs.' },
    'Maigret': { title: 'Maigret Username Intelligence', summary: 'Advanced username enumeration across thousands of sites with cross-account correlation.', scenario: 'Traced target usernames across 2000+ platforms to build comprehensive digital footprint profiles.' },
    'GitDorker': { title: 'GitDorker Secret Scanner', summary: 'GitHub reconnaissance tool for finding leaked secrets, API keys, and configuration files.', scenario: 'Discovered hardcoded AWS keys and database credentials in public repositories during bug bounty engagements.' },
    'Photon Crawler': { title: 'Photon High-Speed OSINT Crawler', summary: 'Ultra-fast crawler extracting URLs, endpoints, JS files, and hidden parameters from targets.', scenario: 'Extracted hidden API endpoints and authentication tokens from minified JavaScript bundles on target domains.' },
    'EyeDex': { title: 'EyeDex Exposed File Search', summary: 'Specialized search engine for publicly exposed files across FTP servers and cloud storage.', scenario: 'Discovered misconfigured backup archives and database dumps exposed on forgotten FTP servers during recon.' },
    'RECOX': { title: 'RECOX All-in-One Recon Toolkit', summary: 'Consolidated recon toolkit combining subdomain enumeration, port scanning, WHOIS, and DNS lookups.', scenario: 'Streamlined initial asset discovery phase into a single automated pipeline, reducing recon time by 60%.' },
    'WhatsMyName': { title: 'WhatsMyName Username OSINT', summary: 'Cross-platform username enumeration for mapping entity digital footprints across hundreds of sites.', scenario: 'Identified developer accounts and secondary infrastructure by correlating usernames across code hosting platforms.' },
    'httpx': { title: 'httpx Fast HTTP Prober', summary: 'High-speed HTTP probing toolkit for live host detection, tech fingerprinting, and status checking.', scenario: 'Filtered 10,000+ subdomains to 200 live targets with tech stack identification in under 2 minutes.' },
    // ── REVERSE ENGINEERING ──
    'Ghidra Pro': { title: 'Ghidra Binary Decompiler', summary: 'NSA-developed professional grade software reverse engineering suite with built-in decompiler.', scenario: 'Reverse engineered target ELF and PE32 binaries, locating buffer size restrictions, stack canary structures, and memory leak flags.' },
    'IDA Pro': { title: 'IDA Pro Interactive Disassembler', summary: 'Industry standard disassembler and debugger with the most extensive processor architecture support.', scenario: 'Performed deep analysis of packed malware samples, identifying custom encryption routines and anti-debugging checks.' },
    'Binary Ninja': { title: 'Binary Ninja Modern RE Platform', summary: 'Modern reverse engineering platform with powerful intermediate language and automation APIs.', scenario: "Automated vulnerability pattern detection across firmware images using Binary Ninja's HLIL scripting API." },
    'Radare2 / Cutter': { title: 'Radare2 Extensible RE Framework', summary: 'Highly flexible command-line framework for binary analysis with Cutter GUI frontend.', scenario: 'Scripted automated binary diffing workflows to identify patched vulnerabilities across firmware version releases.' },
    'x64dbg': { title: 'x64dbg Windows Debugger', summary: 'Open-source Windows debugger for dynamic analysis of 32-bit and 64-bit executables.', scenario: 'Traced malware unpacking routines in real-time, dumping decrypted payloads from memory at OEP breakpoints.' },
    'GDB + GEF': { title: 'GDB Enhanced Features Debugger', summary: 'GNU Debugger with GEF extension for exploit development and binary analysis on Linux.', scenario: 'Analyzed register values at breakpoint offsets to map stack buffer corruption and ROP chain entry points.' },
    'Binwalk': { title: 'Binwalk Firmware Extractor', summary: 'Firmware analysis tool for scanning, extracting, and reverse engineering embedded file systems.', scenario: 'Extracted hidden file systems from IoT device firmware images, discovering hardcoded credentials and debug interfaces.' },
    'PeStudio': { title: 'PeStudio PE File Analyzer', summary: 'Quick triage utility for Windows executables analyzing imports, strings, entropy, and indicators.', scenario: 'Triaged suspicious executables by analyzing import tables and entropy scores to identify packed malware samples.' },
    'Angr': { title: 'Angr Symbolic Execution Engine', summary: 'Python framework for binary analysis using symbolic execution and constraint solving.', scenario: 'Used symbolic execution to automatically discover input sequences that trigger buffer overflows in CTF challenges.' },
    'Firmware Ninja': { title: 'Firmware Ninja FW Analysis Plugin', summary: 'Binary Ninja extension for constructing memory maps and interpreting hardware peripheral interactions.', scenario: 'Mapped embedded device memory regions and decoded peripheral register access patterns in bare-metal firmware.' },
    'ONEKEY': { title: 'ONEKEY Automated FW Security', summary: 'Automated firmware analysis platform for uncovering vulnerabilities in RTOS and IoT devices at scale.', scenario: 'Scanned 50+ IoT firmware images in parallel, identifying default credentials and known CVEs across device families.' },
    'Saleae Logic': { title: 'Saleae Logic Protocol Analyzer', summary: 'Hardware signal capture and analysis for SPI, I2C, UART, and other embedded communication protocols.', scenario: 'Captured and decoded UART debug output from IoT devices to extract boot sequences and authentication handshakes.' },
    // ── CLOUD & INFRA ──
    'Proxmox VE': { title: 'Proxmox VE Hypervisor Platform', summary: 'Enterprise-grade open-source virtualization platform for building isolated security labs.', scenario: 'Built virtual lab network segments to deploy active malware nodes under complete host isolation.' },
    'Docker Sandboxes': { title: 'Docker Container Isolation', summary: 'Containerized software deployment for secure resource sandboxing and reproducible environments.', scenario: 'Ran automated exploit scripts inside disposable Docker containers, restricting target filesystem access completely.' },
    'Kali Linux': { title: 'Kali Linux Penetration Testing OS', summary: 'Security-focused operating system with 600+ pre-compiled penetration testing tools.', scenario: 'Maintained customized Kali images configured with custom proxy pipelines for continuous bug bounty operations.' },
    'Prowler': { title: 'Prowler Cloud Security Auditor', summary: 'Multi-cloud security posture assessment tool mapping to CIS, NIST, and PCI-DSS frameworks.', scenario: 'Audited AWS accounts identifying 47 critical IAM misconfigurations and over-privileged service roles.' },
    'Pacu': { title: 'Pacu AWS Exploitation Framework', summary: 'Open-source framework specifically for AWS penetration testing and privilege escalation.', scenario: 'Discovered and exploited IAM privilege escalation paths from read-only roles to full admin access in test accounts.' },
    'Scout Suite': { title: 'Scout Suite Multi-Cloud Auditor', summary: 'Multi-cloud auditing tool providing comprehensive security posture reports for AWS, Azure, GCP.', scenario: 'Generated cross-cloud compliance reports identifying S3 bucket misconfigs and Azure AD conditional access gaps.' },
    'PfSense IDS': { title: 'PfSense Firewall & IDS Router', summary: 'Custom security firewall system with intrusion detection and network segmentation.', scenario: 'Configured strict network rules to isolate malware detonation segments from communicating with public interfaces.' },
    'Wireshark': { title: 'Wireshark Protocol Analyzer', summary: 'SSL keylog integration for deep packet inspection and encrypted traffic analysis.', scenario: 'Decrypted and analyzed TLS-encrypted command streams, identifying C2 beaconing patterns in captured traffic.' },
    'Terraform': { title: 'Terraform IaC Security Scanning', summary: 'Infrastructure as Code tool for auditing cloud resource configurations before deployment.', scenario: 'Scanned Terraform plans with tfsec to catch security misconfigurations before they reached production environments.' },
    'Routersploit': { title: 'Routersploit IoT Exploitation', summary: 'Dedicated framework for exploiting vulnerabilities in embedded devices, routers, and IoT firmware.', scenario: 'Exploited default credentials and known CVEs on home routers to demonstrate IoT attack surface risks.' },
    'Kubescape': { title: 'Kubescape K8s Risk Analysis', summary: 'Comprehensive Kubernetes risk analysis, security compliance, and misconfiguration scanning.', scenario: 'Identified 12 critical RBAC misconfigurations and exposed service accounts across production EKS clusters.' },
    'Kube-hunter': { title: 'Kube-hunter K8s Attack Simulation', summary: 'Kubernetes penetration testing tool that simulates real-world attack vectors against clusters.', scenario: 'Discovered exposed kubelet APIs and unauthenticated etcd endpoints in staging Kubernetes deployments.' },
    'Peirates': { title: 'Peirates K8s Post-Exploitation', summary: 'Specialized post-exploitation toolkit for Kubernetes environments after initial cluster access.', scenario: 'Escalated from compromised pod to cluster-admin by exploiting mounted service account tokens and RBAC gaps.' },
    // ── AI / ML SECURITY ──
    'LoRA / QLoRA': { title: 'LoRA/QLoRA Fine-Tuning', summary: 'Parameter-efficient fine-tuning technique for adapting large language models to security tasks.', scenario: 'Fine-tuned local Llama-3-8B on static analysis datasets to automatically classify buffer overflow patterns in C code.' },
    'vLLM Inference': { title: 'vLLM High-Throughput Inference', summary: 'High-throughput LLM serving engine with PagedAttention for sub-second token generation.', scenario: 'Deployed quantized models locally, serving real-time log anomaly detection with sub-200ms response times.' },
    'Llama.cpp': { title: 'Llama.cpp Model Quantization', summary: 'C/C++ port of Llama inference supporting GGUF quantization for local hardware deployment.', scenario: 'Quantized LLM weights to 4-bit GGUF format, enabling fast security model execution on standard developer laptops.' },
    'LangGraph Agents': { title: 'LangGraph Multi-Agent Orchestration', summary: 'Library for building stateful, multi-agent workflows with loops and conditional decisions.', scenario: 'Engineered multi-agent loops that run code linters, generate bug fixes, and verify compilation stability autonomously.' },
    'NeMo Guardrails': { title: 'NeMo AI Safety Guardrails', summary: 'Toolkit for adding safety rules, prompt sanitization, and dialog flows to LLM APIs.', scenario: 'Implemented input/output rails to block adversarial prompt injections targeting internal chat interfaces.' },
    'HuggingFace': { title: 'HuggingFace Transformers Library', summary: 'ML API library for running state-of-the-art tokenizers, model weights, and fine-tuning pipelines.', scenario: 'Built tokenization classification pipelines to automatically categorize and triage incoming exploit payloads.' },
    'PyTorch': { title: 'PyTorch Deep Learning Framework', summary: 'Python-based machine learning library for tensor computation and neural network training.', scenario: 'Trained anomaly detection classifiers on network flow datasets to identify beaconing traffic patterns.' },
    'Promptfoo': { title: 'Promptfoo LLM Red Teaming', summary: 'Open-source tool for testing and fuzzing LLM prompts to identify security gaps in AI systems.', scenario: 'Fuzzed production LLM endpoints with adversarial prompts to identify jailbreak vectors and data exfiltration paths.' },
    'Giskard': { title: 'Giskard AI Agent Security Testing', summary: 'Platform for multi-turn stress testing of LLM agents for hallucinations, bias, and safety.', scenario: 'Performed dynamic multi-turn stress tests on agentic AI systems to identify context-dependent failure modes.' },
    'METATRON': { title: 'METATRON Offline AI Pentest Assistant', summary: 'Privacy-first AI penetration testing assistant running local LLMs via Ollama with zero data exfiltration.', scenario: 'Ran fully offline agentic pentest loops against lab targets, generating professional PDF reports without any cloud dependency.' },
    'Confident AI': { title: 'Confident AI Automated Testing', summary: 'Automated adversarial AI testing with CI/CD integration for 50+ vulnerability categories.', scenario: 'Integrated into deployment pipelines to automatically test LLM endpoints for prompt injection and data leakage before production release.' },
    'Rebuff AI': { title: 'Rebuff AI Prompt Injection Defense', summary: 'Self-hardening prompt injection detection framework using multi-layer LLM defense.', scenario: 'Deployed canary token detection and heuristic analysis layers to catch injection attempts across customer-facing chatbots.' },
  };

  /* ═══════════════════════════════════════
     SKILL DATA — category → skill list
     ═══════════════════════════════════════ */
  const skillData = {
    redteam: {
      title: 'Red Team Operations',
      consoleMsg: 'status: active // adversary simulation framework loaded...',
      skills: [
        'Metasploit', 'Cobalt Strike', 'Sliver C2', 'Mythic C2',
        'AdaptixC2', 'Evilginx3', 'Burp Suite Pro', 'Sqlmap',
        'CrackMapExec', 'Mimikatz', 'BloodHound', 'Responder',
        'PoshC2', 'Impacket', 'Caldera', 'TURNt', 'PentAGI'
      ]
    },
    blueteam: {
      title: 'Blue Team Defense',
      consoleMsg: 'status: monitoring // detection validation pipeline synchronized.',
      skills: [
        'Velociraptor', 'Atomic Red Team', 'Sysmon', 'YARA Rules',
        'Suricata', 'Splunk SIEM', 'TheHive / Cortex', 'GreyNoise',
        'Wazuh XDR', 'Arkime', 'OpenCTI', 'MISP',
        'Tines SOAR', 'Falco', 'Cyber Triage', 'Maltrail'
      ]
    },
    recon: {
      title: 'OSINT & Reconnaissance',
      consoleMsg: 'status: scanning // passive enumeration channels active...',
      skills: [
        'Nmap / Masscan', 'Nuclei Scanner', 'Subfinder / Amass', 'Maltego',
        'SpiderFoot', 'Shodan / Censys', 'BBOT', 'Maigret',
        'GitDorker', 'Photon Crawler', 'EyeDex', 'RECOX',
        'WhatsMyName', 'httpx'
      ]
    },
    reversing: {
      title: 'Reverse Engineering',
      consoleMsg: 'status: disassembly // binary decompilation targets queued...',
      skills: [
        'Ghidra Pro', 'IDA Pro', 'Binary Ninja', 'Radare2 / Cutter',
        'x64dbg', 'GDB + GEF', 'Binwalk', 'PeStudio',
        'Angr', 'Firmware Ninja', 'ONEKEY', 'Saleae Logic'
      ]
    },
    cloud: {
      title: 'Cloud & Infrastructure',
      consoleMsg: 'status: hypervisor isolation active // cloud audit running...',
      skills: [
        'Proxmox VE', 'Docker Sandboxes', 'Kali Linux', 'Prowler',
        'Pacu', 'Scout Suite', 'PfSense IDS', 'Wireshark',
        'Terraform', 'Routersploit', 'Kubescape', 'Kube-hunter',
        'Peirates'
      ]
    },
    aiml: {
      title: 'AI / ML Security',
      consoleMsg: 'status: model weights loaded // tokenized safety gates synchronized.',
      skills: [
        'LoRA / QLoRA', 'vLLM Inference', 'Llama.cpp', 'LangGraph Agents',
        'NeMo Guardrails', 'HuggingFace', 'PyTorch', 'Promptfoo',
        'Giskard', 'METATRON', 'Confident AI', 'Rebuff AI'
      ]
    }
  };

  const currentTab = skillData[activeTab];

  /* ─── Split tools into 2 staggered rows ─── */
  const skills = currentTab.skills;
  const mid = Math.ceil(skills.length / 2);
  const topRow = skills.slice(0, mid);
  const bottomRow = skills.slice(mid);
  /* When both rows have equal count, translateX offsets row 2 for stagger */
  const needsOffset = topRow.length === bottomRow.length;

  const handleSkillClick = (skillName) => {
    const details = toolDetails[skillName];
    if (details) setSelectedSkill({ name: skillName, ...details });
    else setSelectedSkill({ name: skillName, title: skillName, summary: 'Security tool configured inside research lab.', scenario: 'Utilized this tool during target investigation.' });
  };

  /* ─── Hub-based Connection Geometry ─── */
  const updateConnections = useCallback(() => {
    if (isMobile) { setConnData(null); return; }
    const container = containerRef.current;
    const hubEl = hubRef.current;
    const activeTabEl = tabRefs.current[activeTab];
    if (!container || !hubEl || !activeTabEl) return;

    const cr = container.getBoundingClientRect();
    const tr = activeTabEl.getBoundingClientRect();
    const hr = hubEl.getBoundingClientRect();

    const tabX = tr.left - cr.left + tr.width / 2;
    const tabY = tr.top - cr.top + tr.height;
    const hubX = hr.left - cr.left + hr.width / 2;
    const hubY = hr.top - cr.top + hr.height / 2;

    const branches = skills.map(skill => {
      const el = toolRefs.current[skill];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { id: skill, x: r.left - cr.left + r.width / 2, y: r.top - cr.top };
    }).filter(Boolean);

    setConnData({ tabX, tabY, hubX, hubY, branches });
  }, [activeTab, isMobile, skills]);

  useEffect(() => {
    updateConnections();
    const t1 = setTimeout(updateConnections, 80);
    const t2 = setTimeout(updateConnections, 300);
    window.addEventListener('resize', updateConnections);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener('resize', updateConnections); };
  }, [updateConnections]);

  /* ─── Tooltips ─── */
  const handleMouseEnter = (skill, event) => {
    if (isMobile) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const container = containerRef.current;
    if (!container) return;
    const cr = container.getBoundingClientRect();
    setTooltipPos({ x: rect.left - cr.left + rect.width / 2, y: rect.top - cr.top - 8 });
    setHoveredTool(toolDetails[skill] || { title: skill, summary: 'Security tool.' });
    setHoveredSkillName(skill);
  };
  const handleMouseLeave = () => {
    if (isMobile) return;
    setHoveredTool(null);
    setHoveredSkillName(null);
  };

  const tabColors = {
    redteam: '#ff3355', blueteam: '#00aaff', recon: '#ffaa00',
    reversing: '#cc66ff', cloud: '#00ffaa', aiml: '#00ff66'
  };
  const activeColor = tabColors[activeTab] || '#00ff66';

  /* ─── SVG path builders ─── */
  const trunkPath = connData ? (() => {
    const { tabX, tabY, hubX, hubY } = connData;
    const my = (tabY + hubY) / 2;
    return `M ${tabX} ${tabY} C ${tabX} ${my}, ${hubX} ${my}, ${hubX} ${hubY}`;
  })() : '';

  const branchPaths = connData ? connData.branches.map(b => {
    const { hubX, hubY } = connData;
    const dy = (hubY + b.y) / 2;
    return { id: b.id, d: `M ${hubX} ${hubY} C ${hubX} ${dy}, ${b.x} ${dy}, ${b.x} ${b.y}` };
  }) : [];

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="w-full relative">

      {/* ── SECTION HEADER ── */}
      <div className="section-header mb-4 relative">
        <span className="section-tag block text-xs font-mono text-[#00ff66] tracking-widest mb-1">02_SKILLS_AND_TOOLS</span>
        <h2 className="section-title text-2xl font-bold text-white tracking-wider font-mono">SKILLS &amp; TOOLS</h2>
      </div>

      {/* ── MAIN PANEL ── */}
      <div ref={containerRef} className="w-full p-5 md:p-6 border bg-[rgba(15,20,36,0.25)] backdrop-blur-md rounded-[8px] relative transition-all duration-300 z-20" style={{ borderColor: `${activeColor}15` }}>

        {/* SVG connection layer — behind chips */}
        {!isMobile && connData && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible', zIndex: 5 }}>
            <defs>
              <filter id="connGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>

            {/* Trunk: Tab → Hub */}
            <path d={trunkPath} fill="none" stroke={`${activeColor}20`} strokeWidth="2" />
            <motion.path d={trunkPath} fill="none" stroke={activeColor} strokeWidth="2" filter="url(#connGlow)"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} />
            <motion.circle r="2.5" fill={activeColor} style={{ filter: `drop-shadow(0 0 6px ${activeColor})` }}>
              <animateMotion path={trunkPath} dur="1.8s" repeatCount="indefinite" />
            </motion.circle>

            {/* Branches: Hub → Each Tool */}
            {branchPaths.map((bp) => {
              const speed = 1.5 + (hashStr(bp.id) % 15) / 10;
              return (
                <g key={bp.id}>
                  <path d={bp.d} fill="none" stroke={`${activeColor}12`} strokeWidth="1" />
                  <motion.path d={bp.d} fill="none" stroke={activeColor} strokeWidth="1" style={{ opacity: 0.6 }}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.35, ease: 'easeOut' }} />
                  <motion.circle r="1.5" fill={activeColor} style={{ filter: `drop-shadow(0 0 4px ${activeColor})`, opacity: 0.8 }}>
                    <animateMotion path={bp.d} dur={`${speed}s`} repeatCount="indefinite" />
                  </motion.circle>
                  {/* Endpoint dot */}
                  <circle cx={connData.branches.find(b => b.id === bp.id)?.x || 0} cy={connData.branches.find(b => b.id === bp.id)?.y || 0} r="2" fill={activeColor} style={{ opacity: 0.5 }} />
                </g>
              );
            })}

            {/* Hub glow */}
            <circle cx={connData.hubX} cy={connData.hubY} r="4" fill={activeColor} style={{ filter: `drop-shadow(0 0 8px ${activeColor})` }}>
              <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
            </circle>
            <circle cx={connData.hubX} cy={connData.hubY} r="8" fill="none" stroke={activeColor} strokeWidth="0.5" style={{ opacity: 0.3 }}>
              <animate attributeName="r" values="6;12;6" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.3;0;0.3" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>
        )}

        {/* Tab navigation */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 pb-3 mb-5 border-b border-[rgba(255,255,255,0.05)] relative z-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            const col = tabColors[tab.id];
            return (
              <button key={tab.id} ref={el => tabRefs.current[tab.id] = el} onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 justify-center px-2 py-2.5 font-mono text-[10px] md:text-[11px] tracking-wider border rounded-[4px] min-h-[42px] transition-all duration-300 relative z-25 ${active ? 'bg-transparent font-bold' : 'bg-transparent border-[rgba(255,255,255,0.05)] text-[#A0AAB0] hover:border-[rgba(255,255,255,0.15)] hover:text-white'}`}
                style={active ? { borderColor: col, color: col, boxShadow: `0 0 12px ${col}20` } : {}}>
                <Icon className="w-3 h-3 shrink-0" /><span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Skills panel */}
        <div className="min-h-[200px] flex flex-col justify-between relative z-20">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: isMobile ? 0 : -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: isMobile ? 0 : 6 }} transition={{ duration: 0.2 }} className="flex-1 flex flex-col">

              {/* Category title */}
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5" style={{ color: activeColor }} />
                <span className="font-mono text-xs font-bold tracking-wider" style={{ color: activeColor }}>{currentTab.title}</span>
                <span className="text-[10px] font-mono text-[#4f5e75]">({skills.length} tools)</span>
              </div>

              {/* Hub node — centered distribution point */}
              <div className="flex justify-center mb-4" style={{ position: 'relative', zIndex: 15 }}>
                <div ref={hubRef} className="w-1 h-1 rounded-full" style={{ background: activeColor, opacity: 0.01 }} />
              </div>

              {/* ── STAGGERED TOOL GRID ── */}
              <div className="mb-5" style={{ position: 'relative', zIndex: 30 }}>
                {/* Row 1 — top row, centered */}
                <div className="flex flex-wrap justify-center gap-x-3 gap-y-2.5 mb-3">
                  {topRow.map((skill) => (
                    <motion.button key={skill} ref={el => toolRefs.current[skill] = el}
                      onClick={() => handleSkillClick(skill)}
                      onMouseEnter={(e) => handleMouseEnter(skill, e)}
                      onMouseLeave={handleMouseLeave}
                      whileHover={isMobile ? {} : { y: -2, scale: 1.03 }}
                      className="inline-flex items-center justify-center px-3.5 py-2 min-h-[42px] md:min-h-0 border font-mono text-xs rounded-[4px] transition-all duration-300 cursor-pointer select-none outline-none"
                      style={{
                        background: 'rgba(2,4,10,1)',
                        borderColor: hoveredSkillName === skill ? activeColor : 'rgba(255,255,255,0.06)',
                        color: hoveredSkillName === skill ? '#fff' : '#A0AAB0',
                        boxShadow: hoveredSkillName === skill ? `0 0 8px ${activeColor}30` : 'none',
                      }}>
                      {skill}
                    </motion.button>
                  ))}
                </div>

                {/* Row 2 — bottom row, staggered offset */}
                {bottomRow.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-2.5"
                    style={{ transform: needsOffset && !isMobile ? 'translateX(3.5rem)' : 'none' }}>
                    {bottomRow.map((skill) => (
                      <motion.button key={skill} ref={el => toolRefs.current[skill] = el}
                        onClick={() => handleSkillClick(skill)}
                        onMouseEnter={(e) => handleMouseEnter(skill, e)}
                        onMouseLeave={handleMouseLeave}
                        whileHover={isMobile ? {} : { y: -2, scale: 1.03 }}
                        className="inline-flex items-center justify-center px-3.5 py-2 min-h-[42px] md:min-h-0 border font-mono text-xs rounded-[4px] transition-all duration-300 cursor-pointer select-none outline-none"
                        style={{
                          background: 'rgba(2,4,10,1)',
                          borderColor: hoveredSkillName === skill ? activeColor : 'rgba(255,255,255,0.06)',
                          color: hoveredSkillName === skill ? '#fff' : '#A0AAB0',
                          boxShadow: hoveredSkillName === skill ? `0 0 8px ${activeColor}30` : 'none',
                        }}>
                        {skill}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Console footer */}
          <div className="flex items-center gap-2 p-3 border border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.45)] rounded-[4px] font-mono text-[10px] relative z-20" style={{ color: activeColor }}>
            <Terminal className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{currentTab.consoleMsg}</span>
          </div>
        </div>

        {/* ── DESKTOP HOVER TOOLTIP ── */}
        <AnimatePresence>
          {hoveredTool && (
            <motion.div initial={{ opacity: 0, y: 4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.95 }} transition={{ duration: 0.12 }}
              className="absolute p-3 border rounded-[4px] bg-[rgba(10,12,22,0.98)] backdrop-blur-md font-mono text-[10px] leading-normal text-white max-w-[240px] pointer-events-none shadow-[0_4px_24px_rgba(0,0,0,0.85)]"
              style={{ left: tooltipPos.x, top: tooltipPos.y, transform: 'translate(-50%, -100%)', borderColor: activeColor, boxShadow: `0 0 12px ${activeColor}20`, zIndex: 60 }}>
              <div className="font-bold mb-1" style={{ color: activeColor }}>{hoveredTool.title}</div>
              <div className="text-[#A0AAB0]">{hoveredTool.summary}</div>
              <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[rgba(10,12,22,0.98)] border-r border-b" style={{ borderColor: activeColor }} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── MOBILE TAP DETAIL MODAL ── */}
      <AnimatePresence>
        {selectedSkill && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-[rgba(2,4,10,0.85)] backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg p-6 md:p-8 border bg-[rgba(7,10,18,0.95)] rounded-[6px]" style={{ borderColor: activeColor, boxShadow: `0 0 30px ${activeColor}33` }}>
              <button onClick={() => setSelectedSkill(null)} className="absolute top-4 right-4 flex items-center justify-center w-8 h-8 rounded-[4px] border border-[rgba(255,255,255,0.05)] text-white hover:border-[#ff0055] hover:text-[#ff0055] transition-all min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0">
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 font-mono text-xs font-bold mb-3 border-b pb-2" style={{ color: activeColor, borderColor: `${activeColor}25` }}>
                <Activity className="w-3.5 h-3.5 animate-pulse" /><span>SKILL DETAILS</span>
              </div>
              <h3 className="text-white font-mono text-lg font-bold tracking-wider leading-snug mb-2">{selectedSkill.title}</h3>
              <p className="text-[#00d4ff] font-mono text-xs mb-5">{selectedSkill.summary}</p>
              <div className="p-4 border border-[rgba(255,255,255,0.04)] bg-[rgba(2,4,10,0.5)] rounded-[4px] font-mono text-[11px] text-[#A0AAB0] leading-relaxed mb-6">
                <div className="text-white font-bold mb-1.5 flex items-center gap-1.5">
                  <ArrowRight className="w-3 h-3" style={{ color: activeColor }} /><span>REAL WORLD APPLICATION:</span>
                </div>
                {selectedSkill.scenario}
              </div>
              <button onClick={() => setSelectedSkill(null)}
                className="w-full flex items-center justify-center font-mono text-xs border bg-transparent py-3 rounded-[4px] min-h-[44px] font-bold transition-all duration-300"
                style={{ color: activeColor, borderColor: activeColor, background: `${activeColor}08` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = activeColor; e.currentTarget.style.color = '#000'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `${activeColor}08`; e.currentTarget.style.color = activeColor; }}>
                Close Details
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
