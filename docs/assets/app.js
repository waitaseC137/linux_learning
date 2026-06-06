/* ============================================================
   linux_learning — interactions
   ============================================================ */

/* ---------- 1. Robin: terminal yazma demosu ---------- */
const SCRIPT_DESKTOP = [
  { t: 'prompt', text: '~/linux_learning $ ', cmd: 'cd robinagent && python robinagent.py' },
  { t: 'blank' },
  { t: 'cat' },
  { t: 'raw', html: '<span class="ty">Robin Agent</span><span class="td"> — Terminal Wargame Asistanı</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">?</span> <span class="tw">Bir wargame seç:</span>' },
  { t: 'raw', html: '  <span class="tm">▸</span> <span class="tw">Bandit</span>     <span class="td">Linux temelleri · 34 level · 1/10</span>' },
  { t: 'raw', html: '  <span class="td">  Leviathan  Binary analizi · 8 level · 3/10</span>' },
  { t: 'raw', html: '  <span class="td">  Natas      Web güvenliği · 35 level · 4/10</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">?</span> <span class="tw">Mod:</span> <span class="ty">[1] AI destekli</span>  <span class="td">[2] Hard mode</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">SSH bağlanıyor</span> <span class="tc">bandit.labs.overthewire.org:2220</span>' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">Oturum açıldı · ilerleme</span> <span class="tm">progress.json</span> <span class="td">kaydedildi</span>' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">NotebookLM defteri hazır — sağ panelden soru sorabilirsin</span>' },
  { t: 'blank' },
  { t: 'prompt', text: 'bandit0@bandit:~$ ', cmd: 'cat readme', last: true },
];

/* mobil: kısa, hizaya dayanmayan satırlar (sarma/taşma olmaz) */
const SCRIPT_MOBILE = [
  { t: 'prompt', text: '~/ll $ ', cmd: 'python robinagent.py' },
  { t: 'blank' },
  { t: 'cat' },
  { t: 'raw', html: '<span class="ty">Robin Agent</span>' },
  { t: 'raw', html: '<span class="td">Terminal Wargame Asistanı</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">?</span> <span class="tw">Wargame seç:</span>' },
  { t: 'raw', html: '  <span class="tm">▸</span> <span class="tw">Bandit</span> <span class="td">· 34 lvl · 1/10</span>' },
  { t: 'raw', html: '    <span class="td">Natas · 35 lvl · 4/10</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">?</span> <span class="tw">Mod:</span> <span class="ty">[1] AI</span> <span class="td">[2] Hard</span>' },
  { t: 'blank' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">SSH →</span> <span class="tc">bandit…:2220</span>' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">Oturum açıldı</span>' },
  { t: 'raw', html: '<span class="tg">✓</span> <span class="td">Defter hazır 🐱</span>' },
  { t: 'blank' },
  { t: 'prompt', text: 'bandit0@bandit:~$ ', cmd: 'cat readme', last: true },
];

const SCRIPT = (window.matchMedia && window.matchMedia('(max-width: 560px)').matches)
  ? SCRIPT_MOBILE : SCRIPT_DESKTOP;

/* etkileşimli kedi: gözler imleci takip eder, ara sıra kırpar */
function buildCat() {
  const line = document.createElement('span');
  line.className = 'line';
  const eye = '<span class="r-eye"><span class="r-pupil"></span></span>';
  const cat =
    '  /\\_____/\\\n' +
    ' /  ' + eye + '   ' + eye + '  \\\n' +
    '( ==  ω  == )\n' +
    ' )         (\n' +
    '(__|___|___|__)';
  line.innerHTML =
    '<span class="cat-name">Robin</span>\n' +
    '<span class="cat-int" data-cat>' + cat + '</span>';
  return line;
}

function wireCat(scope) {
  const cats = scope.querySelectorAll('.cat-int');
  if (!cats.length) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!reduce) {
    window.addEventListener('mousemove', (e) => {
      cats.forEach(cat => {
        const r = cat.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height * 0.38;
        let dx = e.clientX - cx, dy = e.clientY - cy;
        const d = Math.hypot(dx, dy) || 1;
        const m = Math.min(d / 90, 1) * 2.3; // max ~2.3px
        cat.style.setProperty('--ex', (dx / d * m).toFixed(2) + 'px');
        cat.style.setProperty('--ey', (dy / d * m).toFixed(2) + 'px');
      });
    }, { passive: true });
  }

  // göz kırpma
  function blink() {
    cats.forEach(c => c.classList.add('blink'));
    setTimeout(() => cats.forEach(c => c.classList.remove('blink')), 150);
    setTimeout(blink, 2600 + Math.random() * 2800);
  }
  if (!reduce) setTimeout(blink, 1800);
}

function typeTerminal(el) {
  let i = 0;
  el.innerHTML = '';

  function addLine() {
    if (i >= SCRIPT.length) { return; }
    const step = SCRIPT[i];

    if (step.t === 'blank') {
      const l = document.createElement('span');
      l.className = 'line'; l.innerHTML = '\u00A0';
      el.appendChild(l); i++; setTimeout(addLine, 130); return;
    }
    if (step.t === 'cat') {
      el.appendChild(buildCat());
      wireCat(el);
      i++; setTimeout(addLine, 380); return;
    }
    if (step.t === 'raw') {
      const l = document.createElement('span');
      l.className = 'line'; l.innerHTML = step.html; l.style.opacity = '0';
      el.appendChild(l);
      requestAnimationFrame(() => { l.style.transition = 'opacity .25s'; l.style.opacity = '1'; });
      i++; setTimeout(addLine, 230); return;
    }
    if (step.t === 'prompt') {
      const l = document.createElement('span');
      l.className = 'line';
      l.innerHTML = '<span class="tg">' + step.text + '</span><span class="cmd"></span>';
      el.appendChild(l);
      const target = l.querySelector('.cmd');
      typeChars(target, step.cmd, () => {
        i++;
        if (step.last) {
          const cur = document.createElement('span');
          cur.className = 'cursor'; target.appendChild(cur);
        } else { setTimeout(addLine, 240); }
      });
      return;
    }
  }
  addLine();
}

function typeChars(el, text, done) {
  let j = 0;
  (function step() {
    if (j > text.length) { done && done(); return; }
    el.innerHTML = '<span class="ty">' + text.slice(0, j) + '</span><span class="cursor"></span>';
    j++; setTimeout(step, 34 + Math.random() * 40);
  })();
}

/* ---------- 2. Kopyala butonları ---------- */
function wireCopy() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sel = btn.getAttribute('data-copy');
      const pre = document.querySelector(sel);
      if (!pre) return;
      const txt = pre.innerText.replace(/^\$\s?/gm, '').trim();
      navigator.clipboard && navigator.clipboard.writeText(txt);
      const old = btn.textContent;
      btn.textContent = '✓ kopyalandı'; btn.classList.add('ok');
      setTimeout(() => { btn.textContent = old; btn.classList.remove('ok'); }, 1600);
    });
  });
}

