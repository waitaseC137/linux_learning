/* ============================================================
   Menü sesleri — kullanıcının kendi WAV dosyaları
   3.wav konu/level açılışı · 4.wav seçim · 5.wav hover · 6.wav sistem-online
   Tüm sayfalarda paylaşılır. localStorage: ll_sfx (on/off)
   ============================================================ */
(function () {
  const KEY = 'll_sfx';
  let enabled = true;
  try { enabled = (localStorage.getItem(KEY) || 'on') !== 'off'; } catch (e) {}

  // betiğin kendi konumundan asset tabanını türet (alt klasörlerden de çalışsın, ör. /en/)
  const SFX_BASE = (function () {
    const s = document.currentScript ||
      [].slice.call(document.querySelectorAll('script')).filter(function (x) { return /sfx\.js(\?|$)/.test(x.src); }).pop();
    if (s && s.src) return s.src.replace(/sfx\.js.*$/, '');
    return 'assets/';
  })();

  const FILES = {
    hover:  SFX_BASE + 'sfx/5.wav',
    select: SFX_BASE + 'sfx/4.wav',
    open:   SFX_BASE + 'sfx/3.wav',
    power:  SFX_BASE + 'sfx/6.wav'
  };
  const GAIN = { hover: 0.55, select: 0.85, open: 0.7, power: 0.85 };

  const buffers = {};
  let ctx = null, master = null;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.9;
    master.connect(ctx.destination);
    // tüm sesleri çöz (decode için kullanıcı etkileşimi gerekmez)
    Object.keys(FILES).forEach(k => {
      fetch(FILES[k])
        .then(r => r.arrayBuffer())
        .then(ab => new Promise((res, rej) => {
          const p = ctx.decodeAudioData(ab, res, rej);
          if (p && p.then) p.then(res, rej);
        }))
        .then(b => { buffers[k] = b; })
        .catch(() => {});
    });
    return ctx;
  }
  ensureCtx();

  // ilk kullanıcı hareketinde context'i başlat (autoplay politikası)
  function resumeOnce() { if (ctx && ctx.state === 'suspended') ctx.resume(); }
  ['pointerdown', 'keydown', 'click', 'touchstart'].forEach(ev =>
    window.addEventListener(ev, resumeOnce, { passive: true }));

  function play(name) {
    if (!ctx || !buffers[name]) return;
    if (ctx.state === 'suspended') ctx.resume();
    const s = ctx.createBufferSource();
    s.buffer = buffers[name];
    const g = ctx.createGain();
    g.gain.value = GAIN[name] != null ? GAIN[name] : 0.7;
    s.connect(g); g.connect(master);
    try { s.start(0); } catch (e) {}
  }

  const SFX = {
    hover()  { if (enabled) play('hover'); },
    select() { if (enabled) play('select'); },
    open()   { if (enabled) play('open'); },
    power()  { play('power'); }
  };
  window.SFX = SFX;

  /* ---------- olay delegasyonu ---------- */
  const HOVER_SEL = '.nav-links a, .nav-gh, .theme-btn, .feat, .file-link, .tree-row, .chip, .wcard, .cat-head, .btn, .wg, .wg-link, .res a, .doc-nav a, .copy-btn, .code-copy, .gh-view, .side-toggle';
  // tık seçimi: doc açan öğeler hariç (onlar 'open' sesini çalar)
  const SKIP_CLICK = '.file-link, .doc-nav a, .wcard';

  let lastHover = null;
  document.addEventListener('pointerover', (e) => {
    if (!enabled) return;
    const el = e.target.closest && e.target.closest(HOVER_SEL);
    if (!el) { lastHover = null; return; }
    if (el === lastHover) return;                              // öğe içi hareket
    if (e.relatedTarget && el.contains(e.relatedTarget)) return; // alt elemandan giriş
    lastHover = el;
    SFX.hover();
  }, { passive: true });

  document.addEventListener('click', (e) => {
    if (!enabled) return;
    if (e.target.closest && e.target.closest('#sfxBtn')) return;     // toggle kendi sesini çalar
    if (e.target.closest && e.target.closest(SKIP_CLICK)) return;    // doc açılışı 'open' çalacak
    const el = e.target.closest && e.target.closest(HOVER_SEL);
    if (el) SFX.select();
  });

  /* ---------- ses aç/kapa düğmesi ---------- */
  function syncBtn(btn) {
    btn.classList.toggle('off', !enabled);
    const lbl = btn.querySelector('.lbl');
    if (lbl) {
      const en = document.documentElement.lang === 'en';
      lbl.textContent = en ? (enabled ? 'sound' : 'muted') : (enabled ? 'ses' : 'sessiz');
    }
  }
  function wire() {
    const btn = document.getElementById('sfxBtn');
    if (!btn) return;
    syncBtn(btn);
    btn.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch (e) {}
      ensureCtx(); resumeOnce();
      syncBtn(btn);
      if (enabled) SFX.power();   // "sistem online"
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
