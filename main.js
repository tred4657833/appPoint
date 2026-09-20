'use strict';
/**
 * appPoint — Centro de Aplicaciones para Ubuntu — proceso principal.
 * Todo lo que se muestra aquí sale del sistema real:
 *  - hardware y carga: /proc, /sys, os, df
 *  - catálogo: api.snapcraft.io, flathub.org/api/v2, apt-cache, extensions.gnome.org
 *  - instalación: flatpak (--user), snap (pkexec), apt-get (pkexec), gnome-extensions
 */

const { app, BrowserWindow, ipcMain, shell, dialog, screen } = require('electron');

// Muchas distros basadas en Ubuntu (incl. LikuOS) restringen los user
// namespaces sin privilegios vía AppArmor, lo que bloquea el sandbox de
// Chromium/Electron y obliga a lanzar con --no-sandbox manualmente.
// Lo deshabilitamos aquí para que el .desktop/AppImage funcione siempre,
// en cualquier instalación nueva, sin depender de cómo se lance el binario.
app.commandLine.appendSwitch('no-sandbox');

// Instancia única: si la app ya está abierta y el usuario le da doble clic
// otra vez al icono/.desktop, en vez de abrir una ventana nueva enfocamos
// la que ya existe.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win && !win.isDestroyed()) {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    }
  });
}

const os = require('os');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const https = require('https');
const dns = require('dns');
const { spawn, execFile } = require('child_process');

let win = null;
let splash = null;
const jobs = new Map(); // id -> ChildProcess
const httpCache = new Map(); // acelera catálogo/iconos repetidos
const previewWindows = new Set();
const snapCategoryCache = new Map(); // categoría snap -> apps[] (para el feed infinito)

/* ─────────────────────────── utilidades ─────────────────────────── */

function sh(cmd, args = [], opts = {}) {
  return new Promise((resolve) => {
    execFile(cmd, args, { maxBuffer: 32 * 1024 * 1024, timeout: 60000, ...opts }, (err, stdout, stderr) => {
      resolve({ ok: !err, code: err ? (err.code ?? 1) : 0, stdout: stdout || '', stderr: stderr || '' });
    });
  });
}
const bash = (line, opts = {}) => sh('/bin/bash', ['-lc', line], opts);

const binCache = new Map();
async function has(bin) {
  if (binCache.has(bin)) return binCache.get(bin);
  const r = await sh('which', [bin]);
  const v = r.ok && r.stdout.trim().length > 0;
  binCache.set(bin, v);
  return v;
}

async function readText(p) {
  try { return await fsp.readFile(p, 'utf8'); } catch { return ''; }
}

function httpJSON(url, { method = 'GET', body = null, headers = {}, redirects = 0, cacheMs = 0 } = {}) {
  const cacheKey = cacheMs > 0 ? `${method}:${url}:${JSON.stringify(body || {})}` : null;
  if (cacheKey && httpCache.has(cacheKey)) {
    const hit = httpCache.get(cacheKey);
    if (Date.now() - hit.t < cacheMs) return Promise.resolve(hit.v);
    httpCache.delete(cacheKey);
  }
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const payload = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = https.request({
      hostname: u.hostname,
      path: u.pathname + u.search,
      method,
      headers: {
        'User-Agent': 'appPoint/1.0 (Electron)',
        'Accept': 'application/json',
        ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': payload.length } : {}),
        ...headers
      },
      timeout: 15000
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 4) {
        res.resume();
        return resolve(httpJSON(new URL(res.headers.location, url).href, { method, body, headers, redirects: redirects + 1 }));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (c) => { data += c; });
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode} en ${u.hostname}`));
        try {
          const json = JSON.parse(data);
          if (cacheKey) httpCache.set(cacheKey, { t: Date.now(), v: json });
          resolve(json);
        } catch (e) { reject(new Error('err:invalid-server-response')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('err:timeout')));
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function download(url, dest, onProgress, redirects = 0) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.get({
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers: { 'User-Agent': 'appPoint/1.0' },
      timeout: 20000
    }, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && redirects < 4) {
        res.resume();
        return resolve(download(new URL(res.headers.location, url).href, dest, onProgress, redirects + 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} al descargar`));
      const total = parseInt(res.headers['content-length'] || '0', 10);
      let got = 0;
      const out = fs.createWriteStream(dest);
      res.on('data', (c) => {
        got += c.length;
        if (onProgress) onProgress(total ? Math.round((got / total) * 100) : null, got, total);
      });
      res.pipe(out);
      out.on('finish', () => out.close(() => resolve({ path: dest, bytes: got })));
      out.on('error', reject);
    });
    req.on('timeout', () => req.destroy(new Error('err:timeout')));
    req.on('error', reject);
  });
}

/* ─────────────────────────── dispositivo real ─────────────────────────── */

function parseKV(text) {
  const out = {};
  for (const line of text.split('\n')) {
    const i = line.indexOf('=');
    if (i > 0) out[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"|"$/g, '');
  }
  return out;
}

async function dmi(file) {
  const v = (await readText(`/sys/devices/virtual/dmi/id/${file}`)).trim();
  if (!v || /^(To be filled|System Product Name|Default string|Unknown|None)$/i.test(v)) return '';
  return v;
}

async function batteryInfo() {
  try {
    const base = '/sys/class/power_supply';
    const entries = await fsp.readdir(base);
    for (const e of entries) {
      const type = (await readText(path.join(base, e, 'type'))).trim();
      if (type !== 'Battery') continue;
      const capacity = parseInt((await readText(path.join(base, e, 'capacity'))).trim(), 10);
      const status = (await readText(path.join(base, e, 'status'))).trim();
      if (!Number.isNaN(capacity)) return { present: true, name: e, percent: capacity, status: status || 'Unknown' };
    }
    // Equipo de escritorio: sin batería, mostramos el estado de la corriente
    for (const e of entries) {
      const type = (await readText(path.join(base, e, 'type'))).trim();
      if (type === 'Mains') return { present: false, name: e, percent: 100, status: 'AC' };
    }
  } catch { /* sin subsistema de energía */ }
  return { present: false, percent: 100, status: 'AC' };
}

async function cpuSample() {
  const first = (await readText('/proc/stat')).split('\n')[0].trim().split(/\s+/).slice(1).map(Number);
  if (!first.length) return null;
  const idle = (first[3] || 0) + (first[4] || 0);
  const total = first.reduce((a, b) => a + (b || 0), 0);
  return { idle, total };
}

let lastCpu = null;
async function cpuUsage() {
  const now = await cpuSample();
  if (!now) return 0;
  if (!lastCpu) { lastCpu = now; await new Promise((r) => setTimeout(r, 250)); return cpuUsage(); }
  const dIdle = now.idle - lastCpu.idle;
  const dTotal = now.total - lastCpu.total;
  lastCpu = now;
  if (dTotal <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - dIdle / dTotal) * 100)));
}

async function memInfo() {
  const t = await readText('/proc/meminfo');
  const get = (k) => {
    const m = t.match(new RegExp(`^${k}:\\s+(\\d+) kB`, 'm'));
    return m ? parseInt(m[1], 10) * 1024 : 0;
  };
  const total = get('MemTotal') || os.totalmem();
  const available = get('MemAvailable') || os.freemem();
  const swapTotal = get('SwapTotal');
  const swapFree = get('SwapFree');
  return { total, available, used: total - available, swapTotal, swapUsed: swapTotal - swapFree };
}

async function diskInfo() {
  const r = await bash(`df -B1 --output=size,used,avail,pcent / | tail -n1`);
  const p = r.stdout.trim().split(/\s+/);
  if (p.length < 4) return null;
  return { total: +p[0], used: +p[1], free: +p[2], percent: parseInt(p[3], 10) };
}

