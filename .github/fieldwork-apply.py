from pathlib import Path
import base64, hashlib, json, zlib
parts=[Path('.github/fieldwork.part'+str(i)) for i in range(3)]
encoded=''.join(p.read_text().strip() for p in parts)
# Repair two transmission typos; the complete original payload hash is mandatory.
encoded=encoded.replace('J8TujLMv9','J8ujLMv9').replace('CziU1Uyk1','Czi1Uyk1')
raw=zlib.decompress(base64.b64decode(encoded))
sha=lambda b:hashlib.sha256(b).hexdigest()
assert sha(raw)=='738cc87a505ca5d5b94ae5411b1d1ab746bea9cc3c091769dd9dc39509456278'
pending=[]
for r in json.loads(raw):
 p=Path(r['path']);assert p.parts[0]=='vesperfall' and '..' not in p.parts
 old=p.read_bytes() if p.exists() else None
 if old is not None and sha(old)==r['new']:continue
 assert (sha(old) if old is not None else None)==r['old'],str(p)
 if 'text' in r:s=r['text']
 else:
  s=old.decode()
  for start,n,text in reversed(r['edits']):s=s[:start]+text+s[start+n:]
 data=s.encode();assert sha(data)==r['new'],str(p);pending.append((p,data))
for p,data in pending:p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
# The diagnostic native run 35395153330 found a rendering/audio-only flag on
# live hostile bolts. Do not weaken restore validation or serialize this cue.
p=Path('vesperfall/pilgrim-save.js');s=p.read_text()
a="  if(s.oath)state.oath=copy(s.oath);"
b="  // Near-miss audio bookkeeping is transient, not expedition physics.\n  state.bolts=state.bolts.map(({soundPassed,...bolt})=>bolt);\n"+a
if b not in s:assert s.count(a)==1;s=s.replace(a,b);p.write_text(s)
p=Path('vesperfall/tests/fieldwork-save.test.cjs')
p.write_text("""/* Explicit audio-state unit fixture; not an end-to-end actor-state shortcut. */
'use strict';
const test=require('node:test'),a=require('node:assert/strict'),C=require('../core.js'),S=require('../pilgrim-save.js');
test('Near-miss audio metadata cannot prevent saving live enemy projectiles',()=>{
 const s=C.create('BELL-01',2,{pilgrimage:{stage:1,tier:0}});
 const bolt={p:[0,1.65,2],v:[0,0,-4],life:1,kind:'cantor',soundPassed:true};
 s.bolts.push(bolt);
 const cp=S.capture(s,{id:'audio-contract-fixture',banked:0,receipt:{},yaw:0,pitch:0,focus:1});
 a.equal(bolt.soundPassed,true);a.equal(Object.hasOwn(cp.state.bolts[0],'soundPassed'),false);
 const restored=S.restore(cp).game;
 for(const k of['p','v','life','kind'])a.deepEqual(restored.bolts[0][k],bolt[k]);
 cp.state.bolts[0].unexpectedGameplayField=true;
 a.throws(()=>S.restore(cp),/Unrecognized save field/);
});
""")
p=Path('vesperfall/FIELDWORK.md');s=p.read_text();a='Read the final evidence receipt for the diagnosed cause and the outcome of the repair, not this candidate-era description.';b='The strict native diagnostic identified an audio-only soundPassed flag on hostile bolts as the rejection. Capture now strips exactly that transient cue while preserving projectile physics and strict unknown-field validation. A focused regression reproduces the condition. Read the final receipt for native/public outcomes.'
if a in s:p.write_text(s.replace(a,b))
print('Applied exact Fieldwork source, transient-audio save repair and regression.')
