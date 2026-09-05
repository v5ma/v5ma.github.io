"""Strengthen preview save-isolation evidence without changing the application."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'tests/workshop_browser.py';s=p.read_text()
if 'A real collected envelope changes test coins before restoration' not in s:
    marker="            page.locator('#maker-tiles [data-tile=\"43\"]').click();click_world(page,12*36+18,59*36+18)"
    assert marker in s
    s=s.replace(marker,"            page.locator('#maker-tiles [data-tile=\"5\"]').click();click_world(page,10*36+18,59*36+18)\n"+marker)
    marker="            check(page.evaluate('player.shield'),'The shield placed through the editor is collected by the real rider')"
    assert marker in s
    s=s.replace(marker,marker+"\n            check(page.evaluate('credits')>credits,'A real collected envelope changes test coins before restoration')")
    p.write_text(s)
print('Preview isolation is tested after an actual coin pickup, not a trivial unchanged balance.')
