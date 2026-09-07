"""One-time art intake, never run by the game. Three named CC0 assets.
Creates local optimized files and a source/checksum register, not CDN hotlinks.
"""
from pathlib import Path
import json,urllib.request,urllib.parse,hashlib,io,struct
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'vesperfall/assets/cathedral';OUT.mkdir(parents=True,exist_ok=True)
UA={'User-Agent':'Vesperfall-game-art-intake/1.0 (three named CC0 assets; github.com/v5ma/v5ma.github.io)'}
records=[]
def get(url):
 assert urllib.parse.urlparse(url).hostname in ['api.polyhaven.com','dl.polyhaven.org'],url
 with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60) as r:
  b=r.read(32*1024*1024+1);assert len(b)<=32*1024*1024
 return b
def metadata(asset):
 m=json.loads(get('https://api.polyhaven.com/files/'+asset));print(asset,'available',list(m),flush=True)
 (OUT/(asset+'-source.json')).write_text(json.dumps(m,indent=2));return m
def image(raw,size=1024):
 im=Image.open(io.BytesIO(raw));im.thumbnail((size,size),Image.Resampling.LANCZOS);s=io.BytesIO();im.convert('RGB').save(s,'JPEG',quality=88,optimize=True);return s.getvalue()
def record(name,raw,asset,url,notes):
 (OUT/name).write_bytes(raw);records.append({'file':name,'asset':asset,'source':'https://polyhaven.com/a/'+asset,'download':url,'license':'CC0-1.0','license_url':'https://polyhaven.com/license','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'modifications':notes});print(name,len(raw),flush=True)
for asset,prefix in [('castle_brick_01','masonry'),('cobblestone_floor_02','paving')]:
 m=metadata(asset)
 for kinds,label in [(['diff','diffuse'],'color'),(['nor_gl','normal'],'normal'),(['arm','ao/rough/metal'],'arm')]:
  key=next((k for k in m if k.lower() in kinds),None);assert key,(asset,kinds,list(m))
  variants=m[key]['1k'];entry=variants.get('jpg') or variants.get('png');assert entry
  record(prefix+'-'+label+'.jpg',image(get(entry['url'])),asset,entry['url'],'1024px maximum, RGB JPEG quality 88. OpenGL normal; ARM packs occlusion/roughness/metalness.')
asset='marble_bust_01';m=metadata(asset);key=next(k for k in m if k.lower()=='gltf');entry=m[key].get('1k',m[key].get('2k'));entry=entry.get('gltf',entry);url=entry['url'];doc=json.loads(get(url));print('model keys',list(doc),flush=True);binary=bytearray();views=doc.setdefault('bufferViews',[])
includes={Path(k).name:v['url'] for k,v in entry.get('include',{}).items()}
def dependency(uri):return get(includes.get(Path(uri).name,urllib.parse.urljoin(url,uri)))
def append(data):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(data);return offset
for buf in doc.get('buffers',[]):
 assert len(doc['buffers'])==1
 uri=buf.get('uri');assert uri and not uri.startswith('data:')
 raw=dependency(uri);assert len(raw)==buf['byteLength'];append(raw)
for im in doc.get('images',[]):
 uri=im.pop('uri',None);assert uri and not uri.startswith('data:')
 raw=image(dependency(uri),512);offset=append(raw);im['bufferView']=len(views);im['mimeType']='image/jpeg';views.append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)})
while len(binary)%4:binary.append(0)
doc['buffers']=[{'byteLength':len(binary)}];text=json.dumps(doc,separators=(',',':')).encode();text+=b' '*((-len(text))%4)
glb=struct.pack('<III',0x46546C67,2,12+8+len(text)+8+len(binary))+struct.pack('<II',len(text),0x4E4F534A)+text+struct.pack('<II',len(binary),0x004E4942)+binary
triangles=sum(doc['accessors'][p['indices']]['count']//3 for mesh in doc['meshes'] for p in mesh['primitives']);assert triangles<65000,triangles
record('marble-bust.glb',glb,asset,url,'Original mesh; images reduced to 512px JPEG, embedded into one local GLB. Triangles: '+str(triangles))
(OUT/'ASSET-REGISTER.json').write_text(json.dumps({'version':1,'license':'CC0-1.0','license_url':'https://polyhaven.com/license','scope':'Asset data only, not website renders. No runtime third-party requests.','assets':records},indent=2)+'\n')
(OUT/'LICENSE.txt').write_text('These derivatives are CC0-1.0. Original assets by Poly Haven contributors.\nhttps://polyhaven.com/license\nhttps://creativecommons.org/publicdomain/zero/1.0/\nSee ASSET-REGISTER.json for named sources, transformations and checksums.\n')
