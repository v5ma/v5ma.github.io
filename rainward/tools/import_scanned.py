"""Bounded, attributed Poly Haven import; the shipped game never calls this API.
Run in a checkout with Pillow installed, then optimize_scanned.mjs. Downloaded
metadata/files are hashed; source textures/UVs are preserved, not color-baked.
"""
from pathlib import Path, PurePosixPath
from urllib.request import Request,urlopen
from urllib.parse import urlparse
import hashlib,json,time,io,sys
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'assets/scanned';CACHE=Path('/tmp/rainward-scanned-source')
OUT.mkdir(parents=True,exist_ok=True);CACHE.mkdir(parents=True,exist_ok=True)
UA='Rainward-Scanned-Asset-Import/0.5 (v5ma.github.io/rainward; CC0 asset selection)'
records={};budget=0

def fetch(url,meta=None):
 global budget
 host=urlparse(url).hostname
 if host not in {'api.polyhaven.com','dl.polyhaven.org','raw.githubusercontent.com'}:raise ValueError('Unapproved source host')
 key=hashlib.sha256(url.encode()).hexdigest();cached=CACHE/key
 if cached.exists():data=cached.read_bytes()
 else:
  for attempt in range(3):
   try:
    with urlopen(Request(url,headers={'User-Agent':UA}),timeout=45) as r:
     data=r.read(60000001)
    if len(data)>60000000:raise ValueError('Asset exceeds individual budget')
    cached.write_bytes(data);break
   except Exception:
    if attempt==2:raise
    time.sleep(2)
  time.sleep(.12)
 if meta:
  if 'size' in meta and len(data)!=meta['size']:raise ValueError('Unexpected size: '+url)
  if 'md5' in meta and hashlib.md5(data).hexdigest()!=meta['md5']:raise ValueError('Source checksum changed: '+url)
 records[url]={'sha256':hashlib.sha256(data).hexdigest(),'bytes':len(data),'source_md5':meta.get('md5') if meta else None}
 budget+=len(data)
 if budget>160000000:raise ValueError('Import transfer budget exceeded')
 return data

def api(endpoint):return json.loads(fetch('https://api.polyhaven.com/'+endpoint))
def save_image(meta,path,size,lossless=False):
 raw=fetch(meta['url'],meta);im=Image.open(io.BytesIO(raw)).convert('RGB');im.thumbnail((size,size),Image.Resampling.LANCZOS)
 im.save(path,'WEBP',quality=95 if path.stem=='normal' else 86,lossless=lossless,method=6)
 return {'path':str(path.relative_to(OUT)),'width':im.width,'height':im.height}

selected={'stone':'stone_wall_02','brick':'castle_brick_02_red','paving':'mossy_cobblestone','ground':'forest_ground_04'}
model_ids=['boulder_01','rock_moss_set_01','fern_02']
assets=api('assets');manifest={'version':1,'provider':'Poly Haven','license':'CC0-1.0','license_url':'https://polyhaven.com/license','assets':{},'surfaces':{},'models':{},'environment':{}}
for key,id in selected.items():
 meta=assets[id];files=api('files/'+id);manifest['assets'][id]={'title':meta['name'],'authors':meta['authors'],'url':'https://polyhaven.com/a/'+id,'license':'CC0-1.0'}
 prefix=OUT/key;prefix.mkdir(exist_ok=True)
 entry={'asset':id,'metres':(meta.get('dimensions') or [2500])[0]/1000}
 for slot,source,res,size in [('color','Diffuse','2k',2048),('normal','nor_gl','1k',1024),('orm','arm','1k',512)]:
  f=files[source][res];v=f.get('png') or f['jpg'];entry[slot]=save_image(v,prefix/(slot+'.webp'),size,slot=='orm')
 manifest['surfaces'][key]=entry
 print('Imported material',id,flush=True)
for id in model_ids:
 meta=assets[id];files=api('files/'+id);manifest['assets'][id]={'title':meta['name'],'authors':meta['authors'],'url':'https://polyhaven.com/a/'+id,'license':'CC0-1.0'}
 g=files['gltf']['1k']['gltf'];folder=CACHE/id;folder.mkdir(exist_ok=True);path=folder/(id+'.gltf');path.write_bytes(fetch(g['url'],g))
 for name,dep in g.get('include',{}).items():
  safe=PurePosixPath(name)
  if safe.is_absolute() or '..' in safe.parts:raise ValueError('Untrusted resource path')
  target=folder.joinpath(*safe.parts);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(fetch(dep['url'],dep))
 manifest['models'][id]={'asset':id,'input':str(path),'path':id+'.glb','source_triangles':meta.get('polycount'),'source_dimensions_mm':meta.get('dimensions')}
 print('Downloaded model',id,flush=True)
id='kloppenheim_06_puresky';meta=assets[id];files=api('files/'+id);hdr=files['hdri']['1k']['hdr'];(OUT/'daylight.hdr').write_bytes(fetch(hdr['url'],hdr))
manifest['assets'][id]={'title':meta['name'],'authors':meta['authors'],'url':'https://polyhaven.com/a/'+id,'license':'CC0-1.0'};manifest['environment']={'asset':id,'path':'daylight.hdr','resolution':'1k'}
V=ROOT/'vendor';V.mkdir(exist_ok=True)
for name,source in [('GLTFLoader.js','loaders/GLTFLoader.js'),('RGBELoader.js','loaders/RGBELoader.js'),('BufferGeometryUtils.js','utils/BufferGeometryUtils.js')]:
 raw=fetch('https://raw.githubusercontent.com/mrdoob/three.js/r177/examples/jsm/'+source).decode()
 raw=raw.replace("from 'three'","from './three.module.js'").replace("from '../utils/BufferGeometryUtils.js'","from './BufferGeometryUtils.js'")
 (V/name).write_text(raw)
(V/'ADDON-SOURCES.md').write_text('# Three.js addons\n\nGLTFLoader, RGBELoader and BufferGeometryUtils from the upstream Three.js r177 examples/jsm tree. MIT license: see LICENSE. Only module specifiers were changed to the self-hosted vendored paths.\n')
(OUT/'import-plan.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')
(OUT/'source-lock.json').write_text(json.dumps({'user_agent':UA,'sources':records},indent=2)+'\n')
print('Source bytes processed:',budget)
