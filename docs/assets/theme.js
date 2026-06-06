/* ============================================================
   Tema seçici — fosfor modları (robin / yeşil / amber / magenta)
   Tüm sayfalarda paylaşılır, localStorage'da saklanır.
   <head> içinde yüklenir: tema anında uygulanır (parlama olmaz).
   ============================================================ */
(function () {
  const KEY = 'll_theme';
  const ORDER = ['acik', 'dark'];
  const LABEL = { acik: 'açık', dark: 'karanlık' };

  function apply(theme) {
    if (theme === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  }

  // anında uygula
  let current = 'acik';
  try { current = localStorage.getItem(KEY) || 'acik'; } catch (e) {}
  if (!ORDER.includes(current)) current = 'acik';
  apply(current);

  function syncBtn(btn) {
    const lbl = btn.querySelector('.lbl');
    if (lbl) lbl.textContent = LABEL[current];
  }

  function wire() {
    const btn = document.getElementById('themeBtn');
    if (btn) {
      syncBtn(btn);
      btn.addEventListener('click', () => {
        const i = ORDER.indexOf(current);
        current = ORDER[(i + 1) % ORDER.length];
        apply(current);
        try { localStorage.setItem(KEY, current); } catch (e) {}
        syncBtn(btn);
      });
    }

    // hamburger menü (mobil)
    const burger = document.getElementById('navBurger');
    const inner = document.querySelector('.nav-inner');
    if (burger && inner) {
      const close = () => { inner.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
      burger.addEventListener('click', () => {
        const open = inner.classList.toggle('open');
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      inner.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', close));
      document.addEventListener('click', (e) => {
        if (inner.classList.contains('open') && !inner.contains(e.target)) close();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();
