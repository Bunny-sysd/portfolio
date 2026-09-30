export const CONTACT_EMAIL = 'aaron.lawrence.alva@gmail.com';

// Honest about what it is: this opens the visitor's own mail app.
export function buildMailto(name, message) {
  const sender = name.trim() || 'Anonymous';
  const subject = encodeURIComponent(`[Portfolio] Message from ${sender}`);
  const body = encodeURIComponent(`From: ${sender}\n\n${message.trim()}`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