async function deviceInfo() {
  const osr = parseKV(await readText('/etc/os-release'));
  const cpus = os.cpus();
  const [product, vendor, board, chassis, gpu, batt, mem, disk] = await Promise.all([
    dmi('product_name'), dmi('sys_vendor'), dmi('board_name'), dmi('chassis_type'),
    bash(`lspci 2>/dev/null | grep -Ei 'vga|3d|display' | head -n2 | sed 's/.*: //'`),
    batteryInfo(), memInfo(), diskInfo()
  ]);

  const chassisMap = {
    3: 'Desktop', 4: 'Desktop', 5: 'Desktop', 6: 'Desktop', 7: 'Tower',
    8: 'Laptop', 9: 'Laptop', 10: 'Laptop', 14: 'Laptop', 31: 'Laptop',
    30: 'Tablet', 32: 'Convertible', 9999: 'Device'
  };

  const model = [vendor, product].filter(Boolean).join(' ') || board || os.hostname();

  return {
    hostname: os.hostname(),
    user: os.userInfo().username,
    model,
    vendor,
    board,
    formFactor: chassisMap[parseInt(chassis, 10)] || (batt.present ? 'Laptop' : 'Desktop'),
    distro: osr.PRETTY_NAME || osr.NAME || 'Linux',
    distroId: osr.ID || 'linux',
    version: osr.VERSION_ID || '',
    codename: osr.VERSION_CODENAME || '',
    kernel: os.release(),
    arch: os.arch(),
    desktop: process.env.XDG_CURRENT_DESKTOP || process.env.DESKTOP_SESSION || 'Unknown',
    sessionType: process.env.XDG_SESSION_TYPE || '',
    cpu: cpus[0] ? cpus[0].model.replace(/\s+/g, ' ').trim() : 'CPU',
    cores: cpus.length,
    cpuMhz: cpus[0] ? cpus[0].speed : 0,
    gpu: (gpu.stdout || '').trim().split('\n').filter(Boolean),
    memory: mem,
    disk,
    battery: batt,
    uptime: os.uptime()
  };
}

async function deviceStats() {
  const [cpu, mem, batt, disk] = await Promise.all([cpuUsage(), memInfo(), batteryInfo(), diskInfo()]);
  return {
    cpu,
    load: os.loadavg().map((n) => +n.toFixed(2)),
    memory: mem,
    disk,
    battery: batt,
    uptime: os.uptime(),
    time: Date.now()
  };
}

/* ─────────────────────────── backends disponibles ─────────────────────────── */

async function backends() {
  const [flatpak, snap, apt, gnomeExt] = await Promise.all([
    has('flatpak'), has('snap'), has('apt-get'), has('gnome-extensions')
  ]);
  let flathub = false;
  if (flatpak) {
    const r = await sh('flatpak', ['remotes', '--columns=name']);
    flathub = /flathub/i.test(r.stdout);
  }
  let shellVersion = '';
  if (gnomeExt) {
    const r = await sh('gnome-shell', ['--version']);
    shellVersion = (r.stdout.match(/[\d.]+/) || [''])[0];
  }
  return { flatpak, flathub, snap, apt, gnomeExt, shellVersion, pkexec: await has('pkexec') };
}

/* ─────────────────────────── catálogos reales ─────────────────────────── */

const SNAP_HEADERS = { 'Snap-Device-Series': '16' };
const SNAP_FIELDS = 'title,summary,media,publisher,version,confinement,download,categories';

function snapToApp(s) {
  const snap = s.snap || s;
  const icon = (snap.media || []).find((m) => m.type === 'icon');
  return {
    id: s.name || snap.name,
    source: 'snap',
    name: snap.title || s.name,
    summary: snap.summary || '',
    icon: icon ? icon.url : null,
    publisher: snap.publisher ? (snap.publisher['display-name'] || snap.publisher.username) : '',
    version: snap.version || '',
    size: snap.download ? snap.download.size : 0,
    classic: snap.confinement === 'classic'
  };
}

async function snapSearch(q) {
  const url = q
    ? `https://api.snapcraft.io/v2/snaps/find?q=${encodeURIComponent(q)}&fields=${SNAP_FIELDS}`
    : `https://api.snapcraft.io/v2/snaps/find?category=featured&fields=${SNAP_FIELDS}`;
  const json = await httpJSON(url, { headers: SNAP_HEADERS, cacheMs: 4 * 60 * 1000 });
  return (json.results || []).map(snapToApp);
}

function flathubToApp(h) {
  const id = h.app_id || h.flatpakAppId || h.id;
  const icon128 = id ? `https://dl.flathub.org/repo/appstream/x86_64/icons/128x128/${id}.png` : null;
  const icon64 = id ? `https://dl.flathub.org/repo/appstream/x86_64/icons/64x64/${id}.png` : null;
  return {
    id,
    source: 'flatpak',
    name: h.name || id,
    summary: h.summary || '',
    icon: h.icon || icon128,
    iconAlt: h.icon ? icon128 : icon64,
    publisher: h.developer_name || '',
    version: h.version || '',
    size: h.installed_size || 0
  };
}

async function flathubSearch(q) {
  if (q) {
    const json = await httpJSON('https://flathub.org/api/v2/search', {
      method: 'POST',
      body: { query: q, filters: [] },
      cacheMs: 4 * 60 * 1000
    });
    return (json.hits || []).map(flathubToApp);
  }
  const json = await httpJSON('https://flathub.org/api/v2/collection/popular?page=1&per_page=40', { cacheMs: 4 * 60 * 1000 });
  return (json.hits || []).map(flathubToApp);
}

// Convierte líneas de `apt-cache search` en tarjetas; pide versión/estado de los primeros `policyCount`.
async function aptRows(lines, policyCount = 12) {
  const rows = lines.map((line) => {
    const i = line.indexOf(' - ');
    const name = i > 0 ? line.slice(0, i) : line;
    return { id: name.trim(), source: 'apt', name: name.trim(), summary: i > 0 ? line.slice(i + 3).trim() : '', icon: null };
  });
  await Promise.all(rows.slice(0, policyCount).map(async (row) => {
    const p = await sh('apt-cache', ['policy', row.id]);
    const candidate = p.stdout.match(/Candidate:\s*(\S+)/);
    if (candidate && candidate[1] !== '(none)') row.version = candidate[1];
    const current = p.stdout.match(/Installed:\s*(\S+)/);
    row.installed = !!current && current[1] !== '(none)';
  }));
  return rows;
}

// Paquetes APT por nombre exacto (los que no existan en este Ubuntu simplemente no salen).
async function aptByNames(names, limit = 16) {
  if (!(await has('apt-cache'))) return [];
  const r = await sh('apt-cache', ['search', '--names-only', `^(${names.join('|')})$`]);
  const lines = r.stdout.trim().split('\n').filter(Boolean).slice(0, limit);
  return aptRows(lines, limit);
}

const APT_POPULAR = ['vlc', 'gimp', 'inkscape', 'krita', 'audacity', 'htop', 'neovim', 'git', 'curl', 'blender', 'obs-studio', 'thunderbird', 'filezilla', 'transmission-gtk', 'gparted', 'synaptic'];

async function aptSearch(q) {
  if (!(await has('apt-cache'))) return [];
  // Sin consulta mostramos utilidades populares de los repos de Ubuntu
  if (!q) return aptByNames(APT_POPULAR, APT_POPULAR.length);
  // La consulta va como argumento (sin shell) y escapada: apt-cache la interpreta como regex.
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const r = await sh('apt-cache', ['search', '--names-only', safe]);
  const lines = r.stdout.trim().split('\n').filter(Boolean).slice(0, 25);
  return aptRows(lines, 12);
}

async function catalog(query) {
  const b = await backends();
  const tasks = [];
  if (b.flatpak) tasks.push(flathubSearch(query).catch(() => []));
  if (b.snap) tasks.push(snapSearch(query).catch(() => []));
  if (b.apt) tasks.push(aptSearch(query).catch(() => []));
  // Si no hay flatpak/snap instalados igual mostramos el catálogo web para poder ofrecer la instalación
  if (!b.flatpak && !b.snap) tasks.push(flathubSearch(query).catch(() => []));
  const results = await Promise.all(tasks);
  const seen = new Set();
  const flat = [];
  for (const list of results) {
    for (const item of list) {
      const key = `${item.source}:${item.id}`;
      if (!item.id || seen.has(key)) continue;
      seen.add(key);
      flat.push(item);
    }
  }
  return flat;
}

/* ─────────────────────────── aplicaciones instaladas ─────────────────────────── */

