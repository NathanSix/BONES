#!/usr/bin/env python3
"""Assemble move/index.html from the shared shell and the Move sources.
Run from the repo root: python3 tools/move/build.py"""
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[2]
T = ROOT / 'tools'
rd = lambda p: (T / p).read_text(encoding='utf-8')

# Head: the same twelve lines every BONES page starts with (taken from Fuel so they stay in sync)
head = (ROOT / 'fuel' / 'index.html').read_text(encoding='utf-8').split('\n')[:12]
head = '\n'.join(head)

G = '<symbol id="{id}" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">{d}</g></symbol>'
GLYPHS = {
    # 01 how little: a curve that dips and flattens
    'g-curve': '<path d="M3 4v17h18"/><path d="M5 7c2 6 4 8 7 8s5-.5 8-1"/><circle cx="11" cy="15" r="1.4" fill="currentColor"/>',
    # 02 load: a long bone
    'g-bone': '<path d="M8.5 6.5 17.5 15.5"/><path d="M8.5 6.5a2.2 2.2 0 1 0-3-.9 2.2 2.2 0 1 0 .9 3l2.1-2.1zM15.5 17.5a2.2 2.2 0 1 0 3 .9 2.2 2.2 0 1 0-.9-3l-2.1 2.1z"/>',
    # 03 lifts: a barbell
    'g-bar': '<path d="M2.5 12h19"/><rect x="5" y="7" width="3" height="10" rx="1"/><rect x="16" y="7" width="3" height="10" rx="1"/>',
    # 04 walk: footprints
    'g-steps': '<path d="M7 4c2 0 2.6 2 2.6 4.5S8.8 13 7.4 13 5 11 5 8.5 5.4 4 7 4zM6 15.5h3v1.5a1.5 1.5 0 0 1-3 0z"/><path d="M16.6 8c1.6 0 2.4 2.5 2.4 5s-.8 4.5-2.2 4.5S14.4 15.5 14.4 13 15 8 16.6 8zM15 19.5h3v.5a1.5 1.5 0 0 1-3 0z"/>',
    # 05 range: an arc of motion around a joint
    'g-range': '<circle cx="6" cy="18" r="1.6"/><path d="M6 18 19 18"/><path d="M6 18 15 7.5"/><path d="M14 18a8 8 0 0 0-2.8-6.1" stroke-dasharray="1.5 2.2"/>',
}
sprite = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
          + rd('shared/mark.svg').strip() + rd('shared/arrow.svg').strip()
          + ''.join(G.format(id=k, d=v) for k, v in GLYPHS.items()) + '</defs></svg>')

out = '\n'.join([
    head,
    '<title>BONES Move</title>',
    '<meta name="description" content="How little exercise you need, why bones want weight, four lifts from no equipment to a barbell, walking and mobility, with every claim graded by evidence.">',
    rd('shared/fonts.html').strip(),
    '<style id="move-style">\n' + rd('shared/shell.css') + '\n' + rd('move/style.css') + '\n</style>',
    sprite,
    rd('move/body.html').strip(),
    '<script>\n' + rd('move/claims.js') + '\n' + rd('move/app.js') + '\n</script>',
    '',
    '</body></html>',
])
assert '—' not in out.split('<style id="move-style">')[1], 'em dash found'
dst = ROOT / 'move' / 'index.html'
dst.parent.mkdir(exist_ok=True)
dst.write_text(out, encoding='utf-8')
print('wrote', dst, len(out), 'bytes')
