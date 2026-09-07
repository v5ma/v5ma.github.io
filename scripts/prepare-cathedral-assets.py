"""One-time art intake, never run by the game. Only three named CC0 assets.
Produces optimized local files and a source/checksum register, not CDN hotlinks.
"""
from pathlib import Path
import json,urllib.request,urllib.parse,hashlib,io,struct
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'vesperfall/assets/cathedral';OUT.mkdir(parents=True,exist_ok=True)
UA={'User-Agent':'Vesperfall-game-art-intake/1.0 (three named CC0 assets; github.com/v5ma/v5ma.github.io)'}
MAX=32*1024*1024
records=[]
def get(url):
 assert urllib.parse.urlparse(url).hostname in ['api.polyhaven.com','dl.polyhaven.org'],url
 with urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=60) as r:
  b=r.read(MAX+1);assert len(b)<=MAX
 return b
def metadata(asset):return json.loads(get('https://api.polyhaven.com/files/'+asset))
def image(raw,size=1024):
 im=Image.open(io.BytesIO(raw));im.thumbnail((size,size),Image.Resampling.LANCZOS);s=io.BytesIO();im.convert('RGB').save(s,'JPEG',quality=88,optimize=True);return s.getvalue()
def record(name,raw,asset,url,notes):
 (OUT/name).write_bytes(raw);records.append({'file':name,'asset':asset,'source':'https://polyhaven.com/a/'+asset,'download':url,'license':'CC0-1.0','license_url':'https://polyhaven.com/license','sha256':hashlib.sha256(raw).hexdigest(),'bytes':len(raw),'modifications':notes});print(name,len(raw))
for asset,prefix in [('castle_brick_01','masonry'),('cobblestone_floor_02','paving')]:
 m=metadata(asset)
 for kind,label in [('diff','color'),('nor_gl','normal'),('arm','arm')]:
  variants=m[kind]['1k'];entry=variants.get('jpg') or variants.get('png');assert entry
  raw=image(get(entry['url']));record(prefix+'-'+label+'.jpg',raw,asset,entry['url'],'Resized to at most 1024 pixels, RGB JPEG quality 88; normal map is OpenGL, ARM packs occlusion/roughness/metalness.')
asset='marble_bust_01';m=metadata(asset);entry=m['gltf'].get('1k',m['gltf'].get('2k'));entry=entry.get('gltf',entry);url=entry['url'];doc=json.loads(get(url));print('model keys',list(doc));binary=bytearray();views=doc.setdefault('bufferViews',[])
def append(data):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(data);return offset
for buf in doc.get('buffers',[]):
 assert len(doc['buffers'])==1,'Only single-buffer glTF supported by this bounded packer'
 uri=buf.get('uri');assert uri and not uri.startswith('data:')
 raw=get(urllib.parse.urljoin(url,uri));assert len(raw)==buf['byteLength'];append(raw)
for im in doc.get('images',[]):
 uri=im.pop('uri',None);assert uri and not uri.startswith('data:')
 raw=image(get(urllib.parse.urljoin(url,uri)),512);offset=append(raw);im['bufferView']=len(views);im['mimeType']='image/jpeg';views.append({'buffer':0,'byteOffset':offset,'byteLength':len(raw)})
while len(binary)%4:binary.append(0)
doc['buffers']=[{'byteLength':len(binary)}]
text=json.dumps(doc,separators=(',',':')).encode();text+=b' '*((-len(text))%4)
glb=struct.pack('<III',0x46546C67,2,12+8+len(text)+8+len(binary))+struct.pack('<II',len(text),0x4E4F534A)+text+struct.pack('<II',len(binary),0x004E4942)+binary
triangles=sum(doc['accessors'][p['indices']]['count']//3 for mesh in doc['meshes'] for p in mesh['primitives']);assert triangles<65000,triangles
record('marble-bust.glb',glb,asset,url,'Original mesh retained; embedded images reduced to 512px JPEG and combined into one local GLB. Triangles: '+str(triangles))
(OUT/'ASSET-REGISTER.json').write_text(json.dumps({'version':1,'license':'CC0-1.0','license_url':'https://polyhaven.com/license','scope':'Downloaded asset data only, not website example renders. No runtime third-party requests.','assets':records},indent=2)+'\n')
(OUT/'LICENSE.txt').write_text('These asset derivatives are CC0-1.0. Original assets by Poly Haven contributors.\nhttps://polyhaven.com/license\nhttps://creativecommons.org/publicdomain/zero/1.0/\nSee ASSET-REGISTER.json for exact named sources, transformations and checksums.\n')
