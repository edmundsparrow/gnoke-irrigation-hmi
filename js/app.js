/**
 * app.js — Gnoke Irrigation
 * All business logic, rendering, and event wiring.
 * Data stored in localStorage (no SQLite needed — simple CRUD).
 */

/* ── Storage keys ── */
const KEYS = {
  zones     : 'gnoke_irrigation_zones',
  schedules : 'gnoke_irrigation_schedules',
  log       : 'gnoke_irrigation_log',
};

/* ── Data helpers ── */
function load(key)       { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } }
function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
function uid()           { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

/* ── Days of week ── */
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

/* ── Page routing ── */
function loadPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  State.set('activePage', pageId);
  document.getElementById('context-info').textContent = '';

  if (pageId === 'zones-page')     renderZones();
  if (pageId === 'schedules-page') renderSchedules();
  if (pageId === 'log-page')       renderLog();
}
window.loadPage = loadPage;


/* ══════════════════════════════════════════════════════════════
   ZONES
══════════════════════════════════════════════════════════════ */

function renderZones() {
  const zones     = load(KEYS.zones);
  const log       = load(KEYS.log);
  const today     = new Date().toISOString().split('T')[0];
  const todayRuns = log.filter(e => e.date === today).length;

  // Stats
  document.getElementById('stat-zones').textContent  = zones.length;
  document.getElementById('stat-active').textContent = zones.filter(z => z.active).length;
  document.getElementById('stat-today').textContent  = todayRuns;

  const sub = zones.length
    ? `${zones.length} zone${zones.length > 1 ? 's' : ''} configured`
    : 'No zones yet';
  document.getElementById('zones-sub').textContent = sub;

  const container = document.getElementById('zones-list');

  if (!zones.length) {
    container.innerHTML = '<p class="hint" style="text-align:center;padding:24px;">No zones yet. Add one above.</p>';
    return;
  }

  container.innerHTML = zones.map(z => {
    const isActive = !!z.active;
    return `
      <div class="zone-card${isActive ? ' active' : ''}" style="margin-bottom:8px;">
        <div class="zone-indicator"></div>
        <div class="zone-info">
          <div class="zone-name">${z.name}</div>
          <div class="zone-meta">
            ${z.flowRate ? z.flowRate + ' L/min' : '—'}
            ${z.notes ? ' · ' + z.notes : ''}
            ${isActive ? ' · <span style="color:var(--accent);font-weight:600;">Running</span>' : ''}
          </div>
        </div>
        <div class="zone-actions">
          <button class="btn btn-sm ${isActive ? 'btn-danger' : 'btn-primary'}"
            onclick="toggleZone('${z.id}')">
            ${isActive ? 'Stop' : 'Start'}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="deleteZoneConfirm('${z.id}','${z.name}')">✕</button>
        </div>
      </div>
    `;
  }).join('');
}

function saveZone() {
  const name     = document.getElementById('zone-name-input').value.trim();
  const flowRate = document.getElementById('zone-flow-input').value.trim();
  const notes    = document.getElementById('zone-notes-input').value.trim();

  if (!name) { UI.toast('Zone name is required.', 'err'); return; }

  const zones = load(KEYS.zones);
  zones.push({ id: uid(), name, flowRate: flowRate || '', notes, active: false, createdAt: new Date().toISOString() });
  save(KEYS.zones, zones);

  document.getElementById('zone-name-input').value  = '';
  document.getElementById('zone-flow-input').value  = '';
  document.getElementById('zone-notes-input').value = '';

  UI.closeModal('add-zone-modal');
  UI.toast('Zone added.', 'ok');
  UI.status('saved');
  renderZones();
}
window.saveZone = saveZone;

