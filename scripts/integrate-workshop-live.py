"""Idempotent integration of readable editor source into the owned live game.
No account/workflow permissions or unrelated project files are changed.
"""
from pathlib import Path
import re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
GAME=ROOT/'mario-maker-clone/svgn-paper-route'
required=['workshop-core.js','route-workshop.js','workshop.css','workshop-input.js']
assert all((GAME/n).exists() for n in required),'Required editor source is missing'
assert not (ROOT/'.workshop-incoming').exists(),'Temporary transfer files must not be published'
p=GAME/'index.html';s=p.read_text()
if 'src="./workshop-input.js"' not in s:
    s=s.replace('</head>','<link rel="stylesheet" href="./workshop.css">\n<script src="./workshop-input.js"></script>\n</head>',1)
    s=s.replace('</body>','<script src="./workshop-core.js"></script>\n<script src="./route-workshop.js"></script>\n</body>')
    s=s.replace('window.__BUILD=1788651001;', 'window.__BUILD=1788655001;')
# The legacy encoder receives Workshop levels too. Passing hundreds of
# thousands of RLE bytes as arguments fails before the level can be saved.
old="  return b64e(meta)+'.'+btoa(String.fromCharCode(...rle));"
new="""  // Bound argument count for large, densely edited maps.
  let encodedTiles='';
  for(let i=0;i<rle.length;i+=16000)encodedTiles+=String.fromCharCode(...rle.slice(i,i+16000));
  return b64e(meta)+'.'+btoa(encodedTiles);"""
assert old in s or new in s,'Unexpected native encoder; review before changing it'
s=s.replace(old,new,1)
p.write_text(s,newline='\r\n')
p=GAME/'sky-network-runtime.js';s=p.read_text().replace('Math.min(...ext.map(p=>p[1]))-90','(ext.length?Math.min(...ext.map(p=>p[1])):ground-600)-90');p.write_text(s)
p=GAME/'sw.js';s=re.sub(r"const CACHE = '[^']+';", "const CACHE = 'svgn-paper-route-workshop-live-20260905';",p.read_text());p.write_text(s)
subprocess.run([sys.executable,str(ROOT/'scripts/polish-workshop-live.py')],check=True)
p=ROOT/'tests/workshop_live.test.cjs';s=p.read_text()
if 'Native levelCode handles a maximal high-entropy Workshop map' not in s:
    s+='''
// Run the real native serializer from the shipped HTML, not a reimplementation.
function nativeLevelEncoderFixture(w,h,tiles,name){
 const fs=require('node:fs'),vm=require('node:vm');
 const html=fs.readFileSync(__dirname+'/../mario-maker-clone/svgn-paper-route/index.html','utf8');
 const a=html.indexOf('function levelCode(){'),b=html.indexOf('\\nfunction loadCode(',a);
 if(a<0||b<a)throw Error('Native encoder was not found');
 const ctx={grid:tiles,LW:w,LH:h,nameEl:{value:name},physName:'platform',themeName:'dawn',musicName:'morning',customTracks:[],btoa,b64e:s=>btoa(unescape(encodeURIComponent(s)))};
 vm.createContext(ctx);vm.runInContext(html.slice(a,b),ctx);
 const [meta,body]=ctx.levelCode().split('.'),raw=atob(body),out=[];
 for(let i=0;i<raw.length;i+=2)for(let j=0;j<raw.charCodeAt(i+1);j++)out.push(raw.charCodeAt(i));
 return {meta:JSON.parse(decodeURIComponent(escape(atob(meta)))),tiles:out};
}
test('Native levelCode handles a maximal high-entropy Workshop map',()=>{
 const tiles=Uint8Array.from({length:640*280},(_,i)=>i%2?2:1);
 const out=nativeLevelEncoderFixture(640,280,tiles,'Large map');
 assert.deepEqual(out.tiles,Array.from(tiles));assert.equal(out.meta.w,640);assert.equal(out.meta.h,280);
});
test('Native save chunking retains RLE boundaries and UTF-8 metadata',()=>{
 const tiles=new Uint8Array(96*68);tiles.fill(1,255,512);tiles[89]=15;tiles[900]=8;
 const out=nativeLevelEncoderFixture(96,68,tiles,'Route \\u00e9tendue');
 assert.deepEqual(out.tiles,Array.from(tiles));assert.equal(out.meta.n,'Route \\u00e9tendue');
});
'''
    p.write_text(s)
print('Readable Workshop integrated; native large-map saves retain the original file format.')