const ICON_ROOTS = [
  path.join(os.homedir(), '.local/share/icons'),
  path.join(os.homedir(), '.icons'),
  path.join(os.homedir(), '.local/share/flatpak/exports/share/icons'),
  '/var/lib/flatpak/exports/share/icons',
  '/usr/share/icons',
  '/usr/local/share/icons',
  '/usr/share/pixmaps',
  '/snap'
];
const SIZES = ['256x256', '512x512', '192x192', '128x128', '96x96', '64x64', '48x48', 'scalable', '32x32'];
const iconCache = new Map();

function fileToDataURL(p) {
  try {
    const buf = fs.readFileSync(p);
    if (buf.length > 900 * 1024) return null;
    const ext = path.extname(p).toLowerCase();
    const mime = ext === '.svg' ? 'image/svg+xml' : ext === '.xpm' ? null : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
    if (!mime) return null;
    return `data:${mime};base64,${buf.toString('base64')}`;
  } catch { return null; }
}

function resolveIcon(name) {
  if (!name) return null;
  if (iconCache.has(name)) return iconCache.get(name);
  let found = null;
  if (name.startsWith('/') && fs.existsSync(name)) {
    found = fileToDataURL(name);
  } else {
    const exts = ['.png', '.svg', '.xpm'];
    outer:
    for (const root of ICON_ROOTS) {
      if (!fs.existsSync(root)) continue;
      if (root === '/usr/share/pixmaps') {
        for (const ext of exts) {
          const p = path.join(root, name + ext);
          if (fs.existsSync(p)) { found = fileToDataURL(p); if (found) break outer; }
        }
        continue;
      }
      let themes = [];
      try { themes = fs.readdirSync(root); } catch { continue; }
      themes.sort((a, b) => (a === 'hicolor' ? -1 : b === 'hicolor' ? 1 : 0));
      for (const theme of themes) {
        for (const size of SIZES) {
          for (const ext of exts) {
            const p = path.join(root, theme, size, 'apps', name + ext);
            if (fs.existsSync(p)) { found = fileToDataURL(p); if (found) break outer; }
          }
        }
      }
    }
  }
  iconCache.set(name, found);
  return found;
}

const DESKTOP_DIRS = [
  '/usr/share/applications',
  '/usr/local/share/applications',
  path.join(os.homedir(), '.local/share/applications'),
  '/var/lib/flatpak/exports/share/applications',
  path.join(os.homedir(), '.local/share/flatpak/exports/share/applications'),
  '/var/lib/snapd/desktop/applications'
];

function parseDesktop(file) {
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return null; }
  const section = text.split(/^\[/m).find((s) => s.startsWith('Desktop Entry]'));
  if (!section) return null;
  const get = (key) => {
    const m = section.match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : '';
  };
  const localized = (key) => {
    const lang = (process.env.LANG || 'es').split(/[_.]/)[0];
    const m = section.match(new RegExp(`^${key}\\[${lang}\\]\\s*=\\s*(.+)$`, 'm'));
    return m ? m[1].trim() : get(key);
  };
  if (get('NoDisplay').toLowerCase() === 'true' || get('Hidden').toLowerCase() === 'true') return null;
  if (get('Type') && get('Type') !== 'Application') return null;
  const name = localized('Name');
  if (!name) return null;
  // Los accesos que instala esta app para webapps se llaman "webapp-<id>.desktop": los
  // reconocemos por el nombre de archivo y recuperamos el <id> real (sin prefijo ni
  // extensión) para que coincida con el id que usan WEBAPPS/DEV_WEBAPPS/custom-webviews
  // y así puedan mostrarse como "instaladas" y eliminarse correctamente.
  const base = path.basename(file);
  const webappMatch = base.match(/^webapp-(.+)\.desktop$/);
  return {
    id: webappMatch ? webappMatch[1] : base,
    desktopFile: file,
    name,
    summary: localized('Comment'),
    iconName: get('Icon'),
    exec: get('Exec'),
    categories: get('Categories').split(';').filter(Boolean),
    source: webappMatch ? 'webapp' : file.includes('flatpak') ? 'flatpak' : file.includes('snapd') ? 'snap' : 'sistema'
  };
}

