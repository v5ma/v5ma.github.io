"""Finish only the connected-world changes; retain existing gameplay and saves.
Run before native acceptance. This does not merge or publish an unverified build.
"""
from pathlib import Path
import subprocess

root = Path(__file__).resolve().parents[1]
game = root / 'mario-maker-clone/svgn-paper-route'

# Sharp corners may have dot products a fraction above 1 through floating-point
# rounding. Keep the intended bounded miter rather than accepting sub-unit values.
p = game / 'sky-network-art.js'
s = p.read_text()
s = s.replace(
    'miter=Math.min(1.65,1/Math.max(.35,(dx*ux+dy*uy)/(l*ul)));',
    'miter=Math.max(1,Math.min(1.65,1/Math.max(.35,(dx*ux+dy*uy)/(l*ul))));'
)
p.write_text(s)

# Make subsequent preparations safe after the one-off transport was removed.
p = root / '.github/workflows/sky-network.yml'
s = p.read_text()
s = s.replace('          git add -u -- .network-transfer',
              '          if git ls-files .network-transfer | grep -q .; then git add -u -- .network-transfer; fi')
s = s.replace('      - run: python scripts/integrate-sky-network.py',
              '      - run: |\n          python scripts/finish-connected-world.py\n          python scripts/integrate-sky-network.py')
s = s.replace('      - uses: actions/download-artifact@v4\n        with:',
              '      - uses: actions/download-artifact@v4\n        continue-on-error: true\n        with:')
# Actual transport is no longer needed and must not cause a failing parallel run.
obsolete = root / '.github/workflows/network-source-recovery.yml'
if obsolete.exists():
    obsolete.unlink()
# Commit the complete scoped integration rather than leaving its fix untracked.
old = '          git add -- mario-maker-clone/svgn-paper-route/index.html'
new = ('          git add -- mario-maker-clone/svgn-paper-route/sky-network-art.js '
       '.github/workflows/sky-network.yml\n'
       '          if git ls-files .github/workflows/network-source-recovery.yml | grep -q .; then git add -u -- .github/workflows/network-source-recovery.yml; fi\n'
       '          git add -- mario-maker-clone/svgn-paper-route/index.html')
if 'git add -- mario-maker-clone/svgn-paper-route/sky-network-art.js' not in s:
    s = s.replace(old, new)
p.write_text(s)

print('Connected-world source is ready for repeatable native acceptance.')
