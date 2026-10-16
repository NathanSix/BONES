/* BONES shared script. Loaded by every page.
   - Registers the offline service worker so the site can be added to a home screen.
   - Opens links to other BONES pages in the same tab (the pages were first built as
     separate claude.ai artifacts, which opened each other in new tabs).
   - Adds a small "BONES" home button to pages that have no way back to the site. */
(function () {
  'use strict';
  var me = document.currentScript;
  var root = (me && me.getAttribute('data-root')) || './';
  var rootURL = new URL(root, location.href).href;

  /* Palette before first paint, so pages don't flash light. Black is the default; the Tune
     panel on pages that have one stores another choice under the same key. */
  try {
    var pal = window.localStorage.getItem('bones-palette') || 'black';
    if (pal !== 'auto') document.documentElement.setAttribute('data-palette', pal);
  } catch (e) { document.documentElement.setAttribute('data-palette', 'black'); }

  /* Same-tab navigation inside the site. Capture phase, so it runs before the browser
     acts on target="_blank" in links that scripts build after the page loads. */
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a || a.target !== '_blank') return;
    if (a.origin === location.origin && a.href.indexOf(rootURL) === 0) {
      a.removeAttribute('target');
    }
  }, true);

  /* Home button, only where the page has no BONES brand link of its own. */
  function addHome() {
    if (new URL(root, location.href).pathname === location.pathname) return;
    if (document.querySelector('a.brand, [data-bones-home]')) return;
    /* data-home="top" (default): a slim strip above the page that scrolls away with it.
       data-home="bl:58" and similar: pinned to a corner (t/b + l/r), with an optional
       offset in px, for full-screen pages where a strip would push content off screen. */
    var mode = (me && me.getAttribute('data-home')) || 'top';
    var a = document.createElement('a');
    a.href = root;
    a.setAttribute('data-bones-home', '');
    a.setAttribute('aria-label', 'Back to BONES home');
    a.textContent = '\u2190 BONES';
    var pill = [
      'display:inline-block', 'padding:8px 12px', 'border-radius:999px',
      'background:rgba(20,19,17,0.78)', 'color:#ECE9E2',
      '-webkit-backdrop-filter:blur(8px)', 'backdrop-filter:blur(8px)',
      'border:1px solid rgba(236,233,226,0.22)',
      'font:600 12px/1 "Overpass Mono", ui-monospace, Menlo, monospace',
      'letter-spacing:0.08em', 'text-decoration:none'
    ];
    if (mode === 'top') {
      a.style.cssText = pill.join(';');
      var strip = document.createElement('div');
      strip.style.cssText = 'padding:10px max(16px, env(safe-area-inset-left, 0px)) 0;position:relative;z-index:5';
      strip.appendChild(a);
      document.body.insertBefore(strip, document.body.firstChild);
      return;
    }
    var parts = mode.split(':');
    var off = parseInt(parts[1] || '0', 10) || 0;
    var v = parts[0].charAt(0) === 't' ? 'top' : 'bottom';
    var h = parts[0].charAt(1) === 'r' ? 'right' : 'left';
    a.style.cssText = pill.concat([
      'position:fixed', 'z-index:2147483000',
      v + ':max(' + (12 + off) + 'px, calc(env(safe-area-inset-' + v + ', 0px) + ' + (8 + off) + 'px))',
      h + ':max(12px, calc(env(safe-area-inset-' + h + ', 0px) + 8px))'
    ]).join(';');
    document.body.appendChild(a);
  }
  /* Bigger touch targets for small controls without changing how they look: grade chips are
     about 21px tall, under the 24px minimum for a fingertip. An invisible ::after extends the
     hit area. */
  (function () {
    var st = document.createElement('style');
    st.id = 'bones-touch';
    st.textContent = 'button.tier{position:relative}button.tier::after{content:"";position:absolute;inset:-6px -3px}';
    (document.head || document.documentElement).appendChild(st);
  })();

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addHome);
  else addHome();

  /* ---------- Evidence: a grade chip jumps to its claim's full evidence ----------
     Each page lists its graded claims in an evidence section (built with
     BONES.evidence.section). Tapping a grade chip scrolls to that claim's card instead of
     opening a drawer, and a "Back to where you were" button returns to the chip.
     A chip whose claim has no card on the page falls through to the page's own handler. */
  var REDUCE = false;
  try { REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* old browser */ }
  var EV_CSS = [
    '.bones-ev-list{display:grid;gap:14px;min-width:0}',
    '.bones-ev-intro{margin:0;color:var(--muted);max-width:62ch}',
    '.bones-ev-card{--tc:var(--muted);position:relative;display:grid;gap:10px;min-width:0;padding:16px 18px;',
    'border:1px solid var(--line);border-left:4px solid var(--tc);border-radius:var(--r-card,12px);',
    'background:var(--surface);scroll-margin-top:96px;scroll-margin-bottom:96px;outline:none}',
    '.bones-ev-card[data-t="1"]{--tc:var(--t1)}.bones-ev-card[data-t="2"]{--tc:var(--t2)}',
    '.bones-ev-card[data-t="3"]{--tc:var(--t3)}.bones-ev-card[data-t="4"]{--tc:var(--t4)}',
    '.bones-ev-card[data-t="5"]{--tc:var(--t5)}',
    '.bones-ev-card>*{margin:0}',
    '.bones-ev-grade{display:inline-flex;align-items:center;gap:8px;color:var(--tc);font-family:var(--f-ui);',
    'font-size:0.75rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase}',
    '.bones-ev-grade::before{content:"";width:9px;height:9px;border-radius:50%;background:currentColor}',
    '.bones-ev-claim{font-family:var(--f-read,inherit);font-size:1.05rem;line-height:1.45;font-weight:600;color:var(--fg);max-width:62ch}',
    '.bones-ev-rows{display:grid;grid-template-columns:minmax(0,9em) minmax(0,1fr);gap:6px 14px;font-size:0.9rem}',
    '.bones-ev-rows dt{color:var(--muted);font-family:var(--f-ui);font-size:0.75rem;letter-spacing:0.06em;text-transform:uppercase;padding-top:3px}',
    '.bones-ev-rows dd{margin:0;max-width:62ch}',
    '.bones-ev-src{margin:0;padding-left:1.3em;display:grid;gap:4px;font-size:0.85rem}',
    '.bones-ev-src a{color:inherit;text-underline-offset:3px;overflow-wrap:anywhere}',
    '.bones-ev-srclabel{color:var(--muted);font-family:var(--f-ui);font-size:0.75rem;letter-spacing:0.06em;text-transform:uppercase}',
    '@media (max-width:560px){.bones-ev-rows{grid-template-columns:minmax(0,1fr)}.bones-ev-rows dd{margin-bottom:6px}}',
    '.bones-ev-card.bones-ev-hit{animation:bones-ev-hit 1.8s ease-out}',
    '@keyframes bones-ev-hit{0%,35%{box-shadow:0 0 0 3px var(--tc)}100%{box-shadow:0 0 0 3px transparent}}',
    '.bones-ev-back{position:fixed;left:max(16px, calc(env(safe-area-inset-left, 0px) + 10px));z-index:2147482000;',
    'bottom:max(16px, calc(env(safe-area-inset-bottom, 0px) + 10px));padding:11px 16px;border-radius:999px;',
    'border:1px solid var(--line);background:var(--fg);color:var(--bg);cursor:pointer;',
    'font:600 0.8125rem/1 var(--f-ui, ui-monospace, monospace);letter-spacing:0.04em;white-space:nowrap;',
    'box-shadow:0 6px 24px rgba(0,0,0,0.22)}',
    '.bones-ev-back[hidden]{display:none}',
    '.bones-ev-back:focus-visible{outline:2px solid var(--accent);outline-offset:3px}',
    '.bones-ev-from{animation:bones-ev-hit 1.8s ease-out;--tc:var(--accent)}',
    '@media (prefers-reduced-motion: reduce){.bones-ev-card.bones-ev-hit,.bones-ev-from{animation:none;box-shadow:0 0 0 3px var(--tc)}}'
  ].join('');
  function evCSS() {
    if (document.getElementById('bones-ev-css')) return;
    var st = document.createElement('style');
    st.id = 'bones-ev-css';
    st.textContent = EV_CSS;
    (document.head || document.documentElement).appendChild(st);
  }
  function escH(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  /* item: { id, t, grade, claim, rows: [[label, text]], sources: [[label, url]] } */
  function evCard(it) {
    var rows = (it.rows || []).filter(function (r) { return r && r[1]; });
    var src = (it.sources || []).filter(function (s) { return s && s[0]; });
    return '<article class="bones-ev-card" data-ev="' + escH(it.id) + '" data-t="' + escH(it.t) + '" tabindex="-1" aria-label="Evidence: ' + escH(it.claim) + '">' +
      '<p class="bones-ev-grade">' + escH(it.grade) + '</p>' +
      '<p class="bones-ev-claim">' + escH(it.claim) + '</p>' +
      (rows.length ? '<dl class="bones-ev-rows">' + rows.map(function (r) {
        return '<dt>' + escH(r[0]) + '</dt><dd>' + escH(r[1]) + '</dd>';
      }).join('') + '</dl>' : '') +
      (src.length ? '<p class="bones-ev-srclabel">Sources</p><ol class="bones-ev-src">' + src.map(function (s) {
        return '<li>' + (s[1] ? '<a href="' + escH(s[1]) + '" target="_blank" rel="noopener">' + escH(s[0]) + '</a>' : escH(s[0])) + '</li>';
      }).join('') + '</ol>' : '') +
      '</article>';
  }
  /* opts: { cls, headCls, label, title, intro, items } -> HTML for a whole section */
  function evSection(opts) {
    evCSS();
    var head = opts.headCls == null ? 'col sec-head' : opts.headCls;
    return '<section class="' + escH(opts.cls == null ? 'sec wrap' : opts.cls) + ' bones-ev" aria-label="' + escH(opts.title || 'Evidence') + '">' +
      '<div class="' + escH(head) + '"><p class="label">' + escH(opts.label || 'The evidence') + '</p>' +
      '<h2>' + escH(opts.title || 'Every graded claim on this page') + '</h2>' +
      '<p class="bones-ev-intro">' + escH(opts.intro || 'Tap a grade anywhere on the page to jump to its claim here, with the reason for the grade and the sources behind it.') + '</p></div>' +
      '<div class="col bones-ev-list">' + opts.items.map(evCard).join('') + '</div></section>';
  }

  var back = null, backTo = null;
  function backBtn() {
    if (back) return back;
    evCSS();
    back = document.createElement('button');
    back.type = 'button';
    back.className = 'bones-ev-back';
    back.hidden = true;
    back.textContent = '↑ Back to where you were';
    back.addEventListener('click', function () {
      var el = backTo; hideBack();
      if (!el || !el.isConnected) return;
      el.scrollIntoView({ block: 'center', behavior: REDUCE ? 'auto' : 'smooth' });
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      el.classList.remove('bones-ev-from'); void el.offsetWidth; el.classList.add('bones-ev-from');
      setTimeout(function () { el.classList.remove('bones-ev-from'); }, 1900);
    });
    document.body.appendChild(back);
    return back;
  }
  function hideBack() { if (back) back.hidden = true; backTo = null; }
  function jump(card, from) {
    card.scrollIntoView({ block: 'start', behavior: REDUCE ? 'auto' : 'smooth' });
    try { card.focus({ preventScroll: true }); } catch (e) { card.focus(); }
    card.classList.remove('bones-ev-hit'); void card.offsetWidth; card.classList.add('bones-ev-hit');
    setTimeout(function () { card.classList.remove('bones-ev-hit'); }, 1900);
    if (from) { backTo = from; backBtn().hidden = false; }
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && back && !back.hidden) hideBack(); });
  window.addEventListener('hashchange', function () { setTimeout(function () { if (backTo && !backTo.isConnected) hideBack(); }, 50); });

  /* bind({ selector, id(el) -> claim id, scope(el) -> element to search, when() -> bool }) */
  var binds = [];
  function evBind(b) { binds.push(b); }
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    for (var i = 0; i < binds.length; i++) {
      var b = binds[i];
      var chip = t.closest(b.selector);
      if (!chip || chip.closest('.bones-ev, .drawer, [role="dialog"]')) continue;
      if (b.when && !b.when()) continue;
      var id = b.id(chip);
      if (!id) continue;
      var scope = (b.scope && b.scope(chip)) || document;
      var card = scope.querySelector('.bones-ev-card[data-ev="' + (window.CSS && CSS.escape ? CSS.escape(id) : id) + '"]');
      if (!card) continue;
      e.preventDefault();
      e.stopImmediatePropagation();
      jump(card, chip);
      return;
    }
  }, true);

  window.BONES = window.BONES || {};
  window.BONES.evidence = { section: evSection, card: evCard, bind: evBind, jump: jump, hideBack: hideBack };

  /* Offline support. Network first, so testers always get the newest version. */
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {});
    });
  }
})();
