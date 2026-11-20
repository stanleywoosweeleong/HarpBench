#!/usr/bin/env python3
"""Redraw the QR code in index.html (between the qr:start and qr:end comments) for the app's public address.
Run it again if the address ever changes. Needs: pip install qrcode

Usage: python3 tools/build_qr.py [URL]
"""
import pathlib
import re
import sys

import qrcode

ROOT = pathlib.Path(__file__).resolve().parent.parent
URL = 'https://stanleywoosweeleong.github.io/HarpBench/'
QUIET = 4  # modules of white margin the QR standard asks for


def svg(url: str) -> str:
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=0)
    qr.add_data(url)
    qr.make(fit=True)
    rows = qr.get_matrix()
    size = len(rows) + 2 * QUIET
    d = []
    for y, row in enumerate(rows):
        x = 0
        while x < len(row):
            if row[x]:
                run = x
                while run < len(row) and row[run]:
                    run += 1
                d.append(f'M{x + QUIET} {y + QUIET}h{run - x}v1h-{run - x}z')
                x = run
            else:
                x += 1
    return (f'<svg class="qr" viewBox="0 0 {size} {size}" role="img" aria-label="QR code that opens Harp Bench" shape-rendering="crispEdges">'
            f'<rect width="{size}" height="{size}" fill="#fff"/><path fill="#000" d="{"".join(d)}"/></svg>')


if __name__ == '__main__':
    url = sys.argv[1] if len(sys.argv) > 1 else URL
    page = ROOT / 'index.html'
    html, n = re.subn(r'(<!-- qr:start -->).*?(<!-- qr:end -->)', lambda m: m.group(1) + svg(url) + m.group(2),
                      page.read_text(), flags=re.S)
    if n != 1:
        raise SystemExit('index.html needs exactly one <!-- qr:start --><!-- qr:end --> pair')
    page.write_text(html)
    print(f'QR code for {url} written to index.html')