async function systemApps() {
  const apps = new Map();
  for (const dir of DESKTOP_DIRS) {
    let files = [];
    try { files = await fsp.readdir(dir); } catch { continue; }
    for (const f of files) {
      if (!f.endsWith('.desktop')) continue;
      const entry = parseDesktop(path.join(dir, f));
      if (entry) apps.set(entry.id, entry);
    }
  }
  const list = [...apps.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  for (const a of list) a.icon = resolveIcon(a.iconName);
  return list;
}

async function installedPackages() {
  const out = [];
  if (await has('flatpak')) {
    const r = await sh('flatpak', ['list', '--app', '--columns=application,name,version,size']);
    for (const line of r.stdout.trim().split('\n').filter(Boolean)) {
      const [id, name, version, size] = line.split('\t');
      out.push({ id, source: 'flatpak', name: name || id, version: version || '', sizeText: size || '', icon: resolveIcon(id) });
    }
  }
  if (await has('snap')) {
    const r = await sh('snap', ['list']);
    const lines = r.stdout.trim().split('\n').slice(1);
    for (const line of lines) {
      const p = line.trim().split(/\s+/);
      if (p.length < 2) continue;
      out.push({ id: p[0], source: 'snap', name: p[0], version: p[1], publisher: p[4] || '', icon: resolveIcon(p[0]) });
    }
  }
  return out;
}

/* ─────────────────────────── feed infinito (tienda) ─────────────────────────── */

const FLATHUB_COLLECTIONS = ['popular', 'recently-updated', 'recently-added'];
const SNAP_CATEGORIES = [
  'featured', 'productivity', 'development', 'social', 'photo-and-video',
  'music-and-video', 'graphics', 'games', 'security', 'utilities',
  'education', 'communication', 'finance', 'science', 'personalisation'
];

async function flathubCollection(name, page) {
  const json = await httpJSON(
    `https://flathub.org/api/v2/collection/${encodeURIComponent(name)}?page=${page}&per_page=24`,
    { cacheMs: 6 * 60 * 1000 }
  );
  return (json.hits || []).map(flathubToApp);
}

async function snapByCategory(cat) {
  const cached = snapCategoryCache.get(cat);
  if (cached && Date.now() - cached.t < 10 * 60 * 1000) return cached.v;
  const url = `https://api.snapcraft.io/v2/snaps/find?category=${encodeURIComponent(cat)}&fields=${SNAP_FIELDS}`;
  const json = await httpJSON(url, { headers: SNAP_HEADERS, cacheMs: 10 * 60 * 1000 });
  const apps = (json.results || []).map(snapToApp);
  snapCategoryCache.set(cat, { t: Date.now(), v: apps });
  return apps;
}

// Recorre catálogos reales por lotes; al agotar categorías vuelve a empezar
// (con TTL de caché ya vencido) para que el scroll nunca se detenga.
async function feedBatch(cursorIn) {
  const cursor = cursorIn && typeof cursorIn === 'object'
    ? { fIdx: 0, fPage: 1, sIdx: 0, round: 0, ...cursorIn }
    : { fIdx: 0, fPage: 1, sIdx: 0, round: 0 };

  const b = await backends();
  const tasks = [];
  if (b.flatpak || b.flathub || true) {
    tasks.push(flathubCollection(FLATHUB_COLLECTIONS[cursor.fIdx % FLATHUB_COLLECTIONS.length], cursor.fPage).catch(() => []));
  }
  tasks.push(snapByCategory(SNAP_CATEGORIES[cursor.sIdx % SNAP_CATEGORIES.length]).catch(() => []));

  const [flat, snaps] = await Promise.all(tasks);
  const seen = new Set();
  const items = [];
  for (const it of [...flat, ...(snaps || [])]) {
    const key = `${it.source}:${it.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(it);
  }

  const next = { ...cursor };
  next.fPage += 1;
  if (next.fPage > 4) { next.fPage = 1; next.fIdx += 1; }
  next.sIdx += 1;
  if (next.fIdx >= FLATHUB_COLLECTIONS.length && next.sIdx >= SNAP_CATEGORIES.length) {
    next.fIdx = 0; next.sIdx = 0; next.round = (cursor.round || 0) + 1;
  }
  return { items, cursor: next, round: next.round };
}

/* ─────────────────────────── apps web y suite de oficina ─────────────────────────── */

function faviconFor(url) {
  try { const u = new URL(url); return `https://www.google.com/s2/favicons?sz=128&domain=${u.hostname}`; }
  catch { return null; }
}

// Apps de la pestaña "Dev": herramientas reales para desarrolladores, no redes sociales.
const WEBAPPS = [
  { id: 'trello', name: 'Trello', url: 'https://trello.com', summary: 'Kanban boards to organize projects and team tasks.', publisher: 'Atlassian' },
  { id: 'notion', name: 'Notion', url: 'https://www.notion.so', summary: 'Notes, docs, wikis and databases in one place.', publisher: 'Notion Labs' },
  { id: 'google-docs', name: 'Google Docs', url: 'https://docs.google.com', summary: 'Collaborative word processor in the cloud.', publisher: 'Google' },
  { id: 'google-sheets', name: 'Google Sheets', url: 'https://sheets.google.com', summary: 'Collaborative spreadsheets in the cloud.', publisher: 'Google' },
  { id: 'outlook', name: 'Outlook Web', url: 'https://outlook.office.com', summary: 'Mail, calendar and contacts from Microsoft 365.', publisher: 'Microsoft' },
  { id: 'slack', name: 'Slack Web', url: 'https://app.slack.com/client', summary: 'Team messaging and channels.', publisher: 'Slack Technologies' }
].map((w) => ({ ...w, source: 'webapp', icon: faviconFor(w.url) }));

const DEV_WEBAPPS = [
  { id: 'github', name: 'GitHub', url: 'https://github.com', summary: 'Code hosting, issues and pull requests.', publisher: 'GitHub' },
  { id: 'gitlab', name: 'GitLab', url: 'https://gitlab.com', summary: 'DevOps platform with repos and CI/CD pipelines.', publisher: 'GitLab' },
  { id: 'stackoverflow', name: 'Stack Overflow', url: 'https://stackoverflow.com', summary: 'Q&A community for programmers.', publisher: 'Stack Exchange' },
  { id: 'mdn', name: 'MDN Web Docs', url: 'https://developer.mozilla.org', summary: 'Reference docs for HTML, CSS and JavaScript.', publisher: 'Mozilla' },
  { id: 'npm', name: 'npm', url: 'https://www.npmjs.com', summary: 'Registry and docs for JavaScript packages.', publisher: 'npm, Inc.' },
  { id: 'codepen', name: 'CodePen', url: 'https://codepen.io', summary: 'Playground to prototype HTML/CSS/JS in the browser.', publisher: 'CodePen' },
  { id: 'replit', name: 'Replit', url: 'https://replit.com', summary: 'Cloud IDE to code and run projects from the browser.', publisher: 'Replit' },
  { id: 'dockerhub', name: 'Docker Hub', url: 'https://hub.docker.com', summary: 'Registry of container images.', publisher: 'Docker' },
  { id: 'vercel', name: 'Vercel', url: 'https://vercel.com/dashboard', summary: 'Deploy and manage frontend projects.', publisher: 'Vercel' },
  { id: 'figma', name: 'Figma', url: 'https://www.figma.com', summary: 'Interface design and prototyping.', publisher: 'Figma' }
].map((w) => ({ ...w, source: 'webapp', icon: faviconFor(w.url) }));

/* ── Apps nativas (Flatpak + Snap + APT) para las pestañas Dev y Oficina ── */

async function flathubCategory(cat) {
  const json = await httpJSON(
    `https://flathub.org/api/v2/collection/category/${encodeURIComponent(cat)}?page=1&per_page=30`,
    { cacheMs: 10 * 60 * 1000 }
  );
  return (json.hits || []).map(flathubToApp);
}

// Reparte por turnos entre orígenes para que ninguno domine la rejilla.
function interleave(lists) {
  const out = [];
  const seen = new Set();
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++) {
    for (const list of lists) {
      const it = list[i];
      if (!it) continue;
      const key = `${it.source}:${it.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
  }
  return out;
}

async function nativeTopic(topic) {
  const [flat, snaps, apts] = await Promise.all([
    flathubCategory(topic.flathub).catch(() => flathubSearch(topic.query)).catch(() => []),
    snapByCategory(topic.snap).catch(() => []),
    aptByNames(topic.apt).catch(() => [])
  ]);
  return interleave([flat.slice(0, 16), snaps.slice(0, 16), apts.slice(0, 16)]);
}

const DEV_TOPIC = {
  flathub: 'Development', snap: 'development', query: 'code editor',
  apt: ['git', 'gitg', 'meld', 'geany', 'emacs', 'neovim', 'vim-gtk3', 'sqlitebrowser', 'gnome-builder', 'glade', 'build-essential', 'cmake', 'gdb', 'python3-pip', 'nodejs', 'golang-go', 'docker.io', 'tmux', 'ghex', 'wireshark']
};
const OFFICE_TOPIC = {
  flathub: 'Office', snap: 'productivity', query: 'office',
  apt: ['libreoffice', 'abiword', 'gnumeric', 'okular', 'evince', 'thunderbird', 'evolution', 'calibre', 'gnome-calendar', 'xournalpp', 'pdfarranger', 'scribus', 'zim', 'simple-scan']
};

async function officeList() {
  const [apps, packages] = await Promise.all([systemApps(), nativeTopic(OFFICE_TOPIC)]);
  const suite = apps.filter((a) => (a.categories || []).some((c) => /office/i.test(c)));
  return { webapps: WEBAPPS, suite, packages };
}

async function devList() {
  return { webapps: DEV_WEBAPPS, packages: await nativeTopic(DEV_TOPIC) };
}

/* ─────────────────────────── Apps web: populares + búsqueda con variaciones de dominio ─────────────────────────── */
// Las apps web viven en la Tienda: al buscar "reddit" se ofrecen las páginas conocidas que coinciden y, además,
// variaciones de dominio (reddit.com, .org, .fun, .site…) que realmente resuelven por DNS, para que el usuario
// elija cuál convertir en app de escritorio (acceso .desktop con el favicon real y --app= en su propia ventana).

const POPULAR_WEBAPPS = [
  { id: 'reddit', name: 'Reddit', url: 'https://www.reddit.com', summary: 'Communities and discussion boards on every topic.', publisher: 'Reddit Inc.' },
  { id: 'twitter', name: 'X (Twitter)', url: 'https://x.com', summary: 'Real-time posts, news and conversation.', publisher: 'X Corp.' },
  { id: 'youtube', name: 'YouTube', url: 'https://www.youtube.com', summary: 'Video streaming and subscriptions.', publisher: 'Google' },
  { id: 'facebook', name: 'Facebook', url: 'https://www.facebook.com', summary: 'Social network, groups and marketplace.', publisher: 'Meta' },
  { id: 'instagram', name: 'Instagram', url: 'https://www.instagram.com', summary: 'Photo and video sharing.', publisher: 'Meta' },
  { id: 'whatsapp', name: 'WhatsApp Web', url: 'https://web.whatsapp.com', summary: 'Messaging linked to your phone.', publisher: 'Meta' },
  { id: 'discord', name: 'Discord', url: 'https://discord.com/app', summary: 'Voice, video and text chat for communities.', publisher: 'Discord Inc.' },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://www.linkedin.com', summary: 'Professional network and job search.', publisher: 'Microsoft' },
  { id: 'tiktok', name: 'TikTok', url: 'https://www.tiktok.com', summary: 'Short-form video feed.', publisher: 'ByteDance' },
  { id: 'spotify-web', name: 'Spotify Web', url: 'https://open.spotify.com', summary: 'Music and podcast streaming.', publisher: 'Spotify' },
  { id: 'netflix', name: 'Netflix', url: 'https://www.netflix.com', summary: 'Movies and series streaming.', publisher: 'Netflix' },
  { id: 'gmail', name: 'Gmail', url: 'https://mail.google.com', summary: 'Email in the browser.', publisher: 'Google' },
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com', summary: 'Online shopping.', publisher: 'Amazon' },
  { id: 'twitch', name: 'Twitch', url: 'https://www.twitch.tv', summary: 'Live streaming, mostly gaming.', publisher: 'Twitch' },
  { id: 'pinterest', name: 'Pinterest', url: 'https://www.pinterest.com', summary: 'Visual discovery and idea boards.', publisher: 'Pinterest' },
  { id: 'telegram', name: 'Telegram Web', url: 'https://web.telegram.org', summary: 'Fast, cloud-based messaging.', publisher: 'Telegram' }
].map((w) => ({ ...w, source: 'webapp', icon: faviconFor(w.url) }));

const CUSTOM_WEBVIEWS_FILE = path.join(app.getPath('userData'), 'custom-webviews.json');

async function loadCustomWebviews() {
  try {
    const raw = await fsp.readFile(CUSTOM_WEBVIEWS_FILE, 'utf8');
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch { return []; }
}

async function saveCustomWebviews(list) {
  await fsp.mkdir(path.dirname(CUSTOM_WEBVIEWS_FILE), { recursive: true });
  await fsp.writeFile(CUSTOM_WEBVIEWS_FILE, JSON.stringify(list, null, 2), 'utf8');
}

function slugFromUrl(url, takenIds = []) {
  let host;
  try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { host = 'site'; }
  const base = `web-${host.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}` || 'web-site';
  let id = base;
  let n = 2;
  while (takenIds.includes(id)) { id = `${base}-${n}`; n++; }
  return id;
}

const WEB_TLDS = ['com', 'org', 'net', 'io', 'app', 'dev', 'co', 'fun', 'site', 'online', 'xyz', 'me', 'tv', 'info', 'mx', 'es', 'ai', 'cloud', 'tech', 'store'];
const dnsCache = new Map(); // host -> { t, v } (solo se cachean respuestas firmes: existe / no existe)

// true = resuelve, false = no existe, null = no se pudo saber (sin red, timeout…)
function dnsCheck(host) {
  const hit = dnsCache.get(host);
  if (hit && Date.now() - hit.t < 10 * 60 * 1000) return Promise.resolve(hit.v);
  return new Promise((resolve) => {
    let settled = false;
    const done = (v, cache) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (cache) dnsCache.set(host, { t: Date.now(), v });
      resolve(v);
    };
    const timer = setTimeout(() => done(null, false), 3500);
    dns.lookup(host, (err) => {
      if (!err) return done(true, true);
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA') return done(false, true);
      return done(null, false);
    });
  });
}

const foldText = (v) => String(v || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
const hostOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; } };

// "reddit.com", "https://foo.org/app" -> { host, url, explicit }. Devuelve null si no parece una dirección.
function explicitWebTarget(raw) {
  const s = raw.trim();
  if (!s || /\s/.test(s)) return null;
  const hasProto = /^https?:\/\//i.test(s);
  let u;
  try { u = new URL(hasProto ? s : `https://${s}`); } catch { return null; }
  const host = u.hostname.toLowerCase();
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(host)) return null;
  // Solo rutas "seguras": un % en la línea Exec de un .desktop se interpreta como código de campo.
  const safePath = u.pathname !== '/' && /^[A-Za-z0-9/._~-]*$/.test(u.pathname) ? u.pathname.replace(/\/+$/, '') : '';
  return { host, url: `https://${host}${safePath}`, forced: hasProto || !!safePath };
}

function generatedWebapp(host, url) {
  return {
    id: slugFromUrl(url), name: host, host, url, source: 'webapp', generated: true,
    summary: '', publisher: host, icon: faviconFor(url)
  };
}

async function webSearch(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const nq = foldText(q);
  const base = nq.replace(/[^a-z0-9]+/g, '');

  // 1) Páginas conocidas que coinciden (nombre, id, publicador o dominio).
  const curated = [...POPULAR_WEBAPPS, ...WEBAPPS, ...DEV_WEBAPPS].filter((w) => {
    const hay = foldText([w.name, w.id, w.publisher, hostOf(w.url)].join(' '));
    return hay.includes(nq) || (base.length >= 2 && hay.replace(/[^a-z0-9]+/g, '').includes(base));
  }).slice(0, 8);
  const taken = new Set(curated.map((w) => hostOf(w.url)));

  // 2) Dirección escrita a mano, o variaciones de dominio del nombre buscado.
  const generated = [];
  const explicit = explicitWebTarget(q);
  let useExplicit = false;
  if (explicit && !taken.has(explicit.host)) {
    useExplicit = explicit.forced || (await dnsCheck(explicit.host)) !== false;
    if (useExplicit) generated.push(generatedWebapp(explicit.host, explicit.url));
  }
  if (!useExplicit && base.length >= 2 && base.length <= 40) {
    const hosts = WEB_TLDS.map((tld) => `${base}.${tld}`).filter((h) => !taken.has(h));
    const checked = await Promise.all(hosts.map(async (host) => ({ host, ok: await dnsCheck(host) })));
    let keep = checked.filter((c) => c.ok === true);
    if (!keep.length) keep = checked.filter((c) => c.ok === null).slice(0, 3); // sin red: al menos mostramos las más probables
    for (const c of keep.slice(0, 8)) generated.push(generatedWebapp(c.host, `https://${c.host}`));
  }
  return [...curated, ...generated];
}

// Borra los archivos reales de una webapp (acceso .desktop + icono cacheado). Se usa tanto
// para quitar un "Web View" propio como para desinstalar cualquier webapp (Oficina, Dev,
// App Web) desde "Instaladas" — sin sudo porque siempre viven en la carpeta del usuario.
async function deleteWebappFiles(id) {
  const desktopPath = path.join(os.homedir(), '.local/share/applications', `webapp-${id}.desktop`);
  const iconPath = path.join(app.getPath('userData'), 'webapp-icons', `${id}.png`);
  try { await fsp.unlink(desktopPath); } catch { /* ya no existía */ }
  try { await fsp.unlink(iconPath); } catch { /* ya no existía */ }
  iconCache.delete(iconPath);
}

async function installWebApp(webapp) {
  const jobId = `webapp:${webapp.id}`;
  const meta = { id: webapp.id, source: 'webapp', name: webapp.name };
  emit('install:progress', { ...meta, id: jobId, percent: 10, stage: 'stage:searching-browser', running: true });

  const candidates = ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'brave-browser', 'microsoft-edge', 'microsoft-edge-stable'];
  let browserBin = null;
  for (const c of candidates) { if (await has(c)) { browserBin = c; break; } }

  const desktopDir = path.join(os.homedir(), '.local/share/applications');
  await fsp.mkdir(desktopDir, { recursive: true });
  const desktopPath = path.join(desktopDir, `webapp-${webapp.id}.desktop`);

  emit('install:progress', { ...meta, id: jobId, percent: 45, stage: 'stage:downloading-icon', running: true });
  const iconsDir = path.join(app.getPath('userData'), 'webapp-icons');
  await fsp.mkdir(iconsDir, { recursive: true });
  const iconPath = path.join(iconsDir, `${webapp.id}.png`);
  let iconLine = 'web-browser';
  if (webapp.icon) {
    try { await download(webapp.icon, iconPath); iconLine = iconPath; } catch { /* usamos el icono genérico */ }
  }

  const execLine = browserBin ? `${browserBin} --app=${webapp.url}` : `xdg-open ${webapp.url}`;
  const entry = [
    '[Desktop Entry]',
    'Type=Application',
    `Name=${webapp.name}`,
    `Comment=${(webapp.summary || '').replace(/\n/g, ' ')}`,
    `Exec=${execLine}`,
    `Icon=${iconLine}`,
    'Categories=Office;Network;WebBrowser;',
    'Terminal=false'
  ].join('\n') + '\n';

  emit('install:progress', { ...meta, id: jobId, percent: 85, stage: 'stage:creating-shortcut', running: true });
  await fsp.writeFile(desktopPath, entry, 'utf8');
  await sh('chmod', ['+x', desktopPath]);
  iconCache.delete(webapp.id);

  emit('install:progress', { ...meta, id: jobId, percent: 100, stage: 'stage:ready', running: false });
  return {
    ok: true, id: webapp.id, source: 'webapp', name: webapp.name,
    note: browserBin ? 'note:added-as-app' : 'note:opens-in-browser'
  };
}

async function previewApp(item) {
  let url = item.url || null;
  if (!url) {
    if (item.source === 'flatpak') url = `https://flathub.org/apps/${item.id}`;
    else if (item.source === 'snap') url = `https://snapcraft.io/${item.id}`;
    else if (item.source === 'apt') url = `https://packages.ubuntu.com/search?keywords=${encodeURIComponent(item.id)}`;
    else if (item.source === 'gnome-extension') url = `https://extensions.gnome.org/extension/${item.pk || ''}/`;
  }
  if (!url) return { ok: false, error: 'err:no-preview-page' };

  const preview = new BrowserWindow({
    width: 1000, height: 740,
    title: item.name || 'Preview',
    backgroundColor: '#111318',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true }
  });
  previewWindows.add(preview);
  preview.on('closed', () => { previewWindows.delete(preview); scheduleMiniSync(); });
  preview.on('focus', scheduleMiniSync);
  preview.on('blur', scheduleMiniSync);
  preview.loadURL(url);
  return { ok: true };
}

