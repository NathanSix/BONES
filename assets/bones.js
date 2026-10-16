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
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addHome);
  else addHome();

  /* Offline support. Network first, so testers always get the newest version. */
  var local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || local)) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(root + 'sw.js', { scope: root }).catch(function () {});
    });
  }
})();