function toggleZone(id) {
  const zones = load(KEYS.zones);
  const zone  = zones.find(z => z.id === id);
  if (!zone) return;

  zone.active = !zone.active;
  save(KEYS.zones, zones);

  // Log the run start/stop
  if (zone.active) {
    zone._startedAt = new Date().toISOString();
    save(KEYS.zones, zones);
  } else {
    const started   = zone._startedAt ? new Date(zone._startedAt) : null;
    const now       = new Date();
    const durMin    = started ? Math.round((now - started) / 60000) : 0;
    const litres    = durMin * (parseFloat(zone.flowRate) || 0);
    const log       = load(KEYS.log);
    log.unshift({
      id       : uid(),
      date     : now.toISOString().split('T')[0],
      time     : now.toTimeString().slice(0,5),
      zoneId   : zone.id,
      zoneName : zone.name,
      duration : durMin,
      trigger  : 'manual',
      litres   : Math.round(litres),
    });
    save(KEYS.log, log);
    zone._startedAt = null;
    save(KEYS.zones, zones);
  }

  UI.status(zone.active ? 'running' : 'stopped');
  renderZones();
}
window.toggleZone = toggleZone;

function deleteZoneConfirm(id, name) {
  document.getElementById('confirm-title').textContent = 'Delete Zone';
  document.getElementById('confirm-body').textContent  = `Delete "${name}"? This will also remove its schedules.`;
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = () => { deleteZone(id); UI.closeModal('confirm-modal'); };
  UI.openModal('confirm-modal');
}
window.deleteZoneConfirm = deleteZoneConfirm;

function deleteZone(id) {
  save(KEYS.zones, load(KEYS.zones).filter(z => z.id !== id));
  save(KEYS.schedules, load(KEYS.schedules).filter(s => s.zoneId !== id));
  UI.toast('Zone deleted.', 'ok');
  renderZones();
}


/* ══════════════════════════════════════════════════════════════
   SCHEDULES
══════════════════════════════════════════════════════════════ */

function openAddScheduleModal() {
  const zones  = load(KEYS.zones);
  const select = document.getElementById('sched-zone-select');

  if (!zones.length) {
    UI.toast('Add a zone first.', 'err');
    return;
  }

  select.innerHTML = zones.map(z =>
    `<option value="${z.id}">${z.name}</option>`
  ).join('');

  // Build days picker
  const picker = document.getElementById('days-picker');
  picker.innerHTML = DAYS.map(d => `
    <label style="display:flex;align-items:center;gap:4px;cursor:pointer;
      font-family:var(--font-mono);font-size:.7rem;letter-spacing:.06em;
      text-transform:uppercase;color:var(--text2);">
      <input type="checkbox" value="${d}" style="accent-color:var(--accent);width:13px;height:13px;" />
      ${d}
    </label>
  `).join('');

  UI.openModal('add-schedule-modal');
}
window.openAddScheduleModal = openAddScheduleModal;

function saveSchedule() {
  const zoneId   = document.getElementById('sched-zone-select').value;
  const time     = document.getElementById('sched-time-input').value;
  const duration = document.getElementById('sched-duration-input').value.trim();

  const selectedDays = [...document.querySelectorAll('#days-picker input:checked')]
    .map(cb => cb.value);

  if (!zoneId)           { UI.toast('Select a zone.', 'err');        return; }
  if (!time)             { UI.toast('Set a start time.', 'err');     return; }
  if (!duration)         { UI.toast('Set a duration.', 'err');       return; }
  if (!selectedDays.length) { UI.toast('Select at least one day.', 'err'); return; }

  const zones    = load(KEYS.zones);
  const zone     = zones.find(z => z.id === zoneId);
  const schedules = load(KEYS.schedules);

  schedules.push({
    id        : uid(),
    zoneId,
    zoneName  : zone?.name || '',
    time,
    duration  : parseInt(duration),
    days      : selectedDays,
    createdAt : new Date().toISOString(),
  });
  save(KEYS.schedules, schedules);

  document.getElementById('sched-duration-input').value = '';
  UI.closeModal('add-schedule-modal');
  UI.toast('Schedule added.', 'ok');
  UI.status('saved');
  renderSchedules();
}
window.saveSchedule = saveSchedule;