/* ---------- 3. Wargame zorluk filtresi ---------- */
function wireFilter() {
  const chips = document.querySelectorAll('.chip');
  const cards = document.querySelectorAll('.wg');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('on'));
      chip.classList.add('on');
      const f = chip.getAttribute('data-filter');
      cards.forEach(card => {
        const band = card.getAttribute('data-band');
        card.style.display = (f === 'all' || f === band) ? '' : 'none';
      });
    });
  });
}

/* ---------- 4. Scroll reveal ---------- */
function wireReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

/* ---------- 5. Kart 3B tilt ---------- */
function wireTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.matchMedia('(hover: none)').matches) return;
  document.querySelectorAll('.wg').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform =
        'translateY(-3px) rotateY(' + (px * 7).toFixed(2) + 'deg) rotateX(' + (-py * 7).toFixed(2) + 'deg)';
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}

/* ---------- 6. Footer mini kedi (göz kırpan) ---------- */
function wireFootCat() {
  const el = document.getElementById('footCat');
  if (!el) return;
  const open = ' /\\_/\\\n( o.o )\n  > ω <';
  const shut = ' /\\_/\\\n( -.- )\n  > ω <';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.textContent = open;
  if (reduce) return;
  (function loop() {
    setTimeout(() => {
      el.textContent = shut;
      setTimeout(() => { el.textContent = open; loop(); }, 160);
    }, 2400 + Math.random() * 3000);
  })();
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const term = document.getElementById('hero-term');
  if (term) typeTerminal(term);
  wireCopy();
  wireFilter();
  wireReveal();
  wireTilt();
  wireFootCat();
});
