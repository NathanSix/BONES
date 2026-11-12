#!/usr/bin/env python3
"""Writes each page's title, description and link-preview tags from tools/share/pages.json.
Run from the repo root: python3 tools/share/meta.py
The tags sit on one line between <!-- share --> and <!-- /share --> so this can be rerun safely.
Move is built by tools/move/build.py, which calls block() itself."""
import html, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[2]
BASE = 'https://nathansix.github.io/BONES/'
PAGES = json.loads((ROOT / 'tools' / 'share' / 'pages.json').read_text(encoding='utf-8'))
BY_ID = {p['id']: p for p in PAGES}
SHARE_RE = re.compile(r'<!-- share -->.*?<!-- /share -->\n?')


def block(p):
    a = lambda s: html.escape(s, quote=True)
    url, img = BASE + p['path'], BASE + 'assets/share/' + p['id'] + '.png'
    tags = [
        f'<meta name="description" content="{a(p["desc"])}">',
        '<meta property="og:site_name" content="BONES">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{a(p["title"])}">',
        f'<meta property="og:description" content="{a(p["desc"])}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:image" content="{img}">',
        '<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">',
        f'<meta property="og:image:alt" content="{a(p["share"])}, from BONES">',
        '<meta name="twitter:card" content="summary_large_image">',
    ]
    return '<!-- share -->' + ''.join(tags) + '<!-- /share -->\n'


def apply(s, p):
    s = SHARE_RE.sub('', s)
    s = re.sub(r'<meta name="description" content="[^"]*">\n?', '', s)
    s = re.sub(r'<title>[^<]*</title>', '<title>' + html.escape(p['title'], quote=False) + '</title>', s, count=1)
    m = re.search(r'<meta name="robots"[^>]*>\n?', s) or re.search(r'<meta charset[^>]*>\n?', s, re.I) or re.search(r'<head>\n?', s)
    nl = '' if m.group(0).endswith('\n') else '\n'
    return s[:m.end()] + nl + block(p) + s[m.end():]


if __name__ == '__main__':
    for p in PAGES:
        if p['id'] == 'move':
            continue
        f = ROOT / p['path'] / 'index.html'
        f.write_text(apply(f.read_text(encoding='utf-8'), p), encoding='utf-8')
        print('updated', f.relative_to(ROOT))