/* ─────────────────────────── instalación real ─────────────────────────── */

function emit(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function parseProgress(chunk, state) {
  let percent = null;
  let stage = null;
  for (const raw of chunk.split(/[\r\n]+/)) {
    const line = raw.trim();
    if (!line) continue;
    // apt con APT::Status-Fd → "pmstatus:paquete:42.5:Preparando"
    const aptStatus = line.match(/^(dlstatus|pmstatus):[^:]*:([\d.]+):(.*)$/);
    if (aptStatus) {
      percent = Math.round(parseFloat(aptStatus[2]));
      stage = aptStatus[3];
      continue;
    }
    const pct = line.match(/(\d{1,3})\s?%/);
    if (pct) {
      const v = parseInt(pct[1], 10);
      if (v >= 0 && v <= 100) percent = v;
    }
    const clean = line.replace(/[\u2500-\u259F\u25A0-\u25FF]/g, '').replace(/\s{2,}/g, ' ').trim();
    if (clean && !/^[\d\s%.]+$/.test(clean)) stage = clean.slice(0, 80);
  }
  if (percent !== null) state.percent = percent;
  if (stage) state.stage = stage;
  return state;
}

function runJob(id, cmd, args, { env = {}, meta = {} } = {}) {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      env: { ...process.env, LANG: 'C.UTF-8', DEBIAN_FRONTEND: 'noninteractive', ...env }
    });
    jobs.set(id, child);
    const state = { percent: 0, stage: 'stage:preparing' };
    let log = '';

    const onData = (buf) => {
      const text = buf.toString();
      log += text;
      if (log.length > 40000) log = log.slice(-20000);
      parseProgress(text, state);
      emit('install:progress', { id, ...meta, percent: state.percent, stage: state.stage, running: true });
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onData);

    child.on('error', (err) => {
      jobs.delete(id);
      resolve({ ok: false, cancelled: false, error: err.message, log });
    });
    child.on('close', (code, signal) => {
      jobs.delete(id);
      const cancelled = signal === 'SIGTERM' || signal === 'SIGKILL' || child.__cancelled === true;
      resolve({ ok: code === 0 && !cancelled, cancelled, code, log });
    });
  });
}

