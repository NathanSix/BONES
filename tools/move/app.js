/* ================= Core: helpers, chips, drawer, router (same pattern as Fuel) ================= */
const $ = (id) => document.getElementById(id);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const SVGNS = 'http://www.w3.org/2000/svg';
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function svgEl(tag, attrs, parent) {
  const e = document.createElementNS(SVGNS, tag);
  for (const k in attrs || {}) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------- Grade chips ---------- */
const CTYPE = { EFFECT: 'Cause and effect', ASSOC: 'A link, not proof of cause', MEASURE: 'A measurement', THEORY: 'An explanation still being tested', STATUS: 'A documented fact or rule' };
function tierText(rules, t) { return t === 'u' ? 'Untested' : `T${t} · ${TIERS[rules][t]}`; }
function fillChip(b) {
  if (b.dataset.done) return;
  const c = CLAIMS[b.dataset.claim];
  if (!c) { console.warn('Missing claim', b.dataset.claim); b.remove(); return; }
  b.dataset.t = c.t; b.type = 'button';
  b.textContent = tierText(c.rules, c.t);
  b.setAttribute('aria-label', `Evidence grade ${tierText(c.rules, c.t)}. Jump to the evidence for: ${c.text}`);
  b.dataset.done = 1;
}
function chips(root = document) { $$('button.tier', root).forEach(fillChip); }

/* ---------- Evidence drawer (fallback for chips with no card on the page) ---------- */
let drawerFrom = null;
function srcList(src) { return `<ol class="srcs">${src.map(([l, u]) => `<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(l)}</a></li>`).join('')}</ol>`; }
function openDrawer(id, from) {
  const c = CLAIMS[id]; if (!c) return;
  const d = $('drawer');
  $('dr-title').textContent = { history: 'Evidence · History claim', data: 'Evidence · Record', health: 'Evidence · Health claim' }[c.rules];
  $('dr-body').innerHTML = `<p class="q">${esc(c.text)}</p>
    <dl class="facts"><dt>Grade</dt><dd><span class="tier" data-t="${c.t}">${esc(tierText(c.rules, c.t))}</span></dd>
    <dt>Kind</dt><dd>${esc(CTYPE[c.ctype] || c.ctype)}</dd><dt>Design</dt><dd>${esc(c.design)}</dd><dt>Why</dt><dd>${esc(c.why)}</dd></dl>
    <div><p class="label">Sources</p>${srcList(c.src)}</div>
    <p class="rules">${esc(RULES[c.rules])}<br><br>${esc(REVIEWED)}</p>`;
  d.dataset.t = c.t;
  d.classList.add('open'); d.setAttribute('aria-hidden', 'false');
  $('scrim').classList.add('on');
  drawerFrom = from || document.activeElement;
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('dr-close').focus(), 30);
}
function closeDrawer() {
  const d = $('drawer');
  if (!d.classList.contains('open')) return;
  d.classList.remove('open'); d.setAttribute('aria-hidden', 'true');
  $('scrim').classList.remove('on');
  document.body.style.overflow = '';
  if (drawerFrom && drawerFrom.focus) drawerFrom.focus();
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('button.tier');
  if (b && !b.closest('.drawer') && !b.closest('.bones-ev')) { e.preventDefault(); openDrawer(b.dataset.claim, b); }
});
$('scrim').addEventListener('click', closeDrawer);
$('dr-close').addEventListener('click', closeDrawer);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

/* ---------- Evidence sections: each chapter ends with every graded claim it uses (assets/bones.js) ---------- */
const evBuilt = {};
function evItem(key) {
  const c = CLAIMS[key]; if (!c) return null;
  return { id: key, t: c.t, grade: tierText(c.rules, c.t), claim: c.text,
    rows: [['Kind', CTYPE[c.ctype] || c.ctype], ['Design', c.design], ['Why this grade', c.why]], sources: c.src };
}
function evBuild(v) {
  if (evBuilt[v] || !(window.BONES && window.BONES.evidence)) return;
  const sec = document.querySelector(`.view[data-view="${v}"]`); if (!sec) return;
  evBuilt[v] = true;
  const keys = [];
  $$('button.tier', sec).forEach((b) => { const k = b.dataset.claim; if (k && !keys.includes(k)) keys.push(k); });
  const items = keys.map(evItem).filter(Boolean);
  if (!items.length) return;
  const box = document.createElement('div');
  box.innerHTML = window.BONES.evidence.section({
    cls: 'sec', title: v === 'cover' ? 'Every graded claim on this page' : `Every graded claim in ${sec.dataset.title}`,
    intro: `Tap a grade anywhere ${v === 'cover' ? 'on this page' : 'in this chapter'} to jump to its claim here, with the reason for the grade and the sources behind it. ${REVIEWED}.`,
    items
  });
  const wrap = sec.querySelector(':scope > .wrap') || sec;
  const pager = wrap.querySelector(':scope > nav.pager');
  wrap.insertBefore(box.firstChild, pager || null);
}
if (window.BONES && window.BONES.evidence) {
  window.BONES.evidence.bind({ selector: 'button.tier[data-claim]', id: (b) => b.dataset.claim, scope: (b) => b.closest('.view') });
}

