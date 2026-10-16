// The contact message, encrypted live as you type: real AES-256-GCM
// (WebCrypto) under a throwaway key made on page load and never stored or
// sent — a visual of what the message looks like on the wire to anyone
// without the key. The email itself goes out through the visitor's own mail
// app, as plain text, and the label on the page says so.
const MAX_HEX = 192;

export function createCipher(textarea, panel) {
  if (!globalThis.crypto?.subtle) return null;
  const out = panel.querySelector('.cipher__out');
  const keyP = crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt']);
  let token = 0;
  panel.hidden = false;
  async function update() {
    const my = ++token;
    const text = textarea.value;
    if (!text) { out.textContent = ''; panel.classList.remove('is-live'); return; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await keyP, new TextEncoder().encode(text)));
    if (my !== token) return;
    const hex = [...iv, ...ct].map((b) => b.toString(16).padStart(2, '0')).join('');
    out.textContent = hex.length > MAX_HEX ? `${hex.slice(0, MAX_HEX)}… (${ct.length + 12} bytes)` : hex;
    panel.classList.add('is-live');
  }
  textarea.addEventListener('input', update);
  return { update };
}
