"""Pack creator-provided embedded glTF into compact local GLBs; no downloaded code.
Input directory must contain the three pinned glTF files and publisher licenses.
"""
from pathlib import Path
import base64,copy,hashlib,json,struct,sys
ROOT=Path(__file__).resolve().parents[1]
SPECS={
 'courier':('1uxAFnDp73NO1c16LvHHjAYh1-deMNk5I','women','Individual Characters/glTF/Adventurer.gltf'),
 'guard':('1VGmU5f8a43NBT22JWB507NDSLbmNxzF9','men','Individual Characters/glTF/Swat.gltf'),
 'officer':('1NhXHnGU0zK9hBrT5FoZp8nTz_EmvTPg5','men','Individual Characters/glTF/Suit.gltf')}
KEEP={'Idle','Idle_Neutral','Idle_Gun_Pointing','Gun_Shoot','Run','Run_Shoot','Walk','Wave','Death','HitRecieve'}
sha=lambda x:hashlib.sha256(x).hexdigest()
def pack(data):
 j=json.loads(data);assert j['asset']['version']=='2.0' and not j.get('extensionsRequired')
 assert not j.get('images'),'Unexpected external image requirements'
 j['animations']=[a for a in j['animations'] if a['name'] in KEEP]
 assert {a['name']for a in j['animations']}==KEEP
 refs=[]
 for mesh in j['meshes']:
  for p in mesh['primitives']:
   refs.append((p,'indices'))
   refs.extend((p['attributes'],k)for k in p['attributes'])
   for target in p.get('targets',[]):refs.extend((target,k)for k in target)
 for skin in j['skins']:refs.append((skin,'inverseBindMatrices'))
 for a in j['animations']:
  for s in a['samplers']:refs.extend([(s,'input'),(s,'output')])
 used=sorted({o[k]for o,k in refs});mapping={old:i for i,old in enumerate(used)}
 for o,k in refs:o[k]=mapping[o[k]]
 accessors=[j['accessors'][i]for i in used];assert all('bufferView'in a and not a.get('sparse')for a in accessors)
 views=sorted({a['bufferView']for a in accessors});mapping={old:i for i,old in enumerate(views)}
 for a in accessors:a['bufferView']=mapping[a['bufferView']]
 buffers=[]
 for b in j['buffers']:
  assert b['uri'].startswith('data:application/octet-stream;base64,')
  raw=base64.b64decode(b['uri'].split(',',1)[1],validate=True);assert len(raw)==b['byteLength'];buffers.append(raw)
 binary=bytearray();newviews=[]
 for index in views:
  v=copy.deepcopy(j['bufferViews'][index]);raw=buffers[v['buffer']];start=v.get('byteOffset',0);size=v['byteLength'];assert start+size<=len(raw)
  binary.extend(b'\0'*(-len(binary)%4));v['byteOffset']=len(binary);v['buffer']=0;binary.extend(raw[start:start+size]);newviews.append(v)
 j['accessors']=accessors;j['bufferViews']=newviews;j['buffers']=[{'byteLength':len(binary)}]
 # Gentle roughness only. Preserve the creator's mesh, topology, skin and palette.
 for m in j['materials']:m.setdefault('pbrMetallicRoughness',{})['roughnessFactor']=.76
 j['asset']['extras']={'creator':'Quaternius','license':'CC0-1.0','adaptation':'Aether Reach Skyglass Cast: retained 10 animations, compacted binary buffers, roughness .76. No mesh topology changes.'}
 text=json.dumps(j,separators=(',',':'),ensure_ascii=True).encode();text+=b' '*(-len(text)%4);binary.extend(b'\0'*(-len(binary)%4))
 glb=struct.pack('<III',0x46546c67,2,28+len(text)+len(binary))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(binary),0x004e4942)+binary
 return bytes(glb),j
if __name__=='__main__':
 source=Path(sys.argv[1]);out=ROOT/'art/characters';out.mkdir(parents=True,exist_ok=True)
 pins=json.loads((ROOT/'tools/cast-source-pins.json').read_text());files=[]
 for name,(id,packname,member) in SPECS.items():
  data=(source/(name+'.gltf')).read_bytes();assert sha(data)==pins[name+'.gltf'],name+' publisher source changed'
  glb,j=pack(data);(out/(name+'.glb')).write_bytes(glb)
  files.append(dict(file=name+'.glb',role=name,bytes=len(glb),sha256=sha(glb),sourceId=packname,sourceFile=member,downloadId=id,sourceSha256=sha(data),triangles=sum(j['accessors'][p['indices']]['count']//3 for m in j['meshes']for p in m['primitives']),skins=len(j['skins']),animations=[a['name']for a in j['animations']]))
 for name in ['men','women']:
  data=(source/(name+'-license.txt')).read_bytes();assert sha(data)==pins[name+'-license.txt']
  (out/(name+'-license.txt')).write_bytes(data);files.append(dict(file=name+'-license.txt',bytes=len(data),sha256=sha(data),sourceId=name))
 manifest={'version':1,'creator':'Quaternius','license':'CC0-1.0','sources':[{'id':'men','creator':'Quaternius','title':'Ultimate Modular Characters','url':'https://quaternius.com/packs/ultimatemodularcharacters.html','folder':'https://drive.google.com/drive/folders/1USAAquX2JJWuA2m6zol0KUkFe3UkZ8zX','license':'CC0-1.0'},{'id':'women','creator':'Quaternius','title':'Ultimate Modular Women','url':'https://quaternius.com/packs/ultimatemodularwomen.html','folder':'https://drive.google.com/drive/folders/1720N9IGyQHXYvtvZJzazhxtTTlz-y2Vf','license':'CC0-1.0'}],'files':files,'totalBytes':sum(f['bytes']for f in files),'modifications':'Portable embedded GLB; retained 10 of 24 source animation clips; compacted referenced buffers; material roughness set to .76. Original meshes, skinning, animation keyframes and colors retained. Runtime scale, role accessories and clip blending are original game code. Publisher license text preserved verbatim, including the women download license header that says Males; both official pack pages separately specify CC0.'}
 (out/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(manifest,indent=2))