function renderSchedules() {
  const schedules = load(KEYS.schedules);
  const container = document.getElementById('schedules-list');

  if (!schedules.length) {
    container.innerHTML = '<p class="hint" style="text-align:center;padding:24px;">No schedules yet.</p>';
    return;
  }

  // Sort by time
  const sorted = [...schedules].sort((a,b) => a.time.localeCompare(b.time));

  container.innerHTML = sorted.map(s => `
    <div class="sched-row">
      <div class="sched-dot"></div>
      <div class="sched-info">
        <div class="sched-label">${s.zoneName} — ${s.time} · ${s.duration} min</div>
        <div class="sched-meta">${s.days.join(', ')}</div>
      </div>
      <button class="btn btn-sm btn-ghost" onclick="deleteScheduleConfirm('${s.id}')">✕</button>
    </div>
  `).join('');
}

function deleteScheduleConfirm(id) {
  document.getElementById('confirm-title').textContent = 'Delete Schedule';
  document.getElementById('confirm-body').textContent  = 'Remove this schedule?';
  const btn = document.getElementById('confirm-ok-btn');
  btn.onclick = () => { deleteSchedule(id); UI.closeModal('confirm-modal'); };
  UI.openModal('confirm-modal');
}
window.deleteScheduleConfirm = deleteScheduleConfirm;

function deleteSchedule(id) {
  save(KEYS.schedules, load(KEYS.schedules).filter(s => s.id !== id));
  UI.toast('Schedule removed.', 'ok');
  renderSchedules();
}


/* ══════════════════════════════════════════════════════════════
   LOG
══════════════════════════════════════════════════════════════ */

function renderLog() {
  const log   = load(KEYS.log);
  const tbody = document.getElementById('log-tbody');

  if (!log.length) {
    UI.empty(tbody, 5, 'No log entries yet. Start a zone to begin logging.');
    return;
  }

  tbody.innerHTML = log.slice(0, 100).map(e => `
    <tr>
      <td>${e.date} ${e.time || ''}</td>
      <td>${e.zoneName}</td>
      <td>${e.duration} min</td>
      <td style="text-transform:capitalize">${e.trigger}</td>
      <td class="num">${e.litres || 0}</td>
    </tr>
  `).join('');
}


/* ══════════════════════════════════════════════════════════════
   EXPORT
══════════════════════════════════════════════════════════════ */

function exportLog() {
  const log = load(KEYS.log);
  if (!log.length) { UI.toast('No log data to export.', 'err'); return; }

  const header = 'Date,Time,Zone,Duration (min),Trigger,Litres';
  const rows   = log.map(e =>
    `${e.date},${e.time || ''},${e.zoneName},${e.duration},${e.trigger},${e.litres || 0}`
  );
  const csv  = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `irrigation-log-${State.get('today')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  UI.toast('Log exported.', 'ok');
}
window.exportLog = exportLog;


/* ══════════════════════════════════════════════════════════════
   BOOTSTRAP
══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  Theme.init();
  UI.init();
  UI.loading(false);

  /* About tech table */
  const tbody = document.getElementById('about-tech-table');
  if (tbody) {
    tbody.innerHTML = [
      ['Database',    'localStorage (JSON)'],
      ['Persistence', 'Browser storage'],
      ['Network',     'None required'],
      ['Stack',       'HTML · CSS · Vanilla JS'],
      ['Version',     'v1.0'],
    ].map(([k,v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  }

  /* Drawer */
  const Drawer = (() => {
    const panel   = () => document.getElementById('drawer');
    const overlay = () => document.getElementById('drawer-overlay');
    function open()  { panel()?.classList.add('open');    overlay()?.classList.add('open');    }
    function close() { panel()?.classList.remove('open'); overlay()?.classList.remove('open'); }
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    document.getElementById('hamburger')?.addEventListener('click', open);
    document.getElementById('drawer-close')?.addEventListener('click', close);
    return { open, close };
  })();
  window.Drawer = Drawer;

  /* Initial render */
  loadPage('zones-page');
});