/* ---------- Chapter meta: claim count and tier mix ---------- */
function chapterMeta(view) {
  const box = view.querySelector('[data-meta]'); if (!box) return;
  const seen = new Map();
  $$('button.tier', view).forEach((b) => { if (b.dataset.claim && !seen.has(b.dataset.claim)) seen.set(b.dataset.claim, b.dataset.t); });
  const n = seen.size; if (!n) return;
  const order = ['1', '2', '3', '4', '5', 'u'];
  const cnt = {}; seen.forEach((t) => { cnt[t] = (cnt[t] || 0) + 1; });
  const segs = order.filter((t) => cnt[t]).map((t) => `<i data-t="${t}" style="flex:${cnt[t]}" title="${t === 'u' ? 'Untested' : 'T' + t}: ${cnt[t]}"></i>`).join('');
  const words = order.filter((t) => cnt[t]).map((t) => `${t === 'u' ? 'Untested' : 'T' + t} ${cnt[t]}`).join(' · ');
  box.innerHTML = `<span class="label">${n} graded claims</span><span class="mix" role="img" aria-label="Evidence mix: ${words}">${segs}</span><span class="fine">${words}</span>`;
}

/* ---------- Router: one chapter at a time ---------- */
function safeInit(fn) { try { fn(); } catch (err) { console.error('component failed:', fn.name, err); } }
const CHAPTERS = ['little', 'load', 'lifts', 'walk', 'range'];
const inits = {};
const started = {};
let curView = null;
function showView(v) {
  if (curView === v) return false;
  curView = v;
  $$('.view').forEach((s) => { s.hidden = s.dataset.view !== v; });
  const sec = document.querySelector(`.view[data-view="${v}"]`);
  $('crumb-ch').textContent = v === 'cover' ? 'Contents' : sec.dataset.title;
  $$('.chnav a').forEach((a) => { if (a.dataset.ch === v) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  document.documentElement.style.setProperty('--hue', v === 'cover' ? 'var(--h-move)' : `var(${sec.style.getPropertyValue('--ch').match(/--[\w-]+/)[0]})`);
  if (!started[v]) {
    started[v] = true;
    chips(sec);
    try { (inits[v] || (() => {}))(); } catch (err) { console.error('init failed', v, err); }
    chips(sec);
    if (v !== 'cover') chapterMeta(sec);
    evBuild(v);
  }
  window.dispatchEvent(new CustomEvent('move:view', { detail: v }));
  return true;
}
function route() {
  const raw = decodeURIComponent(location.hash.slice(1));
  let [v, sub] = raw.split(':');
  if (v === 'main') { $('main').focus(); return; }
  if (!CHAPTERS.includes(v)) {
    const el = v && document.getElementById(v);
    const host = el && el.closest('.view');
    if (host && host.dataset.view !== 'cover') { sub = v; v = host.dataset.view; } else { v = 'cover'; sub = null; }
  }
  const changed = showView(v);
  requestAnimationFrame(() => {
    if (v === 'lifts' && sub && LIFTS[sub]) { pickLift(sub); sub = 'lifts-ex'; }
    const target = sub && document.getElementById(sub);
    if (target) target.scrollIntoView({ behavior: REDUCE || changed ? 'auto' : 'smooth', block: 'start' });
    else if (changed) window.scrollTo(0, 0);
    if (changed && v !== 'cover') { const h = document.querySelector(`.view[data-view="${v}"] h1`); if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    readProgress();
  });
}
window.addEventListener('hashchange', route);

/* ---------- Reading bar, visibility, sizing, segmented buttons ---------- */
function readProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  const p = max > 0 ? clamp(scrollY / max, 0, 1) : 0;
  const s = document.querySelector('.readbar span');
  if (s) s.style.transform = `scaleX(${p})`;
}
addEventListener('scroll', readProgress, { passive: true });
addEventListener('resize', readProgress);
function whenVisible(el, fn) {
  if (!('IntersectionObserver' in window)) { fn(true); return; }
  new IntersectionObserver((es) => es.forEach((e) => fn(e.isIntersecting)), { threshold: 0.05 }).observe(el);
}
function responsive(el, draw) {
  let last = 0, tm = 0;
  const run = () => { const w = Math.round(el.clientWidth); if (!w || Math.abs(w - last) < 2) return; last = w; draw(w); };
  if ('ResizeObserver' in window) new ResizeObserver(() => { clearTimeout(tm); tm = setTimeout(run, last ? 120 : 0); }).observe(el);
  run();
}
function seg(group, attr, fn) {
  const btns = $$(`[data-${attr}]`, group);
  btns.forEach((b) => b.addEventListener('click', () => {
    btns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    fn(b.dataset[attr], b);
  }));
}

/* ================= Lift figures: drawing (the physics lives in figure.js) ================= */
const LIFTS = FIG.LIFTS, FLOOR = FIG.FLOOR;
const P2 = (p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
function figureScene(svg, L) {
  svg.innerHTML = '';
  svg.setAttribute('viewBox', '0 -26 240 226');
  const grp = (cls) => svgEl('g', { class: cls }, svg);
  const g = { scene: grp('scene'), path: grp('paths'), kitBack: grp('kitback'), body: grp('body'), kit: grp('kit') };
  const R = (x, y, w, h) => svgEl('rect', { x, y, width: w, height: h, rx: 1.5, class: 'furn' }, g.scene);
  if (!L.noFloor) svgEl('line', { x1: 8, y1: FLOOR, x2: 232, y2: FLOOR, class: 'floor' }, g.scene);
  if (L.scene === 'bench') { R(44, 140, 100, 7); R(54, 147, 6, 31); R(128, 147, 6, 31); R(58, 58, 5, 120); R(58, 84, 14, 4); }
  if (L.scene === 'rack') { const top = FIG.frame(L, 0).kit, bot = FIG.frame(L, 1).kit; R(170, 10, 6, 168); R(150, top[1] + 4, 26, 4); R(140, bot[1] + 6, 36, 4); }
  if (L.scene === 'door') R(178, -26, 10, 204);
  if (L.scene === 'bar') { R(62, -26, 6, 226); R(184, -26, 6, 226); svgEl('line', { x1: 62, y1: 2, x2: 190, y2: 2, class: 'kit-line' }, g.scene); }
  if (L.kit !== 'none') {
    let d = '';
    for (let i = 0; i <= 40; i++) d += (i ? 'L' : 'M') + P2(FIG.frame(L, i / 40).kit);
    svgEl('path', { d, class: 'path' }, g.path);
  }
  const body = svgEl('path', { class: 'body' }, g.body);
  const head = svgEl('circle', { r: FIG.SEG.head, class: 'head' }, g.body);
  return { g, body, head, L };
}
function drawFrame(F, s) {
  const L = F.L, J = FIG.frame(L, s);
  F.body.setAttribute('d', `M${P2(J.toe)}L${P2(J.ankle)}L${P2(J.knee)}L${P2(J.hip)}L${P2(J.sh)}M${P2(J.sh)}L${P2(J.elbow)}L${P2(J.hand)}`);
  F.head.setAttribute('cx', J.head[0].toFixed(1)); F.head.setAttribute('cy', J.head[1].toFixed(1));
  const k = F.g.kit, kb = F.g.kitBack; k.innerHTML = ''; kb.innerHTML = '';
  if (!J.kit) return;
  const [x, y] = J.kit;
  if (L.kit === 'kb') {
    svgEl('circle', { cx: x, cy: y, r: FIG.KIT.kb.r, class: 'kit' }, k);
    svgEl('path', { d: `M${(x - 7).toFixed(1)} ${(y - 6).toFixed(1)}Q${x.toFixed(1)} ${(J.hand[1] - 7).toFixed(1)} ${(x + 7).toFixed(1)} ${(y - 6).toFixed(1)}`, class: 'kit-line', 'stroke-width': 3 }, k);
  } else if (L.kit === 'db') {
    svgEl('circle', { cx: x, cy: y, r: FIG.KIT.db.r, class: 'kit' }, k);
  } else if (L.kit === 'bb') {
    svgEl('circle', { cx: x, cy: y, r: FIG.KIT.bb.r, class: 'kit', opacity: L.floorBar ? 0.85 : 0.5 }, kb);
    svgEl('circle', { cx: x, cy: y, r: 3.2, class: 'hub' }, k);
  }
}
/* A looping animator for one SVG */
function animator(svg) {
  let F = null, t0 = 0, on = !REDUCE, vis = true, raf = 0;
  const period = FIG.PERIOD;
  const tick = (now) => {
    raf = 0;
    if (!F) return;
    drawFrame(F, FIG.phase(((now - t0) % period) / period));
    if (on && vis) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf && on && vis && F) raf = requestAnimationFrame(tick); };
  whenVisible(svg, (v) => { vis = v; kick(); });
  return {
    set(L) { F = figureScene(svg, L); t0 = performance.now(); drawFrame(F, on ? 0 : 1); kick(); },
    play(p) { on = p; if (p) { t0 = performance.now(); kick(); } else if (F) drawFrame(F, 1); },
    period
  };
}

/* ---------- Hero: cycles the four lifts ---------- */
const HERO_ORDER = [['squat', 1], ['hinge', 1], ['push', 0], ['pull', 1]];
function initHero() {
  const svg = $('hero-svg'), names = $$('.hero-names a');
  const A = animator(svg);
  let i = 0;
  const show = () => {
    const [k, r] = HERO_ORDER[i];
    A.set(LIFTS[k].rungs[r]);
    names.forEach((a) => a.classList.toggle('on', a.dataset.hl === k));
  };
  show();
  if (!REDUCE) setInterval(() => { if (document.hidden || curView !== 'cover') return; i = (i + 1) % HERO_ORDER.length; show(); }, A.period * 2);
}

/* ---------- Lift explorer ---------- */
let liftState = { k: 'squat', r: 0 }, liftAnim = null;
function pickLift(k) {
  if (!LIFTS[k]) return;
  liftState.k = k;
  $$('#lift-pick [data-lift]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lift === k)));
  renderLift();
}
function renderLift() {
  if (!liftAnim) return;
  const Lf = LIFTS[liftState.k], R = Lf.rungs[liftState.r];
  $('lift-rung').innerHTML = Lf.rungs.map((x, i) => `<button type="button" data-r="${i}" aria-pressed="${i === liftState.r}"><small>${['Rung 1', 'Rung 2', 'Rung 3'][i]}</small>${esc(x.rung)}</button>`).join('');
  $$('#lift-rung button').forEach((b) => b.addEventListener('click', () => { liftState.r = +b.dataset.r; renderLift(); }));
  $('lift-svg').setAttribute('aria-label', `${R.title}, animated side view`);
  liftAnim.set(R);
  $('lift-card').innerHTML = `<p class="label">${esc(Lf.name)} · ${esc(R.rung)}</p><h3>${esc(R.title)}</h3><p class="trains">${esc(Lf.trains)}</p>
    <ol class="cues">${R.cues.map((c) => `<li>${esc(c)}</li>`).join('')}</ol>
    <div class="lift-more"><div><span class="label">Easier</span>${esc(R.easier)}</div><div><span class="label">Harder</span>${esc(R.harder)}</div><div class="wide-cell"><span class="label">Common mistake</span>${esc(R.mistake)}</div></div>`;
}
function initLifts() {
  liftAnim = animator($('lift-svg'));
  seg($('lift-pick'), 'lift', (k) => { liftState.k = k; renderLift(); });
  const pb = $('lift-play');
  if (REDUCE) { pb.textContent = 'Play'; pb.setAttribute('aria-pressed', 'false'); }
  pb.addEventListener('click', () => { const on = pb.getAttribute('aria-pressed') !== 'true'; pb.setAttribute('aria-pressed', String(on)); pb.textContent = on ? 'Pause' : 'Play'; liftAnim.play(on); });
  renderLift();
}
inits.lifts = () => safeInit(initLifts);

/* ---------- Chart helper ---------- */
function chartFrame(box, w, opt) {
  const h = Math.round(clamp(w * 0.5, 210, 300));
  const m = { l: 44, r: 16, t: 14, b: 34 };
  box.innerHTML = '';
  const svg = svgEl('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': opt.label }, box);
  const X = (v) => m.l + (v - opt.x0) / (opt.x1 - opt.x0) * (w - m.l - m.r);
  const Y = (v) => m.t + (opt.y1 - v) / (opt.y1 - opt.y0) * (h - m.t - m.b);
  opt.yt.forEach((v) => { svgEl('line', { x1: m.l, x2: w - m.r, y1: Y(v), y2: Y(v), class: 'gridl' }, svg); const t = svgEl('text', { x: m.l - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'ax' }, svg); t.textContent = opt.yf(v); });
  opt.xt.forEach((v) => { const t = svgEl('text', { x: X(v), y: h - 12, 'text-anchor': 'middle', class: 'ax' }, svg); t.textContent = opt.xf(v); });
  return { svg, X, Y, w, h, m };
}
function interp(pts, x) {
  if (x <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const [a, b] = [pts[i - 1], pts[i]]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
  return pts[pts.length - 1][1];
}
const pathOf = (pts, C) => pts.map((p, i) => (i ? 'L' : 'M') + C.X(p[0]).toFixed(1) + ' ' + C.Y(p[1]).toFixed(1)).join('');

/* ---------- 01: strength curve ---------- */
/* Shape from Momma et al. 2022: lowest all-cause RR 0.83 at about 40 min/week, below 1.0 to about 130-140 min.
   Points between those anchors are read off the published curve and are approximate. */
const JC = [[0, 1], [10, 0.94], [20, 0.89], [30, 0.855], [40, 0.83], [50, 0.835], [60, 0.85], [80, 0.885], [100, 0.925], [120, 0.965], [140, 1.0]];
const JC_HI = [[140, 1.0], [160, 1.04], [180, 1.08]];
function initJC() {
  const box = $('jc-chart'), r = $('jc-r');
  let C = null, mk = null, ml = null;
  const draw = (w) => {
    C = chartFrame(box, w, { label: 'Relative risk of death by minutes of strength work per week', x0: 0, x1: 180, y0: 0.75, y1: 1.1, yt: [0.8, 0.9, 1.0, 1.1], yf: (v) => v.toFixed(1), xt: [0, 30, 60, 90, 120, 150, 180], xf: (v) => v + ' min' });
    svgEl('rect', { x: C.X(30), y: C.m.t, width: C.X(60) - C.X(30), height: C.h - C.m.t - C.m.b, class: 'zone' }, C.svg);
    const zl = svgEl('text', { x: C.X(45), y: C.m.t + 14, 'text-anchor': 'middle', class: 'zone-l' }, C.svg); zl.textContent = 'Lowest risk';
    svgEl('line', { x1: C.m.l, x2: C.w - C.m.r, y1: C.Y(1), y2: C.Y(1), class: 'ref' }, C.svg);
    const nl = svgEl('text', { x: C.w - C.m.r - 2, y: C.Y(1) - 6, 'text-anchor': 'end', class: 'ax' }, C.svg); nl.textContent = 'No strength work';
    svgEl('path', { d: pathOf(JC, C), class: 'ln' }, C.svg);
    svgEl('path', { d: pathOf(JC_HI, C), class: 'ln unsure' }, C.svg);
    mk = svgEl('circle', { r: 7, class: 'mk' }, C.svg);
    ml = svgEl('text', { class: 'mk-l', 'text-anchor': 'middle' }, C.svg);
    upd();
  };
  const upd = () => {
    const v = +r.value, y = v <= 140 ? interp(JC, v) : interp(JC_HI, v);
    $('jc-out').textContent = v + ' min';
    const pct = Math.round((y - 1) * 100);
    $('jc-rr').textContent = v > 140 ? 'Unclear' : v === 0 ? '0%' : (pct <= 0 ? '−' : '+') + Math.abs(pct) + '%';
    $('jc-wk').textContent = v === 0 ? 'None' : v <= 60 ? `2 × ${Math.round(v / 2)}` : `${Math.ceil(v / 30)} × ${Math.round(v / Math.ceil(v / 30))}`;
    if (C) { mk.setAttribute('cx', C.X(v)); mk.setAttribute('cy', C.Y(y)); ml.setAttribute('x', clamp(C.X(v), 40, C.w - 40)); ml.setAttribute('y', C.Y(y) - 14); ml.textContent = v > 140 ? 'Too few people to tell' : 'RR ' + y.toFixed(2); }
  };
  r.addEventListener('input', upd);
  responsive(box, draw);
}

/* ---------- 01: steps curve ---------- */
const STP = [[3553, 1], [5801, 0.6], [7842, 0.55], [10901, 0.47]];
const PLATEAU = { under: [8000, 10000], over: [6000, 8000] };
function initSteps() {
  const box = $('st-chart'), r = $('st-r');
  let C = null, mk = null, ml = null, band = null, bandL = null, age = 'under';
  const draw = (w) => {
    C = chartFrame(box, w, { label: 'Relative risk of death by daily steps', x0: 3000, x1: 12000, y0: 0.4, y1: 1.05, yt: [0.4, 0.6, 0.8, 1.0], yf: (v) => v.toFixed(1), xt: [3000, 6000, 9000, 12000], xf: (v) => fmt(v) });
    band = svgEl('rect', { y: C.m.t, height: C.h - C.m.t - C.m.b, class: 'zone' }, C.svg);
    bandL = svgEl('text', { y: C.m.t + 14, 'text-anchor': 'middle', class: 'zone-l' }, C.svg);
    svgEl('path', { d: pathOf(STP, C), class: 'ln', style: 'stroke: var(--h-evolution)' }, C.svg);
    STP.forEach((p) => svgEl('circle', { cx: C.X(p[0]), cy: C.Y(p[1]), r: 5, class: 'pt', style: 'stroke: var(--h-evolution)' }, C.svg));
    mk = svgEl('circle', { r: 7, class: 'mk', style: 'fill: var(--h-evolution)' }, C.svg);
    ml = svgEl('text', { class: 'mk-l', 'text-anchor': 'middle' }, C.svg);
    upd();
  };
  const upd = () => {
    const v = +r.value, y = interp(STP, v), [p0, p1] = PLATEAU[age];
    $('st-out').textContent = fmt(v);
    $('st-rr').textContent = v <= STP[0][0] ? 'Baseline' : '−' + Math.round((1 - y) * 100) + '%';
    $('st-zone').textContent = v < p0 ? 'Still steep' : v <= p1 ? 'Flattening' : 'Past the bend';
    $('st-zone-t').textContent = `For ${age === 'under' ? 'under-60s' : 'adults 60 and over'}, risk stopped falling at about ${fmt(p0)} to ${fmt(p1)} steps.`;
    if (C) {
      band.setAttribute('x', C.X(p0)); band.setAttribute('width', C.X(p1) - C.X(p0));
      bandL.setAttribute('x', (C.X(p0) + C.X(p1)) / 2); bandL.textContent = 'Flattens here';
      mk.setAttribute('cx', C.X(v)); mk.setAttribute('cy', C.Y(y));
      ml.setAttribute('x', clamp(C.X(v), 40, C.w - 40)); ml.setAttribute('y', C.Y(y) - 14);
      ml.textContent = v < STP[0][0] ? 'Below the least active group' : v > STP[3][0] ? 'Beyond the most active group' : 'HR ' + y.toFixed(2);
    }
  };
  seg($('st-age'), 'age', (a) => { age = a; upd(); });
  r.addEventListener('input', upd);
  responsive(box, draw);
}

/* ---------- 01: week planner ---------- */
const BLK = { lift: ['--h-tools', 'Lift'], walk: ['--h-evolution', 'Walk'], mob: ['--h-thinking', 'Mobility'], rest: ['--muted', 'Rest'] };
const WEEKS = {
  2: [[['mob', 5, 'Warm-up'], ['lift', 30, 'Session A'], ['walk', 20]], [['walk', 30]], [['walk', 30]], [['mob', 5, 'Warm-up'], ['lift', 30, 'Session B'], ['walk', 20]], [['walk', 30]], [['walk', 45, 'Long walk']], [['mob', 5], ['rest', 0, 'Easy day']]],
  3: [[['mob', 5, 'Warm-up'], ['lift', 25, 'Session A'], ['walk', 20]], [['walk', 30]], [['mob', 5, 'Warm-up'], ['lift', 25, 'Session B'], ['walk', 20]], [['walk', 30]], [['mob', 5, 'Warm-up'], ['lift', 25, 'Session A'], ['walk', 20]], [['walk', 45, 'Long walk']], [['mob', 5], ['rest', 0, 'Easy day']]]
};
function initWeek() {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const render = (n) => {
    const W = WEEKS[n], tot = { lift: 0, walk: 0, mob: 0 };
    $('week').innerHTML = W.map((d, i) => `<div class="day"><span class="dn">${days[i]}</span><div class="bl">${d.map(([k, m, t]) => { if (tot[k] != null) tot[k] += m; return `<div class="blk" style="--bc: var(${BLK[k][0]})">${esc(t || BLK[k][1])}${m ? `<small>${m} min ${k === 'lift' ? 'lifting' : k === 'walk' ? 'walking' : 'mobility'}</small>` : ''}</div>`; }).join('')}</div></div>`).join('');
    $('week-legend').innerHTML = ['lift', 'walk', 'mob'].map((k) => `<span><i style="--lc: var(${BLK[k][0]})"></i>${BLK[k][1]}</span>`).join('');
    $('week-cap').textContent = `Lifting ${tot.lift} min · brisk walking ${tot.walk} min · mobility ${tot.mob} min a week. ${n === 2 ? 'That meets the guidelines and sits right in the lowest-risk band of the strength curve.' : 'Three shorter sessions suit some people better. Past about an hour of lifting a week, extra health benefit is unclear, so do the third day because it helps you, not because you have to.'}`;
  };
  seg($('wk-mode'), 'wk', (n) => render(n));
  render(2);
}
inits.little = () => [initJC, initSteps, initWeek].forEach(safeInit);

/* ---------- 02: mechanostat ring ---------- */
function ringPath(cx, cy, R, r) { return `M${cx - R} ${cy}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0ZM${cx - r} ${cy}a${r} ${r} 0 1 1 ${2 * r} 0a${r} ${r} 0 1 1 ${-2 * r} 0Z`; }
const MECH = [
  [25, 'Disuse', 'Too little strain, like bed rest or spaceflight. Osteoclasts dissolve bone that isn’t being used, and the shell thins from the inside.'],
  [55, 'Daily life', 'Strain stays inside the usual range. Bone is still being remodeled, but what is removed is replaced, so the shell holds steady.'],
  [82, 'Training', 'Strain above the usual range, repeated, with rest between. Osteoblasts lay down new bone, and over months the shell thickens.'],
  [101, 'Overload', 'Too much, too fast, without recovery. Tiny cracks form faster than they can be repaired, which is how stress fractures happen. Build up gradually.']
];
function initRing() {
  const svg = $('ring-svg'), r = $('mech-r');
  const cort = svgEl('path', { class: 'cort', 'fill-rule': 'evenodd' }, svg);
  const marrow = svgEl('circle', { cx: 100, cy: 100, class: 'marrow' }, svg);
  const cells = svgEl('g', { class: 'cells' }, svg);
  const crack = svgEl('path', { d: 'M152 62l-7 6 5 3-8 7', fill: 'none', stroke: 'var(--t5)', 'stroke-width': 2.5, 'stroke-linecap': 'round', opacity: 0 }, svg);
  const N = 12, dots = [];
  for (let i = 0; i < N; i++) dots.push(svgEl('circle', { r: 4.5, opacity: 0 }, cells));
  const upd = () => {
    const v = +r.value, z = MECH.findIndex((m) => v < m[0]);
    const thick = v < 25 ? lerp(10, 18, v / 25) : v < 55 ? 20 : v < 82 ? lerp(20, 30, (v - 55) / 27) : 30;
    const R = 78, ri = R - thick;
    cort.setAttribute('d', ringPath(100, 100, R, ri));
    marrow.setAttribute('r', ri);
    dots.forEach((d, i) => {
      const a = (i / N) * Math.PI * 2, rr = ri + 1;
      d.setAttribute('cx', 100 + rr * Math.cos(a)); d.setAttribute('cy', 100 + rr * Math.sin(a));
      const resorb = z === 0 || (z === 3 && i % 2 === 0) || (z === 1 && i % 4 === 0);
      const form = z === 2 || (z === 3 && i % 2 === 1) || (z === 1 && i % 4 === 2);
      d.setAttribute('class', resorb ? 'oc' : 'ob');
      d.setAttribute('opacity', resorb || form ? 1 : 0);
    });
    crack.setAttribute('opacity', z === 3 ? 1 : 0);
    $('mech-out').textContent = MECH[z][1];
    $('mech-state').textContent = MECH[z][2];
  };
  r.addEventListener('input', upd);
  upd();
}
function initArms() {
  const SZ = { active: { non: [52, 34], thr: [62, 34] }, retired: { non: [52, 40], thr: [56, 40] } };
  const render = (k) => {
    const s = SZ[k];
    const one = (R, ri, title, note) => `<figure><svg viewBox="0 0 140 140" role="img" aria-label="${esc(title)}"><path class="cort" fill-rule="evenodd" d="${ringPath(70, 70, R, ri)}"/><circle class="marrow" cx="70" cy="70" r="${ri}"/></svg><figcaption><b>${esc(note)}</b>${esc(title)}</figcaption></figure>`;
    $('arms').innerHTML = one(s.non[0], s.non[1], 'Non-throwing arm', '1×') + one(s.thr[0], s.thr[1], 'Throwing arm', k === 'active' ? '≈ 2× strength' : '≈ ⅓ of the extra strength kept');
  };
  seg($('arm-mode'), 'arm', render);
  render('active');
}
const CLOCKS = [
  ['Nervous system', 'Strength rises first', 1, 6, '--h-science'],
  ['Muscle size', 'Measurable from about 3 weeks', 3, 52, '--h-move'],
  ['Tendon stiffness', 'Weeks to months', 4, 26, '--h-tools'],
  ['Bone density', 'One remodeling cycle is 3 to 6 months', 13, 104, '--h-library'],
  ['Tendon size', 'Months to years', 26, 260, '--h-thinking']
];
function initClocks() {
  const lo = Math.log(0.7), hi = Math.log(300), X = (w) => (Math.log(w) - lo) / (hi - lo) * 100;
  $('clocks').innerHTML = CLOCKS.map(([n, s, a, b, c]) => `<div class="clock"><span><b>${n}</b><small>${s}</small></span><span class="tr"><span class="fl" style="--cc: var(${c}); left:${X(a)}%; width:${X(b) - X(a)}%"></span></span></div>`).join('') +
    `<div class="clock-ax">${[[1, '1 wk'], [4.3, '1 mo'], [13, '3 mo'], [26, '6 mo'], [52, '1 yr'], [260, '5 yr']].map(([v, l]) => `<i style="left:${X(v)}%">${l}</i>`).join('')}</div>`;
}
inits.load = () => [initRing, initArms, initClocks].forEach(safeInit);

/* ---------- 04: step builder ---------- */
function initBuilder() {
  const r = $('sb-r'); let base = 4500, age = 'under';
  const MAX = 15000, P = (v) => clamp(v / MAX * 100, 0, 100);
  $('sb-ax').innerHTML = [0, 5000, 10000, 15000].map((v) => `<i style="left:${P(v)}%">${fmt(v)}</i>`).join('');
  const upd = () => {
    const m = +r.value, walk = m * 100, tot = base + walk, [z0, z1] = PLATEAU[age];
    $('sb-out').textContent = m + ' min';
    $('sb-total').textContent = fmt(Math.round(tot / 100) * 100);
    $('sb-mod').textContent = fmt(m * 7);
    const b1 = $('sb-b1'), b2 = $('sb-b2'), zn = $('sb-zone');
    b1.style.left = '0%'; b1.style.width = P(base) + '%';
    b2.style.left = P(base) + '%'; b2.style.width = (P(tot) - P(base)) + '%';
    zn.style.left = P(z0) + '%'; zn.style.width = (P(z1) - P(z0)) + '%';
  };
  seg($('sb-base'), 'base', (v) => { base = +v; upd(); });
  seg($('sb-age'), 'sba', (v) => { age = v; upd(); });
  r.addEventListener('input', upd);
  upd();
}
inits.walk = () => safeInit(initBuilder);

/* ---------- 05: sit-to-rise ---------- */
const SR_PARTS = [['hand', 'Hand', 1], ['knee', 'Knee', 1], ['arm', 'Forearm', 1], ['leg', 'Side of leg', 1], ['wob', 'Wobble', 0.5]];
const SR = { sit: {}, rise: {} };
function srScore(side) { return Math.max(0, 5 - SR_PARTS.reduce((s, [k, , w]) => s + (SR[side][k] || 0) * w, 0)); }
function initSitRise() {
  const box = $('sr');
  const render = () => {
    box.innerHTML = [['sit', 'Sitting down'], ['rise', 'Standing up']].map(([side, label]) => `<div class="sr-col"><h4>${label}<b>${fmt(srScore(side), srScore(side) % 1 ? 1 : 0)}</b></h4><div class="taps">${SR_PARTS.map(([k, n, w]) => `<button type="button" data-side="${side}" data-k="${k}"><span class="n">${n} · ${SR[side][k] || 0}</span><small>−${w} each time</small></button>`).join('')}</div></div>`).join('');
    const t = srScore('sit') + srScore('rise');
    $('sr-score').textContent = fmt(t, t % 1 ? 1 : 0);
    $('sr-say').textContent = t >= 8 ? 'In the study’s top group, 8 to 10. Keep doing whatever keeps you here.'
      : t >= 6 ? 'In the second group, 6 to 7.5. Squats, hinges and single-leg balance are the moves that raise this score.'
      : t >= 3.5 ? 'In the third group, 3.5 to 5.5. Leg strength and balance work raise this score. Retest in a couple of months.'
      : 'In the lowest group, 0 to 3. In the study, this group had several times the risk of death of the top group over about six years. It’s a strong reason to start strength and balance work, ideally with a physical therapist to guide you.';
  };
  box.addEventListener('click', (e) => { const b = e.target.closest('button[data-k]'); if (!b) return; const s = SR[b.dataset.side]; s[b.dataset.k] = (s[b.dataset.k] || 0) + 1; render(); });
  $('sr-reset').addEventListener('click', () => { SR.sit = {}; SR.rise = {}; render(); });
  render();
}
inits.range = () => safeInit(initSitRise);

/* ================= Look: palettes, type and the 1985 switch (same as Fuel) ================= */
const PALETTES = [
  { id: 'black', name: 'Black', c: ['#000000', '#ECE8E1', '#9DBBDD'] },
  { id: 'auto', name: 'Match device', c: ['#ECE9E2', '#000000', '#9DBBDD'] },
  { id: 'paper', name: 'Paper', c: ['#ECE9E2', '#1C1B18', '#2E4C6E'] },
  { id: 'dot', name: 'Blue dot', c: ['#0A1220', '#E4E8EE', '#E2B04A'] },
  { id: 'field', name: 'Field', c: ['#E3E6DC', '#1D231B', '#46633A'] },
  { id: 'marrow', name: 'Marrow', c: ['#EFEBE6', '#211B19', '#8E2C22'] },
  { id: 'grey', name: 'Greybox', c: ['#EDEDED', '#222222', '#4A4A4A'] }
];
const TYPES = [{ id: 'mono', name: 'Overpass Mono', s: 'Mono throughout' }, { id: 'serif', name: 'Serif reading', s: 'Plex Serif body' }];
const lk = (k, v) => { try { if (v === undefined) return localStorage.getItem('bones-' + k); if (v === null) localStorage.removeItem('bones-' + k); else localStorage.setItem('bones-' + k, v); } catch (e) { return null; } return null; };
const ROOT = document.documentElement;
const isDim = () => lk('dim') === 'neon';
function applyLook() {
  if (isDim()) ROOT.setAttribute('data-dim', 'neon'); else ROOT.removeAttribute('data-dim');
  const pal = lk('palette') || 'black', ty = lk('type') || 'mono';
  if (pal === 'auto') ROOT.removeAttribute('data-palette'); else ROOT.setAttribute('data-palette', pal);
  if (ty === 'mono') ROOT.removeAttribute('data-type'); else ROOT.setAttribute('data-type', ty);
  const sw = document.querySelector('.dim-switch');
  if (sw) { const on = isDim(); sw.setAttribute('aria-checked', String(on)); sw.title = on ? 'Return to the prime dimension' : 'Enter the alternate dimension'; sw.querySelector('.ds-label').textContent = on ? '1985' : 'Prime'; }
  renderTune();
}
let tuneOpen = false;
function renderTune() {
  const box = $('tune-panel'); if (!box) return;
  box.hidden = !tuneOpen; $('tune-btn').setAttribute('aria-expanded', String(tuneOpen));
  if (!tuneOpen) return;
  const pal = lk('palette') || 'black', ty = lk('type') || 'mono';
  box.innerHTML = `<div><h2>Palette</h2>${isDim() ? '<p class="fine" style="margin-bottom:8px">Palettes apply in the prime dimension.</p>' : ''}<div class="swatches">${PALETTES.map((p) => `<button class="sw" type="button" data-pal="${p.id}" aria-pressed="${p.id === pal}"><i aria-hidden="true">${p.c.map((c) => `<b style="background:${c}"></b>`).join('')}</i>${p.name}</button>`).join('')}</div></div>
    <div><h2>Type</h2><div class="opts">${TYPES.map((t) => `<button class="opt" type="button" data-ty="${t.id}" aria-pressed="${t.id === ty}"><span>${t.name}</span><span class="s">${t.s}</span></button>`).join('')}</div></div>`;
}
function initLook() {
  const acts = document.querySelector('.top-actions');
  acts.innerHTML = '<button class="dim-switch" type="button" role="switch" aria-label="Alternate dimension" aria-checked="false"><span class="ds-track" aria-hidden="true"><span class="ds-knob"></span></span><span class="ds-label">Prime</span></button>';
  document.body.insertAdjacentHTML('beforeend', '<button class="tune-btn" id="tune-btn" type="button" aria-expanded="false" aria-controls="tune-panel">Tune</button><div class="tune" id="tune-panel" role="dialog" aria-label="Look" hidden></div>');
  $('tune-btn').addEventListener('click', (e) => { e.stopPropagation(); tuneOpen = !tuneOpen; renderTune(); });
  $('tune-panel').addEventListener('click', (e) => {
    e.stopPropagation();
    const p = e.target.closest('[data-pal]'), t = e.target.closest('[data-ty]');
    if (p) { lk('palette', p.dataset.pal === 'black' ? null : p.dataset.pal); applyLook(); }
    if (t) { lk('type', t.dataset.ty === 'mono' ? null : t.dataset.ty); applyLook(); }
  });
  document.addEventListener('click', () => { if (tuneOpen) { tuneOpen = false; renderTune(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && tuneOpen) { tuneOpen = false; renderTune(); $('tune-btn').focus(); } });
  acts.querySelector('.dim-switch').addEventListener('click', flipDim);
  applyLook();
}
let flipping = false;
async function flipDim() {
  if (flipping) return;
  const to = isDim() ? null : 'neon';
  const set = () => { lk('dim', to); applyLook(); };
  if (REDUCE || typeof document.body.animate !== 'function') { set(); return; }
  flipping = true;
  const ov = document.createElement('div');
  ov.className = 'rift' + (to ? ' to-neon' : ''); ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = '<div class="rift-top"></div><div class="rift-bot"></div><div class="rift-line"></div>';
  document.body.appendChild(ov);
  const [top, bot, line] = ov.children; const anims = [];
  const run = (el, f, o) => { const a = el.animate(f, o); anims.push(a); return a.finished; };
  ROOT.classList.add('glitching');
  try {
    const close = { duration: 280, easing: 'cubic-bezier(0.7, 0, 0.84, 0)', fill: 'forwards' };
    await Promise.all([run(top, [{ transform: 'translateY(-100%)' }, { transform: 'translateY(0)' }], close), run(bot, [{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], close)]);
    ROOT.classList.remove('glitching'); set();
    await run(line, [{ transform: 'scaleX(0)', opacity: 1 }, { transform: 'scaleX(1)', opacity: 1, offset: 0.55 }, { transform: 'scaleX(1)', opacity: 0 }], { duration: 420, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'forwards' });
    const open = { duration: 460, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'forwards' };
    await Promise.all([run(top, [{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], open), run(bot, [{ transform: 'translateY(0)' }, { transform: 'translateY(100%)' }], open)]);
  } catch (err) { if ((lk('dim') === 'neon') !== !!to) set(); } finally { anims.forEach((a) => a.cancel()); ROOT.classList.remove('glitching'); ov.remove(); flipping = false; }
}

/* ================= Boot ================= */
function initKey() {
  const row = (rules) => ['1', '2', '3', '4', '5', 'u'].map((t) => `<span class="tier" data-t="${t}" style="cursor:default">${esc(tierText(rules, t))}</span>`).join('');
  ['health', 'data', 'history'].forEach((k) => { $('key-' + k).innerHTML = row(k); $(`key-${k}-txt`).textContent = RULES[k]; });
}
inits.cover = () => [initKey, initHero].forEach(safeInit);
safeInit(initLook);
route();
if (!location.hash) readProgress();
