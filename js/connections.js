/**
 * connections.js — Gnoke HMI Connection Manager
 * Status: Coming Soon — UI placeholder only, no live driver logic.
 */
const Connections = (() => {
  const STORAGE_KEY = 'gnoke_connection_type';
  let previousPage = 'zones-page';

  const TYPES = [
    { id: 'webserial', name: 'WebSerial', desc: 'Direct USB/Serial cable connection.' },
    { id: 'webusb',    name: 'WebUSB',    desc: 'High-speed industrial hardware link.' },
    { id: 'wifi',      name: 'WiFi (IP)', desc: 'Remote link via local network/Raspberry Pi.' }
  ];

  function init() {
    _injectStyles();
    _patchDrawer();
  }

  function renderPage(fromPageId) {
    previousPage = fromPageId || State.get('activePage') || 'zones-page';

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    let connPage = document.getElementById('connections-page');
    if (!connPage) {
      connPage = document.createElement('section');
      connPage.id = 'connections-page';
      connPage.className = 'page';
      document.getElementById('main-content').appendChild(connPage);
    }

    connPage.classList.add('active');
    State.set('activePage', 'connections-page');

    _renderContent(connPage);
  }

  function _renderContent(connPage) {
    const currentType = localStorage.getItem(STORAGE_KEY) || 'webserial';
    const typeObj     = TYPES.find(t => t.id === currentType);

    connPage.innerHTML = `
      <header class="page-header">
        <div class="page-title-group">
          <h1 class="page-title">Hardware Connection</h1>
          <p class="page-subtitle">Select your HMI interface protocol.</p>
        </div>
        <button class="btn btn-secondary" id="conn-back-btn">✕ Close</button>
      </header>

      <div class="card card-flush anim-fade-in">
        <div class="form-group">
          <label class="label">Connection Method</label>
          <select class="input" id="conn-type-select">
            ${TYPES.map(t =>
              `<option value="${t.id}" ${t.id === currentType ? 'selected' : ''}>${t.name}</option>`
            ).join('')}
          </select>
        </div>

        <div id="conn-status-area" style="margin-top:20px;padding:32px 20px;border:1px dashed var(--border);border-radius:var(--radius);text-align:center;">
          <span class="chip info" id="conn-status-chip">Status: On Demand</span>
          <p id="conn-desc" style="font-size:0.85rem;color:var(--text2);margin-top:10px;max-width:260px;margin-inline:auto;">
            ${typeObj.desc}
          </p>

          <!-- Coming Soon notice -->
          <div class="conn-coming-soon">
            <span class="conn-soon-badge">🔧 Coming Soon</span>
            <p class="conn-soon-text">
              Live hardware integration is available as a custom add-on.<br>
              Please contact support to get this set up for your device.
            </p>
          </div>
        </div>
      </div>
    `;

    connPage.querySelector('#conn-back-btn').addEventListener('click', () => goBack());
    connPage.querySelector('#conn-type-select').addEventListener('change', e => saveType(e.target.value));
  }

  function saveType(val) {
    localStorage.setItem(STORAGE_KEY, val);
    const typeObj = TYPES.find(t => t.id === val);
    const descEl  = document.getElementById('conn-desc');
    if (descEl) descEl.textContent = typeObj.desc;

    if (window.UI) UI.toast(`Protocol set to ${typeObj.name}.`, 'info');
  }

  function goBack() {
    if (window.loadPage) window.loadPage(previousPage);
  }

  function _patchDrawer() {
    const drawer = document.getElementById('drawer');
    if (!drawer) return;

    const btns    = drawer.querySelectorAll('.drawer-btn');
    const lastBtn = btns[btns.length - 1];

    const btn = document.createElement('button');
    btn.className = 'drawer-btn';
    btn.innerHTML = '🔌 Connection';
    btn.onclick   = () => {
      Connections.renderPage(State.get('activePage'));
      if (window.Drawer) Drawer.close();
    };

    if (lastBtn) lastBtn.after(btn);
    else drawer.appendChild(btn);
  }

  function _injectStyles() {
    if (document.getElementById('conn-styles')) return;
    const style = document.createElement('style');
    style.id = 'conn-styles';
    style.textContent = `
      .anim-fade-in { animation: connFadeIn 0.4s ease forwards; }
      @keyframes connFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .conn-coming-soon {
        margin-top: 18px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
      }

      .conn-soon-badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--accent);
        background: var(--accent-lt, rgba(var(--accent-rgb, 59,130,246), 0.1));
        border: 1px solid var(--accent-dim, rgba(59,130,246,0.25));
        border-radius: 99px;
        padding: 3px 10px;
      }

      .conn-soon-text {
        font-size: 0.82rem;
        color: var(--text2);
        line-height: 1.55;
        max-width: 260px;
        margin: 0;
      }
    `;
    document.head.appendChild(style);
  }

  return { init, renderPage, saveType, goBack };
})();

// Auto-init when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', Connections.init);
} else {
  Connections.init();
}