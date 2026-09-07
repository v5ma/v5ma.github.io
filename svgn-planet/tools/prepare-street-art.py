"""Curate CC0 Standard assets into one shared glTF library; no gameplay edits.
Input: the official unmodified archives kept by Paper Delivery art intake.
Run from repository root: python svgn-planet/tools/prepare-street-art.py INTAKE
"""
from pathlib import Path, PurePosixPath
from PIL import Image
import io, json, zipfile, hashlib, sys, copy, urllib.request, re
SRC=Path(sys.argv[1]);DEST=Path('svgn-planet/assets/street-art');DEST.mkdir(parents=True,exist_ok=True)
TEX=DEST/'textures';TEX.mkdir(exist_ok=True)
selection={
 'downtown-city-megakit':('Exports/glTF (Godot)/',[
  'Brick_Window_Trim','Brick_Window_CurvedDouble','Brick_Plain_3','Brick_Plain_1',
  'Brick_BottomTrim','Cornice_Brick_Center','Cornice_Metal_Center',
  'Metal_FirstFloor_Window','DoorFrame_Wooden','Door_1',
  'Roof_Slate_Window_1','Roof_Slate_Corner','Roof_Slate_Center','Roof_4x4',
  'Prop_Planter_Single','Prop_Drain','Prop_ManholeCover','Stairs_Rails_Metal_Straight_1']),
 'stylized-nature-megakit':('glTF/',[
  'CommonTree_1','CommonTree_3','CommonTree_4','Bush_Common','Bush_Common_Flowers',
  'Flower_3_Group','Flower_4_Group','Grass_Common_Short','Fern_1'])}
G={'asset':{'version':'2.0','generator':'SVGN CC0 street-art curation 1'},'scene':0,'scenes':[{'nodes':[]}],
   'nodes':[],'meshes':[],'materials':[],'textures':[],'images':[],
   'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}],
   'accessors':[],'bufferViews':[],'buffers':[]}
binary=bytearray(); image_cache={}; texture_cache={}; material_cache={}; sources=[]
def sha(data):return hashlib.sha256(data).hexdigest()
def append(data):
 while len(binary)%4:binary.append(0)
 offset=len(binary);binary.extend(data);return offset

def image(z,path):
 data=z.read(path); h=sha(data)
 if h in image_cache:return image_cache[h]
 name=PurePosixPath(path).stem; im=Image.open(io.BytesIO(data)); maxsize=1024 if any(s in name.lower() for s in ['normal','orm']) else 2048
 if 'leaves' in name.lower() or 'flower' in name.lower():maxsize=1024
 im.thumbnail((maxsize,maxsize),Image.Resampling.LANCZOS)
 alpha='A' in im.getbands() and im.getchannel('A').getextrema()[0]<255
 ext='png' if alpha else 'jpg';filename=re.sub(r'[^A-Za-z0-9_-]','_',name)+'-'+h[:8]+'.'+ext
 if alpha:im.save(TEX/filename,optimize=True)
 else:im.convert('RGB').save(TEX/filename,quality=87,optimize=True,subsampling=0)
 idx=len(G['images']);G['images'].append({'uri':'textures/'+filename,'name':name,'mimeType':'image/png' if alpha else 'image/jpeg'});image_cache[h]=idx
 sources.append({'type':'texture','sourcePath':path,'sourceSha256':h,'output':'textures/'+filename,'size':list(im.size),'bytes':(TEX/filename).stat().st_size,'sha256':sha((TEX/filename).read_bytes())})
 return idx

