#!/usr/bin/env python3
"""Build a single self-contained HTML page from the repo, for hosts that take one file
(such as a Claude artifact). The repo stays the single source of truth.

Usage: python3 tools/build_artifact.py OUTPUT.html

Differences from the installable app:
- styles and scripts are inlined;
- fonts load from Google Fonts instead of the local fonts/ folder;
- the service worker, manifest and install script are left out.
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;800'
         '&family=IBM+Plex+Mono:wght@400;600&family=IBM+Plex+Sans:wght@400;500;600&display=swap">')
SKIP_SCRIPTS = {'pwa.js'}


def build() -> str:
    index = (ROOT / 'index.html').read_text()
    body = index.split('<body>', 1)[1].split('</body>', 1)[0]
    scripts = re.findall(r'<script src="([^"]+)"></script>', body)
    markup = re.sub(r'\s*<script src="[^"]+"></script>', '', body).strip()
    css = (ROOT / 'styles.css').read_text()
    js = '\n'.join(f'/* ===== {s} ===== */\n' + (ROOT / s).read_text()
                   for s in scripts if s not in SKIP_SCRIPTS)
    if '</script' in js:
        raise SystemExit('a script contains "</script", which would break inlining')
    return ('<title>Harp Bench</title>\n'
            '<meta name="claude:viewport-fit-sides" content="cover">\n'
            f'{FONTS}\n<style>\n{css}\n</style>\n\n{markup}\n\n<script>\n{js}\n</script>\n')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit(__doc__)
    out = pathlib.Path(sys.argv[1])
    out.write_text(build())
    print(f'wrote {out} ({out.stat().st_size // 1024} KB)')
