#!/usr/bin/env node
/* Rebuilds the app icons: the white BONES mark on black.
   Run from the repo root: NODE_PATH=$(npm root -g) node tools/icons/make.js */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '../..');
const sym = fs.readFileSync(path.join(ROOT, 'tools/shared/mark.svg'), 'utf8');
const vb = sym.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
const inner = sym.replace(/^[\s\S]*?<symbol[^>]*>/, '').replace(/<\/symbol>\s*$/, '').replace(/currentColor/g, '#FFFFFF');
// size, how much of the square the mark fills
const ICONS = [['icon-192.png', 192, 0.66], ['icon-512.png', 512, 0.66], ['apple-touch-icon.png', 180, 0.66], ['icon-maskable-512.png', 512, 0.5]];
(async () => {
  const b = await chromium.launch();
  for (const [name, size, fill] of ICONS) {
    const p = await b.newPage({ viewport: { width: size, height: size } });
    const s = size * fill, scale = s / Math.max(vb[2], vb[3]);
    const w = vb[2] * scale, h = vb[3] * scale;
    await p.setContent(`<html><body style="margin:0;background:#000"><svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect width="${size}" height="${size}" fill="#000"/><svg x="${(size - w) / 2}" y="${(size - h) / 2}" width="${w}" height="${h}" viewBox="${vb.join(' ')}">${inner}</svg></svg></body></html>`);
    await p.screenshot({ path: path.join(ROOT, 'assets/icons', name), omitBackground: false });
    await p.close();
    console.log('wrote', name);
  }
  await b.close();
})();
