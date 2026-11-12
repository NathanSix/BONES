// Builds the link-preview pictures in assets/share/, one per page, from pages.json.
// Run from the repo root: node tools/share/make.js
// Needs Playwright (npm i playwright). Set CHROME to a Chromium path if Playwright has none of its own.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.join(ROOT, 'assets', 'share');
const pages = JSON.parse(fs.readFileSync(path.join(__dirname, 'pages.json'), 'utf8'));
const mark = fs.readFileSync(path.join(ROOT, 'tools', 'shared', 'mark.svg'), 'utf8');
const vb = mark.match(/viewBox="([^"]+)"/)[1];
const d = mark.match(/ d="([^"]+)"/)[1];
const font = (f) => 'file://' + path.join(ROOT, 'assets', 'fonts', f);
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const COLORS = {
  paper: { bg: '#ECE9E2', fg: '#1C1B18', muted: '#5f5a50', line: '#D2CDC2', accent: '#2E4C6E' },
  black: { bg: '#000000', fg: '#ECE8E1', muted: '#A59F94', line: '#2b2924', accent: '#9DBBDD' },
};

function html(p) {
  const c = COLORS[p.realm];
  const long = p.share.length > 9;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"Bones Display";src:url(${font('32fab23d11.woff2')})}
@font-face{font-family:"Overpass Mono";font-weight:600;src:url(${font('28a8fa2102.woff2')})}
@font-face{font-family:"Atkinson Hyperlegible";font-weight:400;src:url(${font('atkinson-400.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:${c.bg};color:${c.fg};padding:64px 72px;display:flex;flex-direction:column;position:relative;overflow:hidden}
.top{display:flex;align-items:center;gap:18px}
.top svg{width:52px;height:52px}
.word{font:44px/1 "Bones Display";letter-spacing:.16em}
.label{margin-top:auto;font:600 22px/1 "Overpass Mono";letter-spacing:.14em;text-transform:uppercase;color:${c.muted}}
h1{font:400 ${long ? 82 : 112}px/1.02 "Bones Display";letter-spacing:.03em;text-transform:uppercase;margin-top:22px;max-width:1056px}
p{font:400 28px/1.4 "Atkinson Hyperlegible";color:${c.muted};margin-top:26px;max-width:980px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.rule{position:absolute;left:72px;right:72px;bottom:40px;height:3px;background:linear-gradient(90deg,${c.accent} 0 120px,${c.line} 120px)}
.ghost{position:absolute;right:-90px;top:-70px;width:520px;height:520px;color:${c.fg};opacity:${p.realm === 'paper' ? 0.06 : 0.09}}
</style></head><body>
<svg class="ghost" viewBox="${vb}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg>
<div class="top"><svg viewBox="${vb}"><path fill="currentColor" fill-rule="evenodd" d="${d}"/></svg><span class="word">BONES</span></div>
<div class="label">${esc(p.label)}</div>
<h1>${esc(p.share)}</h1>
<p>${esc(p.desc)}</p>
<div class="rule"></div>
</body></html>`;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  for (const p of pages) {
    // A real file, so the page may load the site's font files from disk.
    const tmp = path.join(__dirname, '.render.html');
    fs.writeFileSync(tmp, html(p));
    await page.goto('file://' + tmp, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(OUT, p.id + '.png') });
    console.log('wrote assets/share/' + p.id + '.png');
  }
  fs.rmSync(path.join(__dirname, '.render.html'), { force: true });
  await browser.close();
})();