async function ensureFlathub() {
  const r = await sh('flatpak', ['remotes', '--columns=name']);
  if (/flathub/i.test(r.stdout)) return true;
  const add = await sh('flatpak', [
    'remote-add', '--if-not-exists', '--user', 'flathub',
    'https://dl.flathub.org/repo/flathub.flatpakrepo'
  ]);
  return add.ok;
}

async function installPackage({ id, source, name, classic, url, summary }) {
  if (source === 'webapp') return installWebApp({ id, name, url, summary });
  const jobId = `${source}:${id}`;
  const meta = { id, source, name: name || id };
  emit('install:progress', { ...meta, id: jobId, percent: 0, stage: 'stage:starting', running: true });

  let result;
  if (source === 'flatpak') {
    if (!(await has('flatpak'))) return { ok: false, error: 'err:flatpak-missing' };
    await ensureFlathub();
    result = await runJob(jobId, 'flatpak', ['install', '-y', '--user', '--noninteractive', 'flathub', id], { meta });
    if (!result.ok && !result.cancelled && /not installed|no remote|Similar refs/i.test(result.log)) {
      result = await runJob(jobId, 'flatpak', ['install', '-y', '--noninteractive', 'flathub', id], { meta });
    }
  } else if (source === 'snap') {
    if (!(await has('snap'))) return { ok: false, error: 'err:snap-missing' };
    const args = ['snap', 'install', id];
    if (classic) args.push('--classic');
    result = await runJob(jobId, 'pkexec', args, { meta });
    if (!result.ok && !result.cancelled && /classic confinement/i.test(result.log)) {
      result = await runJob(jobId, 'pkexec', ['snap', 'install', id, '--classic'], { meta });
    }
  } else if (source === 'apt') {
    if (!(await has('apt-get'))) return { ok: false, error: 'err:apt-missing' };
    result = await runJob(jobId, 'pkexec', [
      'apt-get', 'install', '-y', '-o', 'APT::Status-Fd=2', '-o', 'Dpkg::Use-Pty=0', id
    ], { meta });
  } else {
    return { ok: false, error: 'err:unknown-source' };
  }

  if (result.cancelled) return { ok: false, cancelled: true };
  if (!result.ok) {
    const tail = (result.log || '').split('\n').filter(Boolean).slice(-4).join(' · ').slice(0, 300);
    return { ok: false, error: tail || `err:installer-exit-code:${result.code}` };
  }
  return { ok: true, id, source, name: meta.name };
}

// Desinstala un .desktop "suelto" que no viene de flatpak/snap/apt: primero intenta
// resolver el paquete dpkg real que lo instaló (dpkg -S) y, si lo encuentra, hace una
// desinstalación real con `apt-get remove` a través de pkexec (el diálogo gráfico de
// sudo/Polkit). Si el .desktop no pertenece a ningún paquete (acceso manual), borra
// el archivo directamente — con pkexec si vive fuera de la carpeta del usuario.
async function removeDesktopApp({ id, name, desktopFile }) {
  const jobId = `rm:sistema:${id}`;
  if (!desktopFile) return { ok: false, error: 'err:no-launch-method' };

  const owner = await sh('dpkg', ['-S', desktopFile]);
  if (owner.ok && owner.stdout.includes(':')) {
    const pkgName = owner.stdout.split(':')[0].trim().split(',')[0].trim();
    if (pkgName) {
      const result = await runJob(jobId, 'pkexec', [
        'apt-get', 'remove', '-y', '-o', 'APT::Status-Fd=2', pkgName
      ], { meta: { id, source: 'sistema', name: name || id } });
      if (result.cancelled) return { ok: false, cancelled: true };
      if (result.ok) return { ok: true, id, source: 'sistema' };
      const tail = (result.log || '').split('\n').filter(Boolean).slice(-4).join(' · ').slice(0, 300);
      return { ok: false, error: tail || `err:installer-exit-code:${result.code}` };
    }
  }

  const insideHome = desktopFile.startsWith(os.homedir());
  if (insideHome) {
    try { await fsp.unlink(desktopFile); return { ok: true, id, source: 'sistema' }; }
    catch (e) { return { ok: false, error: e.message }; }
  }
  const rm = await sh('pkexec', ['rm', '-f', desktopFile]);
  return rm.ok ? { ok: true, id, source: 'sistema' } : { ok: false, error: 'err:remove-failed' };
}

async function removePackage({ id, source, name, desktopFile }) {
  const jobId = `rm:${source}:${id}`;
  if (source === 'webapp') {
    await deleteWebappFiles(id);
    const custom = await loadCustomWebviews();
    await saveCustomWebviews(custom.filter((w) => w.id !== id));
    return { ok: true, id, source };
  }
  if (source === 'flatpak') return runJob(jobId, 'flatpak', ['uninstall', '-y', '--noninteractive', id], { meta: { id, source } });
  if (source === 'snap') return runJob(jobId, 'pkexec', ['snap', 'remove', id], { meta: { id, source } });
  if (source === 'apt') return runJob(jobId, 'pkexec', ['apt-get', 'remove', '-y', '-o', 'APT::Status-Fd=2', id], { meta: { id, source } });
  if (source === 'sistema') return removeDesktopApp({ id, name, desktopFile });
  return { ok: false, error: 'err:unknown-source' };
}

