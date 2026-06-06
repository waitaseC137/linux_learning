/* ============================================================
   Konu Anlatımları — okuyucu
   ============================================================ */
(function () {
  const DATA = window.READER_DATA || window.KONULAR;
  const BASE = DATA.base;
  const ROOT_LABEL = DATA.rootLabel || 'konu_anlatimlari';
  const TITLE = DATA.title || 'Konu Anlatımları';
  const INTRO = DATA.intro || 'Komutların ve kavramların wargame-bağımsız referansı. Bir kategoriden başla — ya da soldaki ağaçtan / aramadan istediğin konuya git. Hepsi site içinde.';
  const UNIT = DATA.unit || 'dosya';
  const REPO_BLOB = 'https://github.com/waitasec137/linux_learning/blob/main/';

  // düz sıralı dosya listesi (prev/next için)
  const FLAT = [];
  DATA.categories.forEach(cat => cat.files.forEach(file => FLAT.push({ ...file, cat })));

  const elTree   = document.getElementById('tree');
  const elContent = document.getElementById('content');
  const elSearch = document.getElementById('search');
  const docsEl   = document.getElementById('docs');

  /* ---------- marked yapılandırma ---------- */
  function slug(s) {
    return s.toLowerCase().trim()
      .replace(/ç/g,'c').replace(/ğ/g,'g').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ş/g,'s').replace(/ü/g,'u')
      .replace(/[^\w\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  }
  if (window.marked) {
    marked.setOptions({ gfm: true, breaks: false });
  }

  /* ---------- SIDEBAR ---------- */
  function buildTree() {
    DATA.categories.forEach(cat => {
      const wrap = document.createElement('div');
      wrap.className = 'cat';
      wrap.dataset.cat = cat.id;
      wrap.style.setProperty('--cat-accent', cat.accent);

      const head = document.createElement('button');
      head.className = 'cat-head';
      head.innerHTML =
        '<span class="tw">▸</span><span class="dot"></span>' +
        '<span>' + cat.label + '</span>' +
        '<span class="ct">' + cat.files.length + '</span>';
      head.addEventListener('click', () => wrap.classList.toggle('open'));

      const list = document.createElement('div');
      list.className = 'cat-files';

      cat.files.forEach(file => {
        const rel = file.f;
        const a = document.createElement('a');
        a.className = 'file-link';
        a.href = '#' + rel;
        a.dataset.rel = rel;
        a.dataset.search = (file.t + ' ' + (file.h||'') + ' ' + file.f).toLowerCase();
        a.innerHTML =
          (file.n ? '<span class="fn">' + file.n + '</span>' : '<span class="fn">·</span>') +
          '<span class="fl">' + file.t + '</span>';
        list.appendChild(a);
      });

      wrap.appendChild(head);
      wrap.appendChild(list);
      elTree.appendChild(wrap);
    });
  }

  function setActive(rel) {
    document.querySelectorAll('.file-link').forEach(a => {
      const on = a.dataset.rel === rel;
      a.classList.toggle('active', on);
      if (on) { a.closest('.cat').classList.add('open'); }
    });
  }

  /* ---------- WELCOME ---------- */
  function renderWelcome() {
    let cards = '';
    DATA.categories.forEach(cat => {
      const first = cat.files[0].f;
      cards +=
        '<button class="wcard" data-go="' + first + '" style="--wc-accent:' + cat.accent + '">' +
          '<div class="wt">' + cat.label + '</div>' +
          '<div class="wb">' + cat.blurb + '</div>' +
          '<div class="wf"><span>' + cat.tag + '</span><span class="cnt">' + cat.files.length + ' ' + UNIT + ' →</span></div>' +
        '</button>';
    });
    elContent.innerHTML =
      '<div class="reader"><div class="welcome">' +
        '<div class="crumb"><a href="index.html">~/linux_learning</a><span class="sep">/</span><span class="cur">' + ROOT_LABEL + '</span></div>' +
        '<h1>' + TITLE + ' <span class="pp">/</span></h1>' +
        '<p class="lede">' + INTRO + '</p>' +
        '<div class="wcards">' + cards + '</div>' +
      '</div></div>';
    elContent.querySelectorAll('[data-go]').forEach(b =>
      b.addEventListener('click', () => { location.hash = '#' + b.dataset.go; }));
    document.querySelectorAll('.file-link').forEach(a => a.classList.remove('active'));
  }

  /* ---------- DOC RENDER ---------- */
  async function loadDoc(rel) {
    const meta = FLAT.find(x => x.f === rel);
    const cat = meta ? meta.cat : null;
    setActive(rel);

    elContent.innerHTML = '<div class="reader"><div class="state">yükleniyor<span class="blink">_</span></div></div>';
    window.scrollTo(0, 0);

    let md;
    try {
      const res = await fetch(encodeURI(BASE + rel));
      if (!res.ok) throw new Error(res.status);
      md = await res.text();
    } catch (e) {
      elContent.innerHTML =
        '<div class="reader"><div class="state">' +
        'Dosya yüklenemedi (' + e.message + ').<br><br>' +
        '<a class="gh-view" href="' + REPO_BLOB + encodeURI(BASE + rel) + '" target="_blank" rel="noopener">GitHub\'da aç ↗</a>' +
        '</div></div>';
      return;
    }

    const html = window.marked ? marked.parse(md) : ('<pre>' + md.replace(/</g,'&lt;') + '</pre>');

    // prev / next
    const idx = FLAT.findIndex(x => x.f === rel);
    const prev = FLAT[idx - 1], next = FLAT[idx + 1];
    const navHtml =
      '<div class="doc-nav">' +
        (prev ? '<a class="prev" href="#' + encodeURI(prev.f) + '"><div class="dir">← önceki</div><div class="dt">' + prev.t + '</div></a>' : '<a class="empty"></a>') +
        (next ? '<a class="next" href="#' + encodeURI(next.f) + '"><div class="dir">sonraki →</div><div class="dt">' + next.t + '</div></a>' : '<a class="empty"></a>') +
      '</div>';

    const crumb =
      '<div class="crumb">' +
        '<a href="index.html">~/linux_learning</a><span class="sep">/</span>' +
        '<a href="#">' + ROOT_LABEL + '</a><span class="sep">/</span>' +
        (cat ? '<span style="color:' + cat.accent + '">' + cat.id + '</span><span class="sep">/</span>' : '') +
        '<span class="cur">' + rel.split('/').pop() + '</span>' +
        '<a class="gh-view" href="' + REPO_BLOB + encodeURI(BASE + rel) + '" target="_blank" rel="noopener">GitHub ↗</a>' +
      '</div>';

    elContent.innerHTML =
      '<div class="reader">' + crumb + '<article class="md">' + html + '</article>' + navHtml + '</div>';

    enhance(elContent);
    if (window.__readUpd) window.__readUpd();
    if (window.SFX && window.SFX.open) window.SFX.open();
  }

  /* ---------- post-render geliştirmeler ---------- */
  function enhance(scope) {
    // başlık id'leri (iç bağlantılar için)
    scope.querySelectorAll('.md h1, .md h2, .md h3, .md h4').forEach(h => {
      if (!h.id) h.id = slug(h.textContent);
    });
    // kod blokları: highlight + kopyala butonu
    scope.querySelectorAll('.md pre').forEach(pre => {
      const code = pre.querySelector('code');
      if (code && window.hljs) {
        try { hljs.highlightElement(code); } catch (e) {}
      }
      const btn = document.createElement('button');
      btn.className = 'code-copy';
      btn.textContent = 'kopyala';
      btn.addEventListener('click', () => {
        const t = (code ? code.innerText : pre.innerText);
        navigator.clipboard && navigator.clipboard.writeText(t);
        btn.textContent = '✓'; btn.classList.add('ok');
        setTimeout(() => { btn.textContent = 'kopyala'; btn.classList.remove('ok'); }, 1400);
      });
      pre.appendChild(btn);
    });
    // .md içi link yönetimi: diğer .md -> dahili rota; #anchor -> yumuşak kaydır
    scope.querySelectorAll('.md a[href]').forEach(a => {
      const href = a.getAttribute('href');
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener'; return; }
      if (href.startsWith('#')) {
        a.addEventListener('click', (e) => {
          const id = href.slice(1);
          const t = scope.querySelector('#' + CSS.escape(id)) || document.getElementById(id);
          if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); }
        });
        return;
      }
      if (href.endsWith('.md')) {
        // mevcut dosyaya göre çöz
        const cur = decodeURIComponent((location.hash || '').replace(/^#/, ''));
        const curDir = cur.includes('/') ? cur.slice(0, cur.lastIndexOf('/') + 1) : '';
        let target = href.replace(/^\.\//, '');
        // ../ çöz
        let basePath = curDir;
        while (target.startsWith('../')) { target = target.slice(3); basePath = basePath.replace(/[^/]+\/$/, ''); }
        const rel = (basePath + target).replace(/^\//, '');
        a.setAttribute('href', '#' + rel);
        a.addEventListener('click', (e) => { e.preventDefault(); location.hash = '#' + rel; });
      }
    });
  }

  /* ---------- SEARCH ---------- */
  function wireSearch() {
    elSearch.addEventListener('input', () => {
      const q = elSearch.value.trim().toLowerCase();
      document.querySelectorAll('.cat').forEach(cat => {
        let any = false;
        cat.querySelectorAll('.file-link').forEach(a => {
          const hit = !q || a.dataset.search.includes(q);
          a.style.display = hit ? '' : 'none';
          if (hit) any = true;
        });
        cat.style.display = any ? '' : 'none';
        if (q && any) cat.classList.add('open');
      });
    });
  }

  /* ---------- ROUTER ---------- */
  function route() {
    let rel = (location.hash || '').replace(/^#/, '').trim();
    try { rel = decodeURIComponent(rel); } catch (e) {}
    if (rel && FLAT.find(x => x.f === rel)) {
      loadDoc(rel);
    } else {
      // kategori id ile gelindiyse o kategorinin ilk dosyasına yönlendir
      const cat = DATA.categories.find(c => c.id === rel);
      if (cat) { location.hash = '#' + cat.files[0].f; return; }
      renderWelcome();
    }
    // mobilde menüyü kapat
    docsEl.classList.remove('nav-open');
  }

  /* ---------- mobile ---------- */
  function wireMobile() {
    const t = document.getElementById('sideToggle');
    const s = document.getElementById('scrim');
    if (t) t.addEventListener('click', () => docsEl.classList.toggle('nav-open'));
    if (s) s.addEventListener('click', () => docsEl.classList.remove('nav-open'));
  }

  /* ---------- okuma ilerleme çubuğu ---------- */
  function wireReadProgress() {
    const bar = document.getElementById('readProgress');
    if (!bar) return;
    const upd = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (h.scrollTop || window.scrollY) / max * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    };
    window.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
    window.__readUpd = upd;
  }

  /* ---------- init ---------- */
  buildTree();
  wireSearch();
  wireMobile();
  wireReadProgress();
  window.addEventListener('hashchange', route);
  route();
})();
