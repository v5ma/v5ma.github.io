"""Reproducible CC0 skeleton intake. Downloads verified public source into an
output directory; never writes GitHub, modifies a game, or executes asset code.
Run: python vesperfall/tools/import-kaykit.py --output test-output/kaykit
"""
from pathlib import Path
import argparse, hashlib, json, struct, urllib.request, gzip, base64, copy
REV='15b62b9bad122f72926c10fb14d622c73819fa54'
BASE='https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0/'+REV+'/'
MODELS={'Skeleton_Minion':'3b7e7ee4f1c8dd6dd99ddad27824ef1dc52ff12d','Skeleton_Mage':'5f85aea26b4f33b88080d6eb57d25d1ae5d84d14','Skeleton_Rogue':'182403932e4d4e00aa4182f2ac882ac27326dd19','Skeleton_Warrior':'769e85c9e4cee8d1bd0952ddb3e9d26293144581'}
def download(path,expected):
 with urllib.request.urlopen(urllib.request.Request(BASE+path,headers={'User-Agent':'Vesperfall-CC0-asset-intake'}),timeout=45) as r:b=r.read(25000000)
 actual=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
 if actual!=expected:raise ValueError('Source identity mismatch: '+path)
 return b

def compact(raw):
 magic,version,total=struct.unpack_from('<III',raw);assert magic==0x46546c67 and version==2 and total==len(raw)
 n,kind=struct.unpack_from('<II',raw,12);assert kind==0x4e4f534a
 d=json.loads(raw[20:20+n]);off=20+n;size,kind=struct.unpack_from('<II',raw,off);assert kind==0x004e4942;buf=raw[off+8:off+8+size]
 names=[a.get('name','') for a in d.get('animations',[])];chosen=[]
 for term in ['idle','walk','run','attack','death','spell','hit']:
  found=[a for a in d.get('animations',[]) if term in a.get('name','').lower()]
  for a in found[:2]:
   if a not in chosen:chosen.append(a)
 d['animations']=chosen
 refs=[]
 def ref(obj,key):
  if key in obj:refs.append((obj,key,obj[key]))
 for m in d['meshes']:
  for p in m['primitives']:
   for k in p['attributes']:ref(p['attributes'],k)
   ref(p,'indices')
   for target in p.get('targets',[]):
    for k in target:ref(target,k)
 for skin in d.get('skins',[]):ref(skin,'inverseBindMatrices')
 for a in chosen:
  for s in a['samplers']:ref(s,'input');ref(s,'output')
 used=sorted({r[2] for r in refs});amap={x:i for i,x in enumerate(used)}
 for obj,key,x in refs:obj[key]=amap[x]
 accessors=[d['accessors'][x] for x in used];vrefs=[]
 for a in accessors:
  if 'bufferView' in a:vrefs.append((a,'bufferView',a['bufferView']))
  for key in ['indices','values']:
   q=a.get('sparse',{}).get(key)
   if q:vrefs.append((q,'bufferView',q['bufferView']))
 for im in d.get('images',[]):
  if 'bufferView' in im:vrefs.append((im,'bufferView',im['bufferView']))
 usedv=sorted({r[2] for r in vrefs});vmap={x:i for i,x in enumerate(usedv)};views=[];body=bytearray()
 for x in usedv:
  v=copy.deepcopy(d['bufferViews'][x]);start=v.get('byteOffset',0);payload=buf[start:start+v['byteLength']]
  body.extend(b'\0'*((-len(body))%4));v['byteOffset']=len(body);v['buffer']=0;body.extend(payload);views.append(v)
 for obj,key,x in vrefs:obj[key]=vmap[x]
 d['accessors']=accessors;d['bufferViews']=views;d['buffers']=[{'byteLength':len(body)}]
 meta=json.dumps(d,separators=(',',':')).encode();meta+=b' '*((-len(meta))%4);body.extend(b'\0'*((-len(body))%4))
 result=struct.pack('<III',0x46546c67,2,28+len(meta)+len(body))+struct.pack('<II',len(meta),0x4e4f534a)+meta+struct.pack('<II',len(body),0x004e4942)+body
 return result,names,[a.get('name','') for a in chosen]

def main():
 ap=argparse.ArgumentParser();ap.add_argument('--output',type=Path,required=True);args=ap.parse_args();out=args.output;out.mkdir(parents=True,exist_ok=True)
 license=download('LICENSE.txt','5de5a1e35003680bd6b97b4c247eed71d51a9fb7');(out/'LICENSE.txt').write_bytes(license)
 texture=download('addons/kaykit_character_pack_skeletons/Characters/gltf/skeleton_texture.png','00bf24bd5fd17937e08fd90f819a7bc69de432b8');(out/'skeleton_texture.png').write_bytes(texture)
 rows=[]
 for name,sha in MODELS.items():
  path='addons/kaykit_character_pack_skeletons/Characters/gltf/'+name+'.glb';raw=download(path,sha);data,names,selected=compact(raw)
  (out/(name+'.glb')).write_bytes(data)
  (out/(name+'.glb.gz.b64')).write_text(base64.b64encode(gzip.compress(data,compresslevel=9,mtime=0)).decode())
  rows.append({'name':name,'source':BASE+path,'sourceGitBlob':sha,'sourceSha256':hashlib.sha256(raw).hexdigest(),'sourceBytes':len(raw),'bytes':len(data),'sha256':hashlib.sha256(data).hexdigest(),'animations':names,'retainedAnimations':selected})
 (out/'intake.json').write_text(json.dumps({'artist':'Kay Lousberg','license':'CC0','revision':REV,'models':rows},indent=2));print(json.dumps(rows,indent=2))
if __name__=='__main__':main()
