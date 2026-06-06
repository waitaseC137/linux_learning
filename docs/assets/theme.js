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
    if (!btn) return;
    syncBtn(btn);
    btn.addEventListener('click', () => {
      const i = ORDER.indexOf(current);
      current = ORDER[(i + 1) % ORDER.length];
      apply(current);
      try { localStorage.setItem(KEY, current); } catch (e) {}
      syncBtn(btn);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else { wire(); }
})();
