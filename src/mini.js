'use strict';
// Mini ventana de instalación: solo pinta lo que le manda el proceso principal.
const $ = (id) => document.getElementById(id);
let phase = 'progress';

function hue(str) {
  let h = 0;
  for (const ch of String(str)) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

function showIcon(d) {
  const img = $('icon');
  const fb = $('fallback');
  const showFallback = () => {
    const name = (d.name || '?').trim();
    const h = hue(name);
    fb.textContent = (name[0] || '?').toUpperCase();
    fb.style.background = `linear-gradient(150deg, hsl(${h} 70% 55%), hsl(${(h + 40) % 360} 70% 42%))`;
    fb.style.display = 'grid';
    img.hidden = true;
  };
  if (!d.icon) { showFallback(); return; }
  fb.style.display = 'none';
  img.hidden = false;
  if (img.getAttribute('src') !== d.icon) {
    img.onerror = showFallback;
    img.src = d.icon;
  }
}

function render(d) {
  if (!d || d.phase === 'idle') return;
  phase = d.phase;
  const L = d.labels || {};
  document.body.dataset.phase = d.phase;
  document.documentElement.dataset.theme = d.theme === 'light' ? 'light' : 'dark';

  $('head').textContent = d.head || '';
  $('name').textContent = d.name || '';
  $('min').title = L.minimize || '';
  $('min').setAttribute('aria-label', L.minimize || 'Minimize');
  showIcon(d);

  const inProgress = d.phase === 'progress';
  $('stage').textContent = inProgress ? (d.stage || '') : (d.message || '');
  $('queue').textContent = inProgress ? (d.queue || '') : '';
  $('pct').textContent = inProgress && !d.indeterminate ? `${d.percent}%` : '';
  const fill = $('fill');
  fill.classList.toggle('indeterminate', inProgress && d.indeterminate);
  fill.style.width = `${d.percent || 0}%`;

  const primary = $('primary');
  primary.hidden = d.phase === 'error';
  primary.textContent = inProgress ? (L.cancel || '') : (L.open || '');
  primary.className = inProgress ? 'btn danger' : 'btn primary';
  $('show').textContent = L.showApp || '';
}

$('min').onclick = () => window.mini.minimize();
$('show').onclick = () => window.mini.showMain();
$('primary').onclick = () => (phase === 'progress' ? window.mini.cancel() : window.mini.open());

window.mini.onData(render);
window.mini.ready();
