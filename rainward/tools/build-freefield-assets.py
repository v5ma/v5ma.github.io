"""Embed creator-published CC0 GLBs without remote runtime texture requests."""
from pathlib import Path
from zipfile import ZipFile
import json,struct,hashlib,urllib.request,os
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'assets'/'freefield-weapons';OUT.mkdir(parents=True,exist_ok=True)
SOURCE='https://opengameart.org/sites/default/files/kenney_blaster-kit_2.1.zip'
archive=Path(os.getenv('KENNEY_SOURCE','/tmp/rainward-kenney-blasters.zip'))
if not archive.exists():
 with urllib.request.urlopen(SOURCE,timeout=45) as response:archive.write_bytes(response.read())
data=archive.read_bytes();EXPECTED='91e3093e95427d59625e7e2ce2d0399b861600160fd0b4ada7714796b67cea8c'
assert hashlib.sha256(data).hexdigest()==EXPECTED,'Creator ZIP changed; inspect before repackaging'
files=[]
with ZipFile(archive) as z:
 for name,role in [('blaster-b','pistol'),('blaster-d','rifle')]:
  source='Models/GLB format/'+name+'.glb';raw=z.read(source);n=struct.unpack_from('<I',raw,12)[0];doc=json.loads(raw[20:20+n]);at=20+n;size=struct.unpack_from('<I',raw,at)[0];binary=bytearray(raw[at+8:at+8+size])
  for image in doc.get('images',[]):
   uri=image.pop('uri',None)
   if uri:
    imageBytes=z.read('Models/GLB format/'+uri)
    while len(binary)%4:binary.append(0)
    view=len(doc['bufferViews']);doc['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(imageBytes)});binary.extend(imageBytes);image['bufferView']=view;image['mimeType']='image/png'
  doc['buffers']=[{'byteLength':len(binary)}];text=json.dumps(doc,separators=(',',':')).encode();text+=b' '*((-len(text))%4);binary+=b'\0'*((-len(binary))%4)
  glb=struct.pack('<III',0x46546c67,2,12+8+len(text)+8+len(binary))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(binary),0x004e4942)+binary
  file=role+'.glb';(OUT/file).write_bytes(glb);files.append({'file':file,'bytes':len(glb),'sha256':hashlib.sha256(glb).hexdigest(),'source':source,'sourceSHA256':hashlib.sha256(raw).hexdigest()})
 licenseName=next(n for n in z.namelist() if n.lower().endswith('.txt') and 'license' in n.lower());(OUT/'LICENSE.txt').write_bytes(z.read(licenseName))
(OUT/'manifest.json').write_text(json.dumps({'creator':'Kenney','license':'CC0-1.0','creatorPage':'https://kenney.nl/assets/blaster-kit','sourceArchive':SOURCE,'sourceArchiveSHA256':EXPECTED,'modifications':'Embedded original palette PNG into the GLB; geometry, palette and source license retained. Runtime scaling/orientation only.','files':files},indent=2)+'\n')
