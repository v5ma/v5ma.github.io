# Temporary scoped follow-up to the hash-verified source transport. Removed before release.
from pathlib import Path
import hashlib
P=Path('prism-current')
checks={'art.js':('3273498e46fcbd5bcbf541f0e64435dc6c07bb2a2147960dad6829353be55f2a','9289739ef37b93c093d44df42824f8fac41449132a8c9490e72eff95693bfabd'),'tests/spectral-browser.py':('7e44774b746c66e3e6905b0c955cb84d31bfcf68c9883607babff93ee1fa2715','781a9be3cbb94b26bf80808a3ffdb9aae41151d63983a5eb3802ab3341202e31')}
for name,(before,after) in checks.items():assert hashlib.sha256((P/name).read_bytes()).hexdigest()==before,name
f=P/'art.js';s=f.read_text().replace("const previewNotes=PrismCore.chart('first-light').notes;let quality", "let previewKey='',previewNotes=PrismCore.chart('first-light').notes;let quality")
s=s.replace("if(disposed)return;menuNow=menu;if(warming)", "if(disposed)return;menuNow=menu;if(menu){const game=scene.components?.['prism-game'],key=(game?.track||'first-light')+'/'+(game?.difficulty||'flow');if(key!==previewKey){previewKey=key;previewNotes=PrismCore.chart(game?.track||'first-light',game?.difficulty||'flow').notes;}}if(warming)")
s=s.replace("o.id=n.id;o.g.visible=true;", "o.id=n.id;o.dir=n.dir;o.g.visible=true;");f.write_text(s)
f=P/'tests/spectral-browser.py';s=f.read_text().replace("check(p.locator('#spectral-theme').input_value()=='abyss','The chosen atmosphere survives reload')", "check(p.locator('#spectral-theme').input_value()=='abyss','The chosen atmosphere survives reload')\n  p.locator('[data-track=\"first-light\"]').click();p.locator('#difficulty').select_option('flow')");f.write_text(s)
for name,(before,after) in checks.items():assert hashlib.sha256((P/name).read_bytes()).hexdigest()==after,name
print('Verified two source-polish results; the original 18-file path boundary remains.')
