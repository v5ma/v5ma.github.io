# Temporary source transport for explicit legacy-entry regression paths only.
# Removed before release. These guarded edits do not relax gameplay assertions.
from pathlib import Path
import hashlib,json
E={
'spectral-browser.py':('4622b0bf5b3732ce983545d738a47cad4e23d2865a7fa04fc9853279a720bc00','09f2bcf6cf1cd653fd95616c7904ec105d636baf4bb034d8207d80e986fde85e'),
'undertow.test.cjs':('346411dc19ce1a7b62646c20effde181e3a559903d20e8b7f40687427766fdf6','96dd9e4546ae77da67878f8439f87df41efae9fdc748714b92c883918900dc02'),
'browser.py':('94f94368722bf0966ab305d7ad8d98f49dc92f8e7b29f499ca5864bfe4d1f9b1','00e1fa89959a5f086976147cd94dca18b30a72294e8370a4042b1547ae143d27'),
'practice-browser.py':('c1972b66679b4ee04f0eee16bcf9157159e2d8c3bfbffeeac933341bdeb2ae6a','d93441be3847c186ba02662a229535c8082c31fd5a4bfbf0208e24a1e5de0ac6'),
'pointer.py':('847176fe906ac5b70791d134608a5f4606e6bf0bfd0a52689c7e9e8374044259','98806ef9ac6170c8d06fa492c393040d0b86fbd7d14ec8695afb6bb375eac86d'),
'undertow-browser.py':('ebe1acee05fc957abcfcd728989478f8047b372f2982e60291fa67373220485d','88ca605cbee57ae51d84f504aef84d4958b522b0212560f97b2eb830d98dc962'),
'verify.py':('8219be7745d1e5186bb99b4247eb68d31036ea4f58b60a77fdbd80b40a9caedc','7f04dff787e36f8923a2a813836ecbc08f8e5255b00985745e7a35d65c9aa5b7'),
'tidal-browser.py':('fcdb0c17d8fda747149fd68d4db89d637f95c3964956f292462ed5b84ffd92f9','7c3a15a84d8dd738272750fb983efb15be648f33174b778cbd37bf2662795905'),
'lessons-browser.py':('76e9fcc81003a457eae1d44e24bf67aad08caedb199174cfa9f821522373385d','4289ccd133b4e3054aec25dcee05a1d5029b4aeee0c10761e2dfc568eda162e0'),
'jewel-browser.py':('ff94a5513f242a6fc5593cb15de78760567871ca2dafc99058ab0a2553cbb2c3','9fbd0d8871372c95e7a2a49520453ac613f1b834c42f4cfb34796dcd8a773119'),
'control-browser.py':('2d8838f9dd39c6bcf33178421cdd1862249d30e7cb5571252f0520a07a43aaae','0ee5444ce3c5cb195975c54f0b11888359f8badf5ad732edcddddbb06c73f8be')}
p=Path('prism-current/tests');changed=[]
for name,(before,after) in E.items():
 f=p/name;current=hashlib.sha256(f.read_bytes()).hexdigest()
 if current==after:continue
 assert current==before,'Stale test source: '+name
 s=f.read_text().replace("'prism-current/release.json'","'prism-current/rhythm-release.json'")
 if name in ['control-browser.py','lessons-browser.py','practice-browser.py','spectral-browser.py','tidal-browser.py','undertow-browser.py']:
  lines=s.splitlines();i=next(i for i,l in enumerate(lines) if l.startswith('URL='));lines.insert(i+1,"URL=URL.rstrip('/').removesuffix('/index.html').removesuffix('/rhythm.html')+'/rhythm.html'  # Preserve legacy entry; River has its own main-entry suite.");s='\n'.join(lines)+'\n'
 if name in ['browser.py','pointer.py','jewel-browser.py']:s=s.replace("BASE+'/prism-current/'","BASE+'/prism-current/rhythm.html'")
 if name=='browser.py':s=s.replace("page.locator('a#prism-launch').click()","page.locator('a#prism-launch').click();page.locator('#classic').click()").replace("page.url.endswith('/prism-current/index.html')","page.url.endswith('/prism-current/rhythm.html')")
 if name=='undertow.test.cjs':s=s.replace("path.join(base,'index.html')","path.join(base,'rhythm.html')")
 if name=='verify.py':s=s.replace("files += [str(p.relative_to(ROOT)) for p in (APP/'water-mission')","files += [str(p.relative_to(ROOT)) for p in (APP/'river').glob('*') if p.is_file()]\nfiles += [str(p.relative_to(ROOT)) for p in (APP/'water-mission')")
 assert hashlib.sha256(s.encode()).hexdigest()==after,'Unexpected patch output: '+name
 f.write_text(s);changed.append(str(f))
Path('/tmp/river-patched-paths.json').write_text(json.dumps(changed))
print('Hash-verified retained-entry edits:',len(changed))
