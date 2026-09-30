import './styles/base.css';
import './styles/chapters.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { buildMailto } from './contact.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;

const scroll = createScroll({ reducedMotion });
const chapters = createChapters(document);

document.getElementById('to-top').addEventListener('click', (e) => {
  e.preventDefault();
  scroll.scrollToProgress(0);
});

const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = form.querySelector('.form-note');
  const message = form.message.value;
  if (!message.trim()) { note.textContent = 'Add a message first.'; return; }
  window.location.href = buildMailto(form.name.value, message);
  note.textContent = 'Opening your email app with the message filled in…';
});

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  chapters.update(scroll.progress());
}
requestAnimationFrame(frame);
