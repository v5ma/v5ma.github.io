"""Repack three CC0 glTFs as bounded standalone GLBs, without external resources.
Inputs must match the reviewed official-author data. No Blender/Python payloads
from downloaded assets are executed. This script only parses JSON/binary data.
"""
import base64,copy,hashlib,json,struct,sys
from pathlib import Path
SOURCES={
 'guard':('1VGmU5f8a43NBT22JWB507NDSLbmNxzF9','622b3f36fcac90539ef8f7121ec1f11b5e1ae603a085019b3fa96eba20dddfd3','Ultimate Modular Characters','Swat.gltf'),
 'worker':('14d8n7IDnnlnGt_uiATnNg3uvi_4dyd9V','e49f8ec0f8a7de72dd26b1c01e6413c9a87a9116eeee21f9364ccd36bc286335','Ultimate Modular Characters','Worker.gltf'),
 'courier':('1uxAFnDp73NO1c16LvHHjAYh1-deMNk5I','65094211e53b49f6a834c617cc056834686fe794a0b515a6b97faa3e1130cc95','Ultimate Modular Women','Adventurer.gltf')}
CLIPS=['Idle','Idle_Gun_Pointing','Idle_Gun_Shoot','Walk','Run','Run_Shoot','HitRecieve','Death','Wave','Interact']
sha=lambda b:hashlib.sha256(b).hexdigest()
def repack(raw):
 j=json.loads(raw);assert j['asset']['version']=='2.0' and not j.get('extensionsRequired')
 assert not j.get('images') and not j.get('textures'), 'Only reviewed solid-material characters are accepted'
 j['animations']=[a for a in j['animations'] if a['name'] in CLIPS]
 assert {a['name'] for a in j['animations']}==set(CLIPS)
 # Retain only referenced accessors and buffer views; their actual byte layouts stay unchanged.
 used=set()
 for mesh in j['meshes']:
  for p in mesh['primitives']:
   used.update(p['attributes'].values());used.add(p['indices']);assert not p.get('targets')
 for s in j['skins']:used.add(s['inverseBindMatrices'])
 for a in j['animations']:
  for s in a['samplers']:used.update([s['input'],s['output']])
 amap={v:i for i,v in enumerate(sorted(used))}
 for mesh in j['meshes']:
  for p in mesh['primitives']:p['attributes']={k:amap[v] for k,v in p['attributes'].items()};p['indices']=amap[p['indices']]
 for s in j['skins']:s['inverseBindMatrices']=amap[s['inverseBindMatrices']]
 for a in j['animations']:
  for s in a['samplers']:s['input']=amap[s['input']];s['output']=amap[s['output']]
 j['accessors']=[j['accessors'][v] for v in sorted(used)]
 assert all('sparse' not in a for a in j['accessors'])
 views=sorted({a['bufferView'] for a in j['accessors']});vmap={v:i for i,v in enumerate(views)}
 buffers=[]
 for b in j['buffers']:
  assert b['uri'].startswith('data:application/octet-stream;base64,')
  data=base64.b64decode(b['uri'].split(',',1)[1],validate=True);assert len(data)==b['byteLength'];buffers.append(data)
 binary=bytearray();outviews=[]
 for index in views:
  v=copy.deepcopy(j['bufferViews'][index]);src=buffers[v['buffer']];offset=v.get('byteOffset',0);length=v['byteLength'];assert offset>=0 and offset+length<=len(src)
  binary+=b'\x00'*((-len(binary))%4);v['byteOffset']=len(binary);binary+=src[offset:offset+length];v['buffer']=0;outviews.append(v)
 for a in j['accessors']:a['bufferView']=vmap[a['bufferView']]
 j['bufferViews']=outviews;j['buffers']=[{'byteLength':len(binary)}]
 j['asset']['copyright']='Quaternius / CC0 1.0. Repacked for Aether Reach; source metadata in manifest.json.'
 jb=json.dumps(j,separators=(',',':'),ensure_ascii=True).encode();jb+=b' '*((-len(jb))%4);binary+=b'\x00'*((-len(binary))%4)
 out=struct.pack('<4sII',b'glTF',2,12+8+len(jb)+8+len(binary))+struct.pack('<I4s',len(jb),b'JSON')+jb+struct.pack('<I4s',len(binary),b'BIN\x00')+binary
 return bytes(out),j

def main(src,dst):
 dst.mkdir(parents=True,exist_ok=True);files=[]
 for name,(id,digest,pack,original) in SOURCES.items():
  raw=(src/(name+'.gltf')).read_bytes();assert sha(raw)==digest,name+' source digest mismatch'
  data,j=repack(raw);(dst/(name+'.glb')).write_bytes(data)
  tri=sum(j['accessors'][p['indices']]['count']//3 for m in j['meshes'] for p in m['primitives'])
  files.append(dict(file=name+'.glb',role=name,creator='Quaternius',pack=pack,original=original,license='CC0-1.0',source='https://drive.google.com/uc?id='+id,sourceSha256=digest,sha256=sha(data),bytes=len(data),triangles=tri,animations=[a['name'] for a in j['animations']]))
 for name in ['men-license.txt','women-license.txt']:
  raw=(src/name).read_bytes();assert sha(raw)=='e8dbf915a2b82229913e301a0787696611241bdefec4832bc084f54161db1efe';(dst/name).write_bytes(raw)
 manifest=dict(version=1,revision='aurora-cast-1',sources=['https://quaternius.com/packs/ultimatemodularcharacters.html','https://quaternius.com/packs/ultimatemodularwomen.html'],licenseURL='https://creativecommons.org/publicdomain/zero/1.0/',licenseNote='Both public folders ship the same original License.txt headed Ultimate Modular Males; both official pack pages independently designate their assets CC0. Original license files retained unchanged.',modifications='Repacked embedded glTF as GLB, retained ten relevant authored clips and only referenced binary views. No mesh simplification, third-party texture, engine shader or retargeted animation. Costume color treatment is runtime code.',files=files)
 (dst/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n');print(json.dumps(files,indent=2))
if __name__=='__main__':main(Path(sys.argv[1]),Path(sys.argv[2]))