async function cancelJob(jobId) {
  const child = jobs.get(jobId);
  if (!child) return { ok: false };
  child.__cancelled = true;
  try { await bash(`pkill -TERM -P ${child.pid} 2>/dev/null`); } catch { /* sin hijos */ }
  child.kill('SIGTERM');
  setTimeout(() => { try { child.kill('SIGKILL'); } catch { /* ya terminó */ } }, 4000);
  return { ok: true };
}

/* ─────────────────────────── actualizaciones ─────────────────────────── */

async function checkUpdates() {
  const out = { flatpak: [], snap: [], apt: [] };
  if (await has('flatpak')) {
    const r = await sh('flatpak', ['remote-ls', '--updates', '--app', '--columns=application,version'], { timeout: 45000 });
    out.flatpak = r.stdout.trim().split('\n').filter(Boolean).map((l) => {
      const [id, version] = l.split('\t');
      return { id, version: version || '', source: 'flatpak' };
    });
  }
  if (await has('snap')) {
    const r = await sh('snap', ['refresh', '--list'], { timeout: 45000 });
    out.snap = r.stdout.trim().split('\n').slice(1).filter(Boolean).map((l) => {
      const p = l.trim().split(/\s+/);
      return { id: p[0], version: p[1] || '', source: 'snap' };
    });
  }
  if (await has('apt')) {
    const r = await sh('apt', ['list', '--upgradable'], { timeout: 45000 });
    out.apt = r.stdout.trim().split('\n').slice(1).filter(Boolean).map((l) => {
      const id = l.split('/')[0];
      const version = (l.match(/\s(\S+)\s\[/) || [])[1] || '';
      return { id, version, source: 'apt' };
    });
  }
  return out;
}

async function applyUpdates(source) {
  const jobId = `update:${source}`;
  if (source === 'flatpak') return runJob(jobId, 'flatpak', ['update', '-y', '--noninteractive'], { meta: { name: 'Flatpak', source } });
  if (source === 'snap') return runJob(jobId, 'pkexec', ['snap', 'refresh'], { meta: { name: 'Snap', source } });
  if (source === 'apt') {
    await runJob(`${jobId}:idx`, 'pkexec', ['apt-get', 'update', '-o', 'APT::Status-Fd=2'], { meta: { name: 'APT Index', source } });
    return runJob(jobId, 'pkexec', ['apt-get', 'upgrade', '-y', '-o', 'APT::Status-Fd=2'], { meta: { name: 'APT', source } });
  }
  return { ok: false };
}

/* ─────────────────────────── extensiones de GNOME ─────────────────────────── */

async function extensionSearch(query) {
  const b = await backends();
  const shellVersion = b.shellVersion || '45';
  const url = `https://extensions.gnome.org/extension-query/?search=${encodeURIComponent(query || '')}&page=1&shell_version=${encodeURIComponent(shellVersion)}&sort=popularity`;
  const json = await httpJSON(url);
  return (json.extensions || []).slice(0, 30).map((e) => ({
    id: e.uuid,
    pk: e.pk,
    source: 'gnome-extension',
    name: e.name,
    summary: (e.description || '').split('\n')[0].slice(0, 160),
    icon: e.icon ? `https://extensions.gnome.org${e.icon}` : null,
    publisher: e.creator || '',
    versions: e.shell_version_map || {},
    downloads: e.downloads || 0
  }));
}

async function installExtension(ext) {
  const jobId = `gnome-extension:${ext.id}`;
  const b = await backends();
  if (!b.gnomeExt) return { ok: false, error: 'err:not-gnome' };

  const map = ext.versions || {};
  const key = Object.keys(map).find((k) => b.shellVersion.startsWith(k)) || Object.keys(map).pop();
  if (!key) return { ok: false, error: 'err:extension-incompatible' };
  const tag = map[key].pk;

  const tmp = path.join(os.tmpdir(), `${ext.id.replace(/[^\w.-]/g, '_')}.zip`);
  emit('install:progress', { id: jobId, name: ext.name, source: 'gnome-extension', percent: 2, stage: 'stage:downloading', running: true });
  try {
    await download(
      `https://extensions.gnome.org/download-extension/${encodeURIComponent(ext.id)}.shell-extension.zip?version_tag=${tag}`,
      tmp,
      (pct) => emit('install:progress', {
        id: jobId, name: ext.name, source: 'gnome-extension',
        percent: pct === null ? 50 : Math.round(pct * 0.8), stage: 'stage:downloading', running: true
      })
    );
  } catch (e) {
    return { ok: false, error: `err:download-failed:${e.message}` };
  }

  emit('install:progress', { id: jobId, name: ext.name, source: 'gnome-extension', percent: 85, stage: 'stage:installing', running: true });
  const inst = await sh('gnome-extensions', ['install', '--force', tmp]);
  if (!inst.ok) return { ok: false, error: inst.stderr.trim() || 'err:extension-install-failed' };
  await sh('gnome-extensions', ['enable', ext.id]);
  fs.promises.unlink(tmp).catch(() => {});
  emit('install:progress', { id: jobId, name: ext.name, source: 'gnome-extension', percent: 100, stage: 'stage:ready', running: false });
  return { ok: true, id: ext.id, source: 'gnome-extension', name: ext.name, note: 'note:may-need-logout' };
}

async function listExtensions() {
  if (!(await has('gnome-extensions'))) return [];
  const enabled = (await sh('gnome-extensions', ['list', '--enabled'])).stdout.trim().split('\n').filter(Boolean);
  const all = (await sh('gnome-extensions', ['list'])).stdout.trim().split('\n').filter(Boolean);
  return all.map((uuid) => ({ id: uuid, name: uuid.split('@')[0].replace(/[-_]/g, ' '), source: 'gnome-extension', enabled: enabled.includes(uuid) }));
}

/* ─────────────────────────── lanzar aplicaciones ─────────────────────────── */

async function launchApp({ desktopFile, exec, id, source }) {
  if (desktopFile && await has('gio')) {
    const r = await sh('gio', ['launch', desktopFile]);
    if (r.ok) return { ok: true };
  }
  if (source === 'flatpak') { spawn('flatpak', ['run', id], { detached: true, stdio: 'ignore' }).unref(); return { ok: true }; }
  if (source === 'snap') { spawn('snap', ['run', id], { detached: true, stdio: 'ignore' }).unref(); return { ok: true }; }
  if (exec) {
    const cmd = exec.replace(/%[fFuUdDnNickvm]/g, '').trim();
    spawn('/bin/bash', ['-lc', cmd], { detached: true, stdio: 'ignore' }).unref();
    return { ok: true };
  }
  return { ok: false, error: 'err:no-launch-method' };
}

/* ─────────────────────────── IPC ─────────────────────────── */

const handle = (channel, fn) => ipcMain.handle(channel, async (_e, payload) => {
  try { return await fn(payload); }
  catch (err) { return { __error: err.message || String(err) }; }
});

handle('device:info', deviceInfo);
handle('device:stats', deviceStats);
handle('backends', backends);
handle('catalog:list', (q) => catalog(q));
handle('catalog:feed', (cursor) => feedBatch(cursor));
handle('office:list', officeList);
handle('webapp:install', installWebApp);
handle('dev:list', devList);
handle('webapp:popular', () => POPULAR_WEBAPPS);
handle('webapp:search', (q) => webSearch(q));
handle('app:preview', previewApp);
handle('apps:system', systemApps);
handle('apps:installed', installedPackages);
handle('pkg:install', installPackage);
handle('pkg:remove', removePackage);
handle('pkg:cancel', cancelJob);
handle('updates:check', checkUpdates);
handle('updates:apply', applyUpdates);
handle('ext:search', extensionSearch);
handle('ext:install', installExtension);
handle('ext:list', listExtensions);
handle('app:launch', launchApp);
handle('open:external', (url) => shell.openExternal(url));
// Controles nativos de la ventana.
// Estos handlers coinciden con ipcRenderer.send() del preload.
ipcMain.on('window:minimize', () => {
  if (win && !win.isDestroyed()) win.minimize();
});

ipcMain.on('window:maximize', () => {
  if (!win || win.isDestroyed()) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on('window:close', () => {
  if (win && !win.isDestroyed()) win.close();
});

/* ─────────────────────────── mini ventana de instalación ─────────────────────────── */
// Mientras se instala algo y el usuario minimiza appPoint o se va a otra app, aparece una mini
// ventana (mismo estilo que la pantalla de carga) con el progreso. Al volver a appPoint se cierra sola.
// Si estorba, se puede minimizar con su botón; vuelve a aparecer la próxima vez que se salga de la app.
// El renderer es quien manda los datos (ya traducidos) con 'mini:update'; aquí solo se decide cuándo mostrarla.

const MINI_W = 280;
const MINI_H = 300;
const MINI_RESULT_MS = 12000; // cuánto se queda visible el aviso de "terminó" / "falló"
let mini = null;
let miniDismissed = false;    // el usuario la cerró a la fuerza (p. ej. Alt+F4): no la reabrimos hasta que vuelva a la app
let miniData = { phase: 'idle' };
let miniResultTimer = null;
let miniSyncTimer = null;

const str = (v, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '');

function sanitizeMini(d) {
  const x = d && typeof d === 'object' ? d : {};
  const phase = ['progress', 'done', 'error'].includes(x.phase) ? x.phase : 'idle';
  const labels = {};
  for (const k of ['cancel', 'cancelling', 'open', 'showApp', 'minimize']) labels[k] = str(x.labels && x.labels[k], 60);
  const launch = x.launch && typeof x.launch === 'object'
    ? { id: str(x.launch.id, 300), source: str(x.launch.source, 30) } : null;
  return {
    phase,
    theme: x.theme === 'light' ? 'light' : 'dark',
    name: str(x.name, 120),
    icon: /^(https?:|data:image\/)/i.test(x.icon || '') ? str(x.icon, 2000) : '',
    head: str(x.head, 80),
    stage: str(x.stage, 120),
    message: str(x.message, 200),
    queue: str(x.queue, 60),
    percent: Math.max(0, Math.min(100, Math.round(Number(x.percent) || 0))),
    indeterminate: x.indeterminate === true,
    key: str(x.key, 300),
    launch,
    labels
  };
}

// ¿El usuario está "fuera" de appPoint? (minimizada, oculta, o el foco está en otra aplicación)
function userIsAway() {
  if (!win || win.isDestroyed()) return false;
  if (win.isMinimized() || !win.isVisible()) return true;
  if (win.isFocused()) return false;
  for (const pw of previewWindows) if (!pw.isDestroyed() && pw.isFocused()) return false; // está viendo una ficha de la app
  return true;
}

function destroyMini() {
  if (mini && !mini.isDestroyed()) { mini.__ours = true; mini.destroy(); }
  mini = null;
}

function createMini() {
  const wa = screen.getPrimaryDisplay().workArea;
  const m = new BrowserWindow({
    width: MINI_W,
    height: MINI_H,
    x: wa.x + wa.width - MINI_W - 20,   // esquina inferior derecha; se puede arrastrar
    y: wa.y + wa.height - MINI_H - 20,
    frame: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    backgroundColor: '#17181c',
    alwaysOnTop: true,
    skipTaskbar: false, // visible en la barra: así, si la minimizas, puedes recuperarla desde ahí
    title: 'appPoint',
    icon: path.join(__dirname, 'src', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'mini-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  mini = m;
  m.setMenuBarVisibility(false);
  m.on('closed', () => {
    if (!m.__ours) miniDismissed = true;
    if (mini === m) mini = null;
  });
  m.loadFile(path.join(__dirname, 'src', 'mini.html'));
  m.once('ready-to-show', () => { if (!m.isDestroyed()) m.showInactive(); });
}

function pushMini() {
  if (mini && !mini.isDestroyed()) mini.webContents.send('mini:data', miniData);
}

// Decide si la mini ventana debe existir ahora mismo y la crea, actualiza o cierra.
function syncMini() {
  const away = userIsAway();
  if (!away) miniDismissed = false;
  if (miniData.phase === 'idle' || !away) { destroyMini(); return; }
  if (miniDismissed) return;
  if (!mini || mini.isDestroyed()) { createMini(); return; }
  // Si el usuario la minimizó, no la molestamos con el progreso; sí avisamos cuando termina o falla.
  if (mini.isMinimized() && miniData.phase !== 'progress') mini.restore();
  pushMini();
}

// Los eventos de foco llegan en ráfagas (uno pierde el foco y otro lo gana): esperamos a que se asienten.
function scheduleMiniSync() {
  clearTimeout(miniSyncTimer);
  miniSyncTimer = setTimeout(syncMini, 150);
}

ipcMain.on('mini:update', (e, data) => {
  if (!win || win.isDestroyed() || e.sender !== win.webContents) return;
  miniData = sanitizeMini(data);
  clearTimeout(miniResultTimer);
  if (miniData.phase === 'done' || miniData.phase === 'error') {
    miniResultTimer = setTimeout(() => { miniData = { phase: 'idle' }; syncMini(); }, MINI_RESULT_MS);
  }
  syncMini();
});

// Mensajes que solo puede mandar la propia mini ventana.
const fromMini = (e) => mini && !mini.isDestroyed() && e.sender === mini.webContents;
ipcMain.on('mini:ready', (e) => { if (fromMini(e)) pushMini(); });
ipcMain.on('mini:minimize', (e) => { if (fromMini(e)) mini.minimize(); });
ipcMain.on('mini:show-main', (e) => {
  if (!fromMini(e) || !win || win.isDestroyed()) return;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
});
ipcMain.on('mini:cancel', (e) => {
  if (!fromMini(e) || miniData.phase !== 'progress' || !miniData.key) return;
  cancelJob(miniData.key);
  miniData = { ...miniData, stage: miniData.labels.cancelling || miniData.stage, indeterminate: true };
  pushMini();
});
ipcMain.on('mini:open', (e) => {
  if (!fromMini(e) || !miniData.launch) return;
  launchApp(miniData.launch).catch(() => {});
  clearTimeout(miniResultTimer);
  miniData = { phase: 'idle' };
  syncMini();
});

/* ─────────────────────────── pantalla de carga ─────────────────────────── */

function createSplash() {
  splash = new BrowserWindow({
    width: 280,
    height: 280,
    frame: false,
    resizable: false,
    movable: false,
    show: false,
    center: true,
    transparent: false,
    backgroundColor: '#17181c',
    skipTaskbar: true,
    alwaysOnTop: true,
    icon: path.join(__dirname, 'src', 'icon.png'),
    webPreferences: { sandbox: false }
  });
  splash.loadFile(path.join(__dirname, 'src', 'splash.html'));
  splash.once('ready-to-show', () => splash.show());
}

/* ─────────────────────────── ventana ─────────────────────────── */

function createWindow() {
  win = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 720,
    minHeight: 560,
    backgroundColor: '#17181c',
    frame: false,
    titleBarStyle: 'hidden',
    show: false,
    icon: path.join(__dirname, 'src', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      backgroundThrottling: false // que el progreso siga fluyendo con la ventana minimizada
    }
  });
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  for (const ev of ['minimize', 'restore', 'show', 'hide', 'focus', 'blur']) win.on(ev, scheduleMiniSync);
  win.on('closed', () => { clearTimeout(miniSyncTimer); clearTimeout(miniResultTimer); destroyMini(); });
  // La pantalla de carga se ve como mínimo 3s: si la ventana principal está
  // lista antes, esperamos; si tarda más, la mostramos apenas esté lista.
  const splashStart = Date.now();
  win.once('ready-to-show', () => {
    const elapsed = Date.now() - splashStart;
    const wait = Math.max(0, 3000 - elapsed);
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) splash.destroy();
      splash = null;
      win.show();
    }, wait);
  });
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => {
  createSplash();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  for (const [, child] of jobs) { try { child.kill('SIGTERM'); } catch { /* ya terminó */ } }
  for (const pw of previewWindows) { try { pw.close(); } catch { /* ya cerrada */ } }
  app.quit();
});
