// Writeups moved verbatim from the previous site's app.js.
const machineWriteups = {
  ad: `<div style="color: var(--cyan); font-weight: bold;">[CASE STUDY: VULNNET ACTIVE // ACTIVE DIRECTORY COMPROMISE]</div>
<div class="dim">> Objective: Escalate from unauthenticated SMB null session to Domain Admin.</div>
<div>1. <span class="cyan">SMB Null Session:</span> Discovered readable IPC$ share listing service account usernames (<code>Enterprise-Backup</code>).</div>
<div>2. <span class="warn">Kerberoasting:</span> Executed <code>GetUserSPNs.py enterprise.local/Enterprise-Backup -request</code> to dump TGS ticket hashes for SPN <code>MSSQLSvc/db01.enterprise.local</code>.</div>
<div>3. <span class="warn">Hashcat Cracking:</span> Recovered plaintext password in 4.2 minutes using mode 13100 and rockyou.txt.</div>
<div>4. <span class="err">BloodHound Analysis:</span> Identified member of "Server Operators" group with permission to restart <code>AppReadiness</code> service.</div>
<div>5. <span class="green">Domain Admin:</span> Configured binary path to net user admin exploit and spawned privileged SYSTEM shell.</div>`,
  linux: `<div style="color: var(--green); font-weight: bold;">[CASE STUDY: CYBERPULSE // LINUX SUID & CAPABILITY EXPLOITATION]</div>
<div class="dim">> Objective: Bypass low-privilege www-data shell to gain root via SUID binary reverse engineering.</div>
<div>1. <span class="cyan">Web Shell Foothold:</span> Uploaded obfuscated PHP reverse shell via unsanitized avatar upload bypass.</div>
<div>2. <span class="cyan">LinPEAS Enumeration:</span> Discovered custom compiled binary <code>/usr/local/bin/log_monitor</code> with SUID bit (4755).</div>
<div>3. <span class="warn">Ghidra Reverse Engineering:</span> Analyzed decompiled C code; found vulnerable <code>system("tail -n 20 /var/log/syslog")</code> calling relative path without absolute binary definition.</div>
<div>4. <span class="err">PATH Hijacking:</span> Created malicious <code>tail</code> script in <code>/tmp</code> executing <code>/bin/bash -p</code> and pre-pended <code>PATH=/tmp:$PATH</code>.</div>
<div>5. <span class="green">Root Execution:</span> Triggered binary to obtain root shell (<code>euid=0(root)</code>).</div>`,
  web: `<div style="color: #ffd700; font-weight: bold;">[CASE STUDY: RETROAUTH // BLIND SQLi & CLOUD METADATA SSRF TO RCE]</div>
<div class="dim">> Objective: Exploit blind SQL injection to dump administrative API keys, chain with SSRF to achieve cloud RCE.</div>
<div>1. <span class="cyan">Boolean-Blind SQLi:</span> Identified injection point in HTTP <code>X-Forwarded-For</code> header using conditional time delays (<code>pg_sleep(5)</code>).</div>
<div>2. <span class="cyan">Data Exfiltration:</span> Scripted custom Python multithreaded binary search script to extract admin bcrypt hash and secret internal endpoint.</div>
<div>3. <span class="warn">Cloud SSRF:</span> Targeted internal PDF generation service via <code>&lt;iframe src="http://169.254.169.254/latest/meta-data/iam/security-credentials/"&gt;</code>.</div>
<div>4. <span class="err">AWS STS Tokens:</span> Harvested temporary IAM session credentials with EC2 full administrative access.</div>
<div>5. <span class="green">Cloud Shell RCE:</span> Deployed AWS SSM command to execute remote shell on target container.</div>`
};

export function wireCtfTabs(root) {
  const tabs = root.querySelectorAll('#ctfMachineTabs .target-btn');
  const content = root.querySelector('#ctfMachineContent');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      if (content && machineWriteups[tab.dataset.machine]) content.innerHTML = machineWriteups[tab.dataset.machine];
    });
  });
}
