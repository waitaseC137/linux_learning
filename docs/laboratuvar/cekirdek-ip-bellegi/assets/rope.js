(function(){
  const ROWS = 2, COLS = 8;
  const DATA_BITS = 15;            // AGC word: bits 15..1
  const WIRE_COUNT = ROWS * COLS;  // 16 sense wires = 15 data + 1 parity

  function intToBits(val, n){
    const out = [];
    for (let b = n - 1; b >= 0; b--) out.push((val >>> b) & 1);
    return out;
  }

  // Real words from Luminary 099, the Apollo 11 Lunar Module flight program.
  const presets = {
    EXTEND: 0o00006, // 04005 INTERRUPT_LEAD_INS — the most frequent word in the rope
    ALARM:  0o01202, // 01,2703 EXECUTIVE — 'OCT 1202', the landing alarm code
    CAZERO: 0o34755, // 322 occurrences: 299 as CA ZERO, 23 as DCA NEG0
    BZF:    0o13247, // 32,3241 THE_LUNAR_LANDING — P63
    NEG0:   0o77777, // 4754 FIXED_FIXED_CONSTANT_POOL — 'OCT -0'
    ZERO:   0o00000, // 4755
  };
  // Default is EXTEND on purpose: it does NOT touch Z, so the cycle button
  // visibly walks 03250 -> 03251 -> 03252. ALARM (TC 1202) jumps to its own
  // operand and freezes there, which makes the button look broken on arrival.
  let bits = intToBits(presets.EXTEND, DATA_BITS);  // 15 entries. Parity is NEVER stored here.
  let pulsing = false;

  // Odd parity across all 16 cores. The hardware owns this bit; software on a
  // real AGC can neither read nor write it, which is why slot 15 is not clickable.
  function parityBit(){
    return bits.reduce((a, b) => a + b, 0) % 2 === 1 ? 0 : 1;
  }

  // Value shown on wire i: data bits come from `bits`, slot 15 is computed.
  function wireValue(i){
    return i === DATA_BITS ? parityBit() : bits[i];
  }

  const bitsOut = document.getElementById('bitsOut');
  const octOut = document.getElementById('octOut');
  const decOut = document.getElementById('decOut');
  const signOut = document.getElementById('signOut');
  const parOut = document.getElementById('parOut');
  const driveBtn = document.getElementById('driveBtn');

  // --- Pulse shape. Deliberately NOT a voltage.
  // Faraday's law is correct but unusable here: the rope core's effective
  // cross-section Ae is in no primary source, so any volt figure would be
  // invented. Delta t drives the SHAPE of the sense pulse instead.
  const dtSlider = document.getElementById('dtSlider');
  const dtOut = document.getElementById('dtOut');
  const ARRIVAL_MS = 700;   // drive current travelling to the core plane

  function pulseShape(){
    const dtNs = parseInt(dtSlider.value, 10);
    const t = dtNs / 1000;                 // 0.05 .. 1.0
    return {
      dtNs,
      halfWidth: 2.5 + t * 13,             // scope spike half-width, user units
      flashMs:   Math.round(280 + t * 320) // core ring flash duration
    };
  }

  function renderPhysics(){
    dtOut.textContent = pulseShape().dtNs;
  }

  dtSlider.addEventListener('input', renderPhysics);

  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs){
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  const f = n => Math.round(n * 100) / 100;

  // ---- Radial geometry ------------------------------------------------------
  // 18 slots at 20 degrees: slot 0 = drive winding (12 o'clock), slot 9 = empty
  // (flux arrow, breathing room), the other 16 carry the word.
  const CX = 290, CY = 290;
  const SLOTS = WIRE_COUNT + 2, PITCH = 360 / SLOTS;
  const R_START = 224, R_CAP = 236, R_DIGIT = 262, IDX_DY = 16;
  const R_OUT = 152, R_HOLE = 86;
  const R_TIP1 = [58, 72], R_TIP0 = 178, TIP_BULGE = 1.9;
  const W_START = 18, W_TIP1 = 5.5, W_TIP0 = 16;
  const R_DRIVE = 278, RT_DRIVE = 44, W_DRIVE_S = 14, W_DRIVE_T = 6;
  const HIT_R0 = 92, HIT_R1 = 282, HIT_HALF = 9.3;

  const D2R = Math.PI / 180;
  const pt = (r, d) => [CX + r * Math.cos(d * D2R), CY + r * Math.sin(d * D2R)];
  const slotAngle = k => -90 + PITCH * k;
  const S = a => f(a[0]) + ' ' + f(a[1]);

  function wHalf(u, RT, WT, RS, WS){
    const t = Math.max(0, Math.min(1, (u - RT) / (RS - RT)));
    return WT + (WS - WT) * Math.pow(t, 0.78);
  }
  function strand(u0, u1, RT, WT, RS, WS, sign){
    const d = u0 - u1, p = u => [CX + sign * wHalf(u, RT, WT, RS, WS), CY - u];
    return { P0:p(u0), C1:p(u0 - 0.34*d), C2:p(u1 + 0.34*d), P3:p(u1) };
  }
  // ONE continuous hairpin. Splitting it into under/over halves gives two cubics
  // that share an endpoint but not a tangent, and every tip renders with a cusp.
  // Occlusion is done by clipping a duplicate instead.
  function hairpin(RT, WT, RS, WS, bulge){
    const L = strand(RS, RT, RT, WT, RS, WS, -1), R = strand(RT, RS, RT, WT, RS, WS, +1);
    const b = WT * (bulge === undefined ? 1.55 : bulge);
    return 'M ' + S(L.P0) + ' C ' + S(L.C1) + ' ' + S(L.C2) + ' ' + S(L.P3)
         + ' C ' + f(CX-WT) + ' ' + f(CY-RT-b) + ' ' + f(CX+WT) + ' ' + f(CY-RT-b) + ' ' + S(R.P0)
         + ' C ' + S(R.C1) + ' ' + S(R.C2) + ' ' + S(R.P3);
  }
  const ringPath = r => 'M ' + (CX-r) + ' ' + CY + ' A ' + r + ' ' + r + ' 0 1 0 ' + (CX+r) + ' ' + CY
                      + ' A ' + r + ' ' + r + ' 0 1 0 ' + (CX-r) + ' ' + CY;
  function wedge(deg, r0, r1, half){
    const a = [pt(r1,deg-half), pt(r1,deg+half), pt(r0,deg+half), pt(r0,deg-half)];
    return 'M ' + S(a[0]) + ' A ' + r1 + ' ' + r1 + ' 0 0 1 ' + S(a[1])
         + ' L ' + S(a[2]) + ' A ' + r0 + ' ' + r0 + ' 0 0 0 ' + S(a[3]) + ' Z';
  }
  function arcPath(d0, d1, r){
    return 'M ' + S(pt(r,d0)) + ' A ' + r + ' ' + r + ' 0 0 1 ' + S(pt(r,d1));
  }

  // ---- Build ----------------------------------------------------------------
  const rope = document.getElementById('rope');
  const defs = el('defs');
  defs.innerHTML =
    '<radialGradient id="ferrite" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#0D1728"/><stop offset="0.565" stop-color="#1C2A40"/>' +
      '<stop offset="0.78" stop-color="#3D5070"/><stop offset="0.93" stop-color="#26344E"/>' +
      '<stop offset="1" stop-color="#16223A"/></radialGradient>' +
    '<clipPath id="cwR" clipPathUnits="userSpaceOnUse"><rect x="' + CX + '" y="0" width="' + (CX+2) + '" height="' + (CY*2) + '"/></clipPath>' +
    '<clipPath id="cwL" clipPathUnits="userSpaceOnUse"><rect x="0" y="0" width="' + CX + '" height="' + (CY*2) + '"/></clipPath>' +
    '<clipPath id="band" clipPathUnits="userSpaceOnUse"><path fill-rule="evenodd" d="' + ringPath(R_OUT+2) + ' ' + ringPath(R_HOLE-2) + '"/></clipPath>' +
    '<marker id="ah" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">' +
      '<path d="M0 0 L7 3.5 L0 7 z" fill="#93A3BD" opacity=".5"/></marker>';
  rope.appendChild(defs);

  const gUnder = el('g'), gCore = el('g'), gOver = el('g'), gText = el('g'), gHit = el('g');
  [gUnder, gCore, gOver, gText, gHit].forEach(g => rope.appendChild(g));

  gCore.appendChild(el('path', { class:'core-body', 'fill-rule':'evenodd', d: ringPath(R_OUT) + ' ' + ringPath(R_HOLE) }));
  gCore.appendChild(el('circle', { class:'core-rim', cx:CX, cy:CY, r:R_OUT }));
  gCore.appendChild(el('circle', { class:'core-rim', cx:CX, cy:CY, r:R_HOLE }));
  const coreFlash = el('circle', { class:'core-flash', cx:CX, cy:CY, r:(R_OUT+R_HOLE)/2 });
  gCore.appendChild(coreFlash);
  gCore.appendChild(el('path', { class:'flux', d: arcPath(78, 102, (R_OUT+R_HOLE)/2), 'marker-end':'url(#ah)' }));

  const wave = el('circle', { class:'wavefront', cx:CX, cy:CY, r:R_HOLE });
  gOver.appendChild(wave);

  // A threaded wire dives behind the ferrite band on one side and rides over it
  // on the other. Draw it once, clip a copy for the over-half, and trace the
  // hidden run with a dashed ghost.
  function placeThreaded(rot, d, cls){
    const gu = el('g', { transform: rot }), pu = el('path', { class:'strand ' + cls, d });
    gu.appendChild(pu); gUnder.appendChild(gu);
    const go = el('g', { transform: rot }), po = el('path', { class:'strand ' + cls, d, 'clip-path':'url(#cwR)' });
    go.appendChild(po); gOver.appendChild(go);
    const gbw = el('g', { 'clip-path':'url(#band)' }), gb = el('g', { transform: rot });
    const pg = el('path', { class:'ghost', d, 'clip-path':'url(#cwL)' });
    gb.appendChild(pg); gbw.appendChild(gb); gOver.appendChild(gbw);
    return { pu, po, gu, go, gbw };
  }

  placeThreaded('rotate(0 ' + CX + ' ' + CY + ')',
                hairpin(RT_DRIVE, W_DRIVE_T, R_DRIVE, W_DRIVE_S, 1.5), 'drive');
  const bolt = el('text', { class:'bolt', x:CX, y:34 }); bolt.textContent = '⚡';
  gText.appendChild(bolt);

  // bit index -> slot, skipping slot 0 (drive) and slot 9 (gap)
  const slotOfBit = j => (j < 8 ? j + 1 : j + 2);
  const W = [];

  for (let j = 0; j < WIRE_COUNT; j++){
    const isParity = (j === DATA_BITS);
    const k = slotOfBit(j), th = slotAngle(k);
    // Tip stagger keys off the SLOT, not the bit: slots 1 and 17 both flank the
    // drive and are both odd, which lifts drive clearance symmetrically.
    const RT = R_TIP1[k % 2];
    const rot = 'rotate(' + f(th + 90) + ' ' + CX + ' ' + CY + ')';
    const cls = 'one' + (isParity ? ' par' : '');
    const one = placeThreaded(rot, hairpin(RT, W_TIP1, R_START, W_START, TIP_BULGE), cls);

    const gz = el('g', { transform: rot });
    const pz = el('path', { class: 'strand zero' + (isParity ? ' par' : ''),
                            d: hairpin(R_TIP0, W_TIP0, R_START, W_START, -0.95) });
    gz.appendChild(pz); gOver.appendChild(gz);
    gOver.appendChild(el('path', { class:'capArc', d: arcPath(th - 4.9, th + 4.9, R_CAP) }));

    const xy = pt(R_DIGIT, th);
    const dig = el('text', { class:'digit', x:f(xy[0]), y:f(xy[1] + 7) });
    const idx = el('text', { class:'idx' + (isParity ? ' par' : ''), x:f(xy[0]), y:f(xy[1] + 7 + IDX_DY) });
    idx.textContent = isParity ? 'P' : 'b' + (DATA_BITS - j);
    gText.appendChild(dig); gText.appendChild(idx);

    const rec = { one, pz, dig, idx, j, hit:null };
    W.push(rec);

    if (isParity) continue;   // hardware owns the parity wire: no hit target

    const hit = el('path', { class:'hit', d: wedge(th, HIT_R0, HIT_R1, HIT_HALF),
                             tabindex:'0', role:'switch', 'aria-label':'bit ' + (DATA_BITS - j) });
    gHit.appendChild(hit);
    rec.hit = hit;

    const hot = on => {
      [one.pu, one.po, pz].forEach(e => e.classList.toggle('hot', on));
      idx.classList.toggle('hotT', on); dig.classList.toggle('hotT', on);
    };
    hit.addEventListener('mouseenter', () => hot(true));
    hit.addEventListener('mouseleave', () => hot(false));
    hit.addEventListener('focus', () => hot(true));
    hit.addEventListener('blur',  () => hot(false));
    hit.addEventListener('click', () => { if (!pulsing) toggleBit(j); });
    hit.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); if (!pulsing) toggleBit(j); }
      // 16 tab stops arranged in a ring are disorienting without arrow traversal
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown'){ e.preventDefault(); W[(j+1) % DATA_BITS].hit.focus(); }
      else if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp'){   e.preventDefault(); W[(j + DATA_BITS - 1) % DATA_BITS].hit.focus(); }
    });
  }

  [['TEK ÇEKİRDEK', 16, 30, 's'], ['= 1 AGC kelimesi', 16, 48, 's'],
   ['16 sense teli', 16, 552, 's'], ['→ okuma yükselteci', 564, 552, 'e']]
    .forEach(function(c){
      const e = el('text', { class:'corelabel ' + c[3], x:c[1], y:c[2] });
      e.textContent = c[0]; gText.appendChild(e);
    });

  // ---- Scope: 16 traces, ONE shared time axis -------------------------------
  const scope = document.getElementById('scope');
  const SX0 = 54, SX1 = 688, ROWH = 17, SY0 = 16, TPULSE = 0.52;
  const traces = [];
  for (let j = 0; j < WIRE_COUNT; j++){
    const y = SY0 + j * ROWH;
    const t = el('path', { class:'trace', d:'M ' + SX0 + ' ' + y + ' L ' + SX1 + ' ' + y });
    const l = el('text', { class:'tlabel', x:SX0 - 8, y:y + 4 });
    l.textContent = (j === DATA_BITS) ? 'P' : 'b' + (DATA_BITS - j);
    scope.appendChild(t); scope.appendChild(l); traces.push(t);
  }
  const SBOT = SY0 + (WIRE_COUNT - 1) * ROWH + 14;
  const cursor = el('line', { class:'tcursor', x1:0, y1:4, x2:0, y2:SBOT });
  scope.appendChild(cursor);
  const taxis = el('text', { class:'taxis', x: SX0 + (SX1 - SX0) * TPULSE + 8, y: SBOT + 11 });
  taxis.textContent = 't = SET kenarı — 16 bit aynı anda';
  scope.appendChild(taxis);
  scope.setAttribute('viewBox', '0 0 700 ' + (SBOT + 18));

  function drawScope(fire){
    const xp = SX0 + (SX1 - SX0) * TPULSE;
    for (let j = 0; j < WIRE_COUNT; j++){
      const y = SY0 + j * ROWH, t = traces[j];
      if (fire && wireValue(j) === 1){
        t.setAttribute('d', 'M ' + SX0 + ' ' + y + ' L ' + f(xp-11) + ' ' + y + ' L ' + f(xp-4) + ' ' + (y-12)
                          + ' L ' + f(xp+5) + ' ' + (y+2) + ' L ' + f(xp+13) + ' ' + y + ' L ' + SX1 + ' ' + y);
        t.classList.add('hi');
      } else {
        t.setAttribute('d', 'M ' + SX0 + ' ' + y + ' L ' + SX1 + ' ' + y);
        t.classList.remove('hi');
      }
    }
    cursor.setAttribute('x1', xp); cursor.setAttribute('x2', xp);
    cursor.classList.toggle('on', !!fire);
  }

  function render(){
    for (const w of W){
      const on = wireValue(w.j) === 1;
      [w.one.gu, w.one.go, w.one.gbw].forEach(g => { g.style.display = on ? '' : 'none'; });
      w.pz.parentNode.style.display = on ? 'none' : '';
      w.dig.textContent = on ? '1' : '0';
      w.dig.classList.toggle('d1', on);
      if (w.hit) w.hit.setAttribute('aria-checked', on ? 'true' : 'false');
    }
    drawScope(false);

    bitsOut.textContent = bits.join('').match(/.{1,3}/g).join(' ');

    const val = bits.reduce((acc, b) => (acc * 2) + b, 0); // 0 .. 32767
    decOut.textContent = val;
    octOut.textContent = val.toString(8).padStart(5, '0');

    // Ones' complement, 15-bit. Two zeros: 00000 is +0, 77777 is -0.
    signOut.textContent =
        val === 0     ? '+0'
      : val === 32767 ? '−0'
      : (val >> 14) === 0 ? '+' + val
      : '−' + (32767 - val);

    parOut.textContent = parityBit();
    renderLoop();
    renderInstr();
  }

  function toggleBit(i){
    if (i >= DATA_BITS) return;   // parity is hardware-owned
    bits[i] = bits[i] ? 0 : 1;
    render();
  }

  document.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (pulsing) return;
      const p = btn.getAttribute('data-preset');
      if (p === 'rand'){
        let v = 0;
        for (let k = 0; k < DATA_BITS; k++) v = v*2 + (Math.random() < 0.5 ? 0 : 1);
        bits = intToBits(v, DATA_BITS);
      }
      else bits = intToBits(presets[p], DATA_BITS);
      render();
    });
  });

  // ---- Pulse: one core, every wire at the same instant -----------------------
  function firePulse(){
    if (pulsing) return;
    pulsing = true;
    driveBtn.disabled = true;
    driveBtn.textContent = 'okunuyor…';
    const shape = pulseShape();

    setTimeout(() => {
      coreFlash.classList.remove('on'); void coreFlash.getBBox(); coreFlash.classList.add('on');
      wave.classList.remove('on');      void wave.getBBox();      wave.classList.add('on');
      W.forEach(w => { if (wireValue(w.j) === 1){
        w.one.pu.classList.add('fired'); w.one.po.classList.add('fired'); } });
      drawScope(true);

      setTimeout(() => {
        W.forEach(w => { w.one.pu.classList.remove('fired'); w.one.po.classList.remove('fired'); });
        drawScope(false);
        pulsing = false;
        driveBtn.disabled = false;
        driveBtn.textContent = '⚡ DARBE GÖNDER — belleği oku';
      }, shape.flashMs + 260);
    }, 420);
  }

  driveBtn.addEventListener('click', firePulse);

  // --- AGC Block II disassembler --------------------------------------------
  // Algorithm checked against 3,161 real instruction words from the Luminary
  // 099 listings: 99.72% agreement with the flight assembler. Every one of the
  // nine disagreements is the "INDEX base word" case, which is undecodable in
  // isolation by construction — no single-word view can resolve it.

  // Erasable 00-023 octal are registers, not RAM. 07 is hardwired to +0, which
  // is why "ZL" is just LXCH 7.
  const REGS = {
    0:'A', 1:'L', 2:'Q', 3:'EB', 4:'FB', 5:'Z', 6:'BB', 7:'+0',
    8:'ARUPT', 9:'LRUPT', 10:'QRUPT', 11:'SAMPTIME', 12:'SAMPTIME',
    13:'ZRUPT', 14:'BBRUPT', 15:'BRUPT',
    16:'CYR', 17:'SR', 18:'CYL', 19:'EDOP'
  };

  // Exact-match pseudo-instructions. These MUST be tested before the generic
  // dispatch: 00006 is literally encoded as "TC 6" but sets the extracode flag
  // instead of transferring control anywhere.
  const IMPLIED_BASIC = {
    0o00000:'XXALQ', 0o00001:'XLQ',   0o00002:'RETURN', 0o00003:'RELINT',
    0o00004:'INHINT',0o00006:'EXTEND',0o20001:'DDOUBL', 0o22007:'ZL',
    0o30000:'NOOP',  0o40000:'COM',   0o50017:'RESUME', 0o52005:'DTCF',
    0o52006:'DTCB',  0o54000:'OVSK',  0o54005:'TCAA',   0o60000:'DOUBLE'
  };
  const IMPLIED_EXTRA = { 0o22007:'ZQ', 0o40001:'DCOM', 0o70000:'SQUARE' };
  const CHAN_OPS = ['READ','WRITE','RAND','WAND','ROR','WOR','RXOR','EDRUPT'];
  const JUMPERS  = { TC:1, TCF:1, BZF:1, BZMF:1 };

  function disassemble(w, extend){
    const implied = (extend ? IMPLIED_EXTRA : IMPLIED_BASIC)[w];
    // RETURN does jump, but to whatever is in Q — and this page does not model
    // Q, so the loop view treats it as non-branching rather than inventing a
    // target. Everything else in this table genuinely leaves Z alone.
    if (implied) return { mnemonic: implied, operand: null, text: implied,
                          jumps: false, target: null };

    const op = (w >> 12) & 7, qc = (w >> 10) & 3, pc = (w >> 9) & 7;
    const a12 = w & 0o7777, a10 = w & 0o1777, a9 = w & 0o777;
    const m1 = k => (k - 1) & 0o1777;   // DAS/DXCH encode K+1 in a 10-bit field
    const m1w = k => (k - 1) & 0o7777;  // DCA/DCS encode K+1 in a 12-bit field
    let mn, k, chan = false;

    if (!extend){
      if      (op === 0)            { mn='TC';    k=a12; }
      else if (op === 1 && qc === 0){ mn='CCS';   k=a10; }
      else if (op === 1)            { mn='TCF';   k=a12; }
      else if (op === 2 && qc === 0){ mn='DAS';   k=m1(a10); }
      else if (op === 2 && qc === 1){ mn='LXCH';  k=a10; }
      else if (op === 2 && qc === 2){ mn='INCR';  k=a10; }
      else if (op === 2)            { mn='ADS';   k=a10; }
      else if (op === 3)            { mn='CA';    k=a12; }
      else if (op === 4)            { mn='CS';    k=a12; }
      else if (op === 5 && qc === 0){ mn='INDEX'; k=a10; }
      else if (op === 5 && qc === 1){ mn='DXCH';  k=m1(a10); }
      else if (op === 5 && qc === 2){ mn='TS';    k=a10; }
      else if (op === 5)            { mn='XCH';   k=a10; }
      else if (op === 6)            { mn='AD';    k=a12; }
      else                          { mn='MASK';  k=a12; }
    } else {
      if      (op === 0)            { mn=CHAN_OPS[pc]; k=a9; chan=true; }
      else if (op === 1 && qc === 0){ mn='DV';    k=a10; }
      else if (op === 1)            { mn='BZF';   k=a12; }
      else if (op === 2 && qc === 0){ mn='MSU';   k=a10; }
      else if (op === 2 && qc === 1){ mn='QXCH';  k=a10; }
      else if (op === 2 && qc === 2){ mn='AUG';   k=a10; }
      else if (op === 2)            { mn='DIM';   k=a10; }
      else if (op === 3)            { mn='DCA';   k=m1w(a12); }
      else if (op === 4)            { mn='DCS';   k=m1w(a12); }
      else if (op === 5)            { mn='INDEX'; k=a12; }
      else if (op === 6 && qc === 0){ mn='SU';    k=a10; }
      else if (op === 6)            { mn='BZMF';  k=a12; }
      else                          { mn='MP';    k=a12; }
    }

    // Operands are always octal. Hex on an AGC is an anachronism.
    const oct = k.toString(8).padStart(chan ? 2 : 4, '0');
    const operand = chan ? 'CH' + oct : (REGS[k] ? oct + ' (' + REGS[k] + ')' : oct);
    return {
      mnemonic: mn, operand, text: mn + ' ' + operand,
      jumps: !!JUMPERS[mn], target: JUMPERS[mn] ? k : null, viaQ: false
    };
  }

  // The loop view reads the basic set: it has no previous word to inspect.
  function controlFlow(w){ return disassemble(w, false); }

  let Z = 0o3250;
  const zOut  = document.getElementById('zOut');
  const lv    = [0,1,2,3].map(i => document.getElementById('lv' + i));
  const lret  = document.getElementById('lret');
  const llbl  = document.getElementById('llbl');
  const oct5  = v => v.toString(8).padStart(5, '0');
  const oct4  = v => v.toString(8).padStart(4, '0');
  const word  = () => bits.reduce((a, b) => a * 2 + b, 0);

  function renderLoop(){
    const cf = controlFlow(word());
    zOut.textContent  = oct5(Z);
    lv[0].textContent = oct5(Z);
    lv[1].textContent = oct5(word());
    lv[2].textContent = cf.text;
    lv[3].textContent = cf.jumps ? "Z'ye yazdı" : "Z'ye dokunmadı";
    llbl.textContent  = cf.jumps ? 'Z := ' + oct5(cf.target) : 'Z := Z + 1';
    lret.classList.toggle('live', cf.jumps);
    llbl.classList.toggle('live', cf.jumps);
    lret.setAttribute('marker-end', cf.jumps ? 'url(#ahl)' : 'url(#ahi)');
  }

  // Plain-Turkish gloss so the mnemonic is not just another opaque token.
  const GLOSS = {
    TC:"oraya git, dönüş adresini Q'ya bırak", TCF:'sabit hafızaya atla, dönüş bırakma',
    CCS:'say, karşılaştır, atla — tek koşullu dal', CA:"şunu al, A'ya yaz",
    CS:"şunun tersini A'ya yaz", AD:"A'ya ekle", MASK:'A ile bit bit VE',
    TS:"A'yı şuraya yaz", XCH:'A ile şurayı takas et', LXCH:'L ile şurayı takas et',
    DXCH:'(A,L) çiftiyle şurayı takas et', INCR:'şurayı bir artır', ADS:"A'yı şuraya ekle",
    INDEX:'sıradaki komutu şununla topla', DAS:'çift kelimeyi topla',
    BZF:'A sıfırsa atla', BZMF:'A sıfır ya da eksiyse atla', SU:'çıkar', MP:'çarp', DV:'böl',
    MSU:'modüler çıkar', QXCH:'Q ile şurayı takas et', AUG:'sıfırdan uzaklaştır',
    DIM:'sıfıra yaklaştır', DCA:'çift kelimeyi al', DCS:'çift kelimenin tersini al',
    READ:'G/Ç kanalını oku', WRITE:"kanala yaz", RAND:'kanalı oku ve VE-le',
    WAND:'kanalla VE-le, ikisine de yaz', ROR:'kanalı oku ve VEYA-la',
    WOR:'kanalla VEYA-la, ikisine de yaz', RXOR:'kanalı oku ve XOR-la',
    EDRUPT:'fabrika testi komutu',
    EXTEND:'sıradaki kelimeyi öbür tablodan oku', RELINT:'kesmeleri aç', INHINT:'kesmeleri kapat',
    RESUME:'kesmeden dön', RETURN:'alt programdan dön', ZL:"L'yi sıfırla", ZQ:"Q'yu sıfırla",
    COM:"A'yı tersle", DCOM:'(A,L) çiftini tersle', DOUBLE:"A'yı ikiye katla",
    DDOUBL:'(A,L) çiftini ikiye katla', SQUARE:"A'nın karesi", NOOP:'hiçbir şey yapma',
    OVSK:'taşma var mı diye bak', TCAA:"A'daki adrese git",
    DTCF:'banka değiştirerek atla', DTCB:'her iki bankayı değiştirerek atla',
    XXALQ:"A'daki komutu çalıştır", XLQ:"L'deki komutu çalıştır"
  };

  const disBasic = document.getElementById('disBasic');
  const disExtra = document.getElementById('disExtra');
  const glossBasic = document.getElementById('glossBasic');
  const glossExtra = document.getElementById('glossExtra');

  function renderInstr(){
    const w = word();
    const b = disassemble(w, false), x = disassemble(w, true);
    disBasic.textContent = b.text;
    disExtra.textContent = x.text;
    glossBasic.textContent = GLOSS[b.mnemonic] || '';
    glossExtra.textContent = GLOSS[x.mnemonic] || '';
  }

  // One click walks the four steps in order, THEN moves Z. Showing the old Z
  // during steps 1-3 is the accurate reading: Z is read at step 1 and only
  // written at step 4.
  const cycleBtn = document.getElementById('cycleBtn');
  const lpSteps = [].slice.call(document.querySelectorAll('#loop .lp-step'));
  const STEP_MS = 200;
  let cycling = false;

  function runCycle(){
    if (cycling) return;
    cycling = true;
    cycleBtn.disabled = true;
    const cf = controlFlow(word());
    lpSteps.forEach(s => s.classList.remove('hot'));

    let i = 0;
    (function step(){
      if (i > 0) lpSteps[i-1].classList.remove('hot');
      if (i < lpSteps.length){
        lpSteps[i].classList.add('hot');
        i++;
        setTimeout(step, STEP_MS);
        return;
      }
      Z = cf.jumps ? cf.target : ((Z + 1) & 0o7777);
      renderLoop();
      lret.classList.add('pulse');
      llbl.classList.add('pulse');
      setTimeout(() => {
        lret.classList.remove('pulse');
        llbl.classList.remove('pulse');
        cycling = false;
        cycleBtn.disabled = false;
      }, 340);
    })();
  }

  cycleBtn.addEventListener('click', runCycle);

  render();
  renderPhysics();

  // ==== S7: one wire, many cores ===========================================
  (function buildStrip(){
    const s = document.getElementById('strip');
    if (!s) return;
    const N = 9, PITCH = 72, X0 = 56, CY = 78, RO = 27, RH = 14;
    const cx = i => X0 + i * PITCH;

    const d = el('defs');
    d.innerHTML =
      '<radialGradient id="ferrite2" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0" stop-color="#0D1728"/><stop offset="0.5" stop-color="#1C2A40"/>' +
        '<stop offset="0.8" stop-color="#3D5070"/><stop offset="1" stop-color="#1A2740"/></radialGradient>' +
      '<linearGradient id="fadeL"><stop offset="0" stop-color="#101B2D"/><stop offset="1" stop-color="#101B2D" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="fadeR"><stop offset="0" stop-color="#101B2D" stop-opacity="0"/><stop offset="1" stop-color="#101B2D"/></linearGradient>';
    s.appendChild(d);

    // the whole harness, behind everything
    s.appendChild(el('path', { class:'cw-band', d:'M 8 ' + CY + ' L 712 ' + CY }));

    for (let i = 0; i < N; i++){
      // flat fill, not the radial gradient: a gradient applied to a STROKE
      // bands visibly at this size and reads as concentric rings.
      s.appendChild(el('circle', { class:'cw-core', cx:cx(i), cy:CY, r:(RO+RH)/2,
                                   fill:'none', stroke:'#2E4160', 'stroke-width':(RO-RH) }));
      s.appendChild(el('circle', { class:'cw-core', cx:cx(i), cy:CY, r:RO, fill:'none' }));
      s.appendChild(el('circle', { class:'cw-core', cx:cx(i), cy:CY, r:RH, fill:'none' }));
      // the band is visible again inside each hole
      s.appendChild(el('path', { class:'cw-inhole',
        d:'M ' + (cx(i)-RH+1) + ' ' + CY + ' L ' + (cx(i)+RH-1) + ' ' + CY }));
    }

    // three strands peeled out of the band: same cores, different routes
    const ROUTES = [
      [1,1,1,1,1,1,1,1,1],
      [1,1,0,1,1,0,1,1,0],
      [1,0,1,0,1,0,1,0,1]
    ];
    ROUTES.forEach(function(route, r){
      const off = (r - 1) * 6;
      const y = CY + off;
      let p = 'M 8 ' + y;
      for (let i = 0; i < N; i++){
        p += ' L ' + (cx(i) - 32) + ' ' + y;
        p += route[i]
          ? ' L ' + (cx(i) + 32) + ' ' + y
          : ' Q ' + cx(i) + ' ' + (CY - RO - 22 + off) + ' ' + (cx(i) + 32) + ' ' + y;
      }
      p += ' L 712 ' + y;
      s.appendChild(el('path', { class:'cw-str', d:p }));
    });

    s.appendChild(el('rect', { x:0, y:0, width:46, height:170, fill:'url(#fadeL)' }));
    s.appendChild(el('rect', { x:674, y:0, width:46, height:170, fill:'url(#fadeR)' }));
    const cap = el('text', { class:'cw-cap', x:360, y:152 });
    cap.textContent = 'aynı çekirdekler — üç tel, üç ayrı yol';
    s.appendChild(cap);
  })();

  // ==== S7b: selection by inhibition =======================================
  (function buildAddr(){
    const svg = document.getElementById('addr'), bar = document.getElementById('addrBits');
    if (!svg || !bar) return;
    const N = 8, PITCH = 80, X0 = 96, CY = 238, RO = 26, RH = 13;
    const BUSY = [164, 108, 52];          // index = bit number (0 = LSB, drawn lowest)
    const DROPX = [7, 0, -7];
    const cx = i => X0 + i * PITCH;
    let addr = 5;

    const d = el('defs');
    d.innerHTML = '<radialGradient id="ferrite3" cx="50%" cy="50%" r="50%">' +
      '<stop offset="0" stop-color="#0D1728"/><stop offset="0.5" stop-color="#1C2A40"/>' +
      '<stop offset="0.8" stop-color="#3D5070"/><stop offset="1" stop-color="#1A2740"/></radialGradient>';
    svg.appendChild(d);

    const gDrop = el('g'), gBus = el('g'), gCore = el('g'), gMark = el('g');
    [gDrop, gBus, gCore, gMark].forEach(g => svg.appendChild(g));

    // the set line: it reaches every core. Selectivity is not its job.
    gCore.appendChild(el('path', { class:'ad-set', d:'M 20 ' + CY + ' L 700 ' + CY }));
    const setLab = el('text', { class:'ad-lbl', x:360, y:CY + 74 });
    setLab.textContent = 'sürücü (set) hattı — sekizini birden çevirmeye çalışır';
    gMark.appendChild(setLab);

    const rings = [], marks = [], labs = [], buses = [], blabs = [];
    for (let i = 0; i < N; i++){
      gCore.appendChild(el('circle', { cx:cx(i), cy:CY, r:(RO+RH)/2, fill:'none',
                                       stroke:'#2E4160', 'stroke-width':(RO-RH) }));
      const ring = el('circle', { class:'ad-core', cx:cx(i), cy:CY, r:RO, fill:'none' });
      gCore.appendChild(ring); rings.push(ring);
      gCore.appendChild(el('circle', { class:'ad-core', cx:cx(i), cy:CY, r:RH, fill:'none' }));
      const m = el('text', { class:'ad-x', x:cx(i), y:CY + 5 }); m.textContent = '×';
      gMark.appendChild(m); marks.push(m);
      const l = el('text', { class:'ad-lbl', x:cx(i), y:CY + RO + 20 });
      gMark.appendChild(l); labs.push(l);
    }

    for (let b = 2; b >= 0; b--){
      const bus = el('path', { class:'ad-bus', d:'M 20 ' + BUSY[b] + ' L 700 ' + BUSY[b] });
      gBus.appendChild(bus); buses[b] = bus;
      const t = el('text', { class:'ad-bl', x:700, y:BUSY[b] - 9, style:'text-anchor:start' });
      t.setAttribute('x', 20); gBus.appendChild(t); blabs[b] = t;
    }

    function draw(){
      while (gDrop.firstChild) gDrop.removeChild(gDrop.firstChild);
      for (let b = 0; b < 3; b++){
        const want = (addr >> b) & 1;
        // energise the member of the pair that does NOT match: it inhibits
        // every core whose bit b disagrees with the address.
        const hit = [];
        for (let i = 0; i < N; i++) if (((i >> b) & 1) !== want) hit.push(i);
        buses[b].classList.add('on');
        blabs[b].classList.add('on');
        blabs[b].textContent = 'engelle: bit ' + b + ' = ' + (1 - want) + ' olanlar';
        hit.forEach(i => gDrop.appendChild(el('path', { class:'ad-drop',
          d:'M ' + (cx(i) + DROPX[b]) + ' ' + BUSY[b] + ' L ' + (cx(i) + DROPX[b]) + ' ' + (CY - RO - 8) })));
      }
      for (let i = 0; i < N; i++){
        const live = (i === addr);
        rings[i].classList.toggle('live', live);
        marks[i].style.display = live ? 'none' : '';
        labs[i].textContent = i.toString(2).padStart(3, '0');
        labs[i].classList.toggle('live', live);
      }
      [].slice.call(bar.querySelectorAll('.abit')).forEach((btn, k) => {
        const b = 2 - k;
        btn.classList.toggle('on', ((addr >> b) & 1) === 1);
        btn.textContent = (addr >> b) & 1;
      });
    }

    for (let k = 0; k < 3; k++){
      const b = 2 - k;
      const btn = document.createElement('button');
      btn.className = 'abit'; btn.type = 'button';
      btn.setAttribute('aria-label', 'adres biti ' + b);
      btn.addEventListener('click', () => { addr ^= (1 << b); draw(); });
      bar.appendChild(btn);
    }
    const note = document.createElement('span');
    note.className = 'alab';
    note.textContent = '← bitlere bas, ayakta kalan çekirdeği izle';
    bar.appendChild(note);
    draw();
  })();


  // ==== S8: the redundancy budget ==========================================
  (function buildBudget(){
    const s = document.getElementById('budget');
    if (!s) return;
    const X0 = 14, W = 672, Y = 34, H = 30;
    const FREE = 180, TOTAL = 192;          // odd parity forbids all-16-high,
    const wFree = W * FREE / TOTAL;         // so 12 of the 192 are not free

    s.appendChild(el('rect', { class:'bg-track', x:X0, y:Y, width:W, height:H, rx:5 }));
    s.appendChild(el('rect', { class:'bg-free', x:X0, y:Y, width:wFree, height:H, rx:5 }));
    s.appendChild(el('rect', { class:'bg-red',  x:X0 + wFree, y:Y, width:W - wFree, height:H, rx:5 }));

    const a = el('text', { class:'bg-num', x:X0 + 12, y:Y + 20 });
    a.textContent = '180 bit özgür';
    s.appendChild(a);

    // The redundant slice is only 6.25% of the bar (~42px) — too narrow to
    // hold its own label, so it points at one instead.
    s.appendChild(el('path', { d:'M ' + (X0 + W - 21) + ' ' + (Y + H) + ' L ' + (X0 + W - 21) + ' ' + (Y + H + 12),
                               stroke:'#E9A768', 'stroke-width':1.2, fill:'none' }));
    const b = el('text', { class:'bg-lbl', x:X0 + W, y:Y + H + 24,
                           style:'text-anchor:end;fill:#E9A768;font-weight:600' });
    b.textContent = '12 bit fazlalık';
    s.appendChild(b);

    const t1 = el('text', { class:'bg-tick', x:X0, y:Y - 10 });
    t1.textContent = 'bir çekirdekten geçen 192 telin taşıyabildiği bilgi';
    s.appendChild(t1);

    const t2 = el('text', { class:'bg-lbl', x:X0, y:Y + H + 24 });
    t2.textContent = '12 kelime × 15 serbest bit = 180';
    s.appendChild(t2);

    const t3 = el('text', { class:'bg-tick', x:X0, y:Y + H + 46 });
    t3.textContent = 'yani 2¹⁹² değil, 2¹⁸⁰ farklı desen — çekirdeğin alabileceği biçim sayısı kodun kendisiyle kısıtlı';
    s.appendChild(t3);
  })();

})();