for pack,(folder,names) in selection.items():
 archive=SRC/(pack+'.zip');z=zipfile.ZipFile(archive)
 license_text=z.read('License_Standard.txt').decode();assert 'CC0' in license_text
 (DEST/(pack+'-LICENSE.txt')).write_text(license_text)
 sources.append({'type':'pack','pack':pack,'source':'https://quaternius.itch.io/'+pack,'author':'Quaternius','edition':'Standard','license':'CC0-1.0','archiveSha256':sha(archive.read_bytes()),'selected':names})
 for name in names:
  path=folder+name+'.gltf';j=json.loads(z.read(path));assert not j.get('skins') and not j.get('animations'), 'Static library only'
  buf_offsets=[append(z.read(folder+b['uri'])) for b in j['buffers']]
  view_offset=len(G['bufferViews'])
  for view in j['bufferViews']:
   q=copy.deepcopy(view);q['byteOffset']=q.get('byteOffset',0)+buf_offsets[q['buffer']];q['buffer']=0;G['bufferViews'].append(q)
  acc_offset=len(G['accessors'])
  for a in j['accessors']:
   q=copy.deepcopy(a);assert 'sparse' not in q
   if 'bufferView' in q:q['bufferView']+=view_offset
   G['accessors'].append(q)
  remap_tex={}
  for i,t in enumerate(j.get('textures',[])):
   source=j['images'][t['source']]['uri'];idx=image(z,str(PurePosixPath(folder)/source));key=idx
   if key not in texture_cache:texture_cache[key]=len(G['textures']);G['textures'].append({'source':idx,'sampler':0})
   remap_tex[i]=texture_cache[key]
  remap_mat={}
  def maptextures(obj):
   if isinstance(obj,dict):
    for k,v in obj.items():
     if k.endswith('Texture') and isinstance(v,dict) and 'index' in v:v['index']=remap_tex[v['index']]
     else:maptextures(v)
   elif isinstance(obj,list):
    for v in obj:maptextures(v)
  for i,mat in enumerate(j.get('materials',[])):
   q=copy.deepcopy(mat);maptextures(q)
   # Static street scenery needs depth-stable window surfaces, not transparent
   # sorting. No paid fake-interior shader is reconstructed or included.
   if 'Glass' in q.get('name',''):
    q.pop('alphaMode',None);q['pbrMetallicRoughness']={'baseColorFactor':[.10,.20,.22,1],'metallicFactor':.35,'roughnessFactor':.22}
   if 'FakeInterior' in q.get('name',''):
    q['pbrMetallicRoughness']['baseColorFactor']=[.30,.21,.12,1];q['emissiveFactor']=[.08,.045,.015]
   if 'Bark' in q.get('name',''):q.pop('alphaMode',None);q.pop('alphaCutoff',None)
   key=json.dumps(q,sort_keys=True)
   if key not in material_cache:material_cache[key]=len(G['materials']);G['materials'].append(q)
   remap_mat[i]=material_cache[key]
  mesh_offset=len(G['meshes'])
  for mesh in j['meshes']:
   q=copy.deepcopy(mesh)
   for prim in q['primitives']:
    prim['attributes']={k:v+acc_offset for k,v in prim['attributes'].items()}
    if 'indices' in prim:prim['indices']+=acc_offset
    if 'material' in prim:prim['material']=remap_mat[prim['material']]
   G['meshes'].append(q)
  node_offset=len(G['nodes'])
  for node in j['nodes']:
   q=copy.deepcopy(node)
   if 'mesh' in q:q['mesh']+=mesh_offset
   if 'children' in q:q['children']=[v+node_offset for v in q['children']]
   G['nodes'].append(q)
  roots=[v+node_offset for v in j['scenes'][j.get('scene',0)]['nodes']]
  G['scenes'][0]['nodes'].append(len(G['nodes']));G['nodes'].append({'name':'asset_'+name,'children':roots})
G['buffers']=[{'uri':'street-art.bin','byteLength':len(binary)}];(DEST/'street-art.bin').write_bytes(binary)
(DEST/'street-art.gltf').write_text(json.dumps(G,separators=(',',':')))
# Material images use named metadata from the official public API. Import step
# may fetch them; the shipped game always uses local, curated files.
for asset in ['aerial_asphalt_01','concrete_pavement','rocky_terrain_02']:
 meta=json.loads((SRC/(asset+'.json')).read_text());record={'type':'material','author':'Poly Haven','source':'https://polyhaven.com/a/'+asset,'license':'CC0-1.0','files':[]}
 for field,kind in [('Diffuse','color'),('nor_gl','normal'),('Rough','rough')]:
  item=meta[field]['1k']['jpg'];path=SRC/(asset+'-'+kind+'.jpg')
  if not path.exists():
   if kind=='normal':path.write_bytes((SRC/(asset+'-nor_gl.jpg')).read_bytes())
   else:
    with urllib.request.urlopen(item['url'],timeout=45) as response:path.write_bytes(response.read())
  im=Image.open(path);im.thumbnail((1024,1024));out=DEST/(asset+'-'+kind+'.jpg');im.convert('RGB').save(out,quality=85,optimize=True)
  record['files'].append({'file':out.name,'sourceUrl':item['url'],'sha256':sha(out.read_bytes()),'size':list(im.size)})
 sources.append(record)
(DEST/'asset-register.json').write_text(json.dumps({'licensePolicy':'CC0 only. Original licenses retained. No paid Source shaders or assets.','sources':sources,'library':{'models':sum(len(v[1]) for v in selection.values()),'bytes':len(binary),'materials':len(G['materials']),'textures':len(G['images'])}},indent=2))
print(json.dumps({'models':sum(len(v[1]) for v in selection.values()),'geometryBytes':len(binary),'textures':len(G['images']),'totalBytes':sum(p.stat().st_size for p in DEST.rglob('*') if p.is_file())}))
