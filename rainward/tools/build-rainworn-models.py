"""Adapt the CC0 Quaternius Standard humans to Rainward's existing 17-bone rig.
This is an asset conversion, not a replacement of gameplay physics or animation.
Source files are supplied from the verified official zero-price Standard archive.
"""
from pathlib import Path
import argparse,json,struct,hashlib,io
import numpy as np
from PIL import Image
TARGET=np.array([[0,.94,0],[0,1.105,0],[0,1.325,0],[0,1.50,0],[0,1.61,0],[-.244,1.415,0],[-.262,1.115,0],[-.276,.855,-.008],[.244,1.415,0],[.262,1.115,0],[.276,.855,-.008],[-.103,.92,0],[-.105,.49,0],[-.105,.105,0],[.103,.92,0],[.105,.49,0],[.105,.105,0]],dtype=float)
PARENT=[-1,0,1,2,3,2,5,6,2,8,9,0,11,12,0,14,15]
NAMES=['hips','spine','chest','neck','head','armL','elbowL','handL','armR','elbowR','handR','legL','kneeL','footL','legR','kneeR','footR']
FLIP=np.diag([-1.,1.,-1.])
DTYPE={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}
WIDTH={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def matrix(n):
 if 'matrix' in n:return np.array(n['matrix']).reshape(4,4).T
 x,y,z,w=n.get('rotation',[0,0,0,1]);m=np.eye(4)
 m[:3,:3]=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]])@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0]);return m
def globals_(g):
 out=[None]*len(g['nodes'])
 def walk(i,m):
  out[i]=m@matrix(g['nodes'][i])
  for c in g['nodes'][i].get('children',[]):walk(c,out[i])
 for i in g['scenes'][g.get('scene',0)]['nodes']:walk(i,np.eye(4))
 return out
class Input:
 def __init__(self,path):
  self.path=path;self.g=json.loads(path.read_text());self.data=[(path.parent/b['uri']).read_bytes() for b in self.g['buffers']];self.world=globals_(self.g)
 def array(self,index):
  a=self.g['accessors'][index];v=self.g['bufferViews'][a['bufferView']];dtype=np.dtype(DTYPE[a['componentType']]);width=WIDTH[a['type']];stride=v.get('byteStride',width*dtype.itemsize);offset=v.get('byteOffset',0)+a.get('byteOffset',0)
  return np.ndarray((a['count'],width),dtype=dtype,buffer=self.data[v.get('buffer',0)],offset=offset,strides=(stride,dtype.itemsize)).copy()
def rotation(a,b):
 a=a/np.linalg.norm(a);b=b/np.linalg.norm(b);v=np.cross(a,b);c=np.clip(np.dot(a,b),-1,1);s=np.linalg.norm(v)
 if s<1e-8:return np.eye(3) if c>0 else np.diag([-1.,-1.,1.])
 k=np.array([[0,-v[2],v[1]],[v[2],0,-v[0]],[-v[1],v[0],0]])
 return np.eye(3)+k+k@k*((1-c)/(s*s))
def rig_mapping(src):
 names={n.get('name'):i for i,n in enumerate(src.g['nodes'])};pos={n:FLIP@src.world[i][:3,3] for n,i in names.items()}
 groups={'root':(0,'pelvis'),'pelvis':(0,'pelvis'),'spine_01':(1,'spine_01'),'spine_02':(1,'spine_01'),'spine_03':(2,'spine_03'),'neck_01':(3,'neck_01'),'Head':(4,'Head')}
 for side,arm,leg in [('l',5,11),('r',8,14)]:
  for name,index,base in [('clavicle',2,'spine_03'),('upperarm',arm,'upperarm_'+side),('lowerarm',arm+1,'lowerarm_'+side),('hand',arm+2,'hand_'+side),('thigh',leg,'thigh_'+side),('calf',leg+1,'calf_'+side),('foot',leg+2,'foot_'+side),('ball',leg+2,'foot_'+side),('ball_leaf',leg+2,'foot_'+side)]:groups[name+'_'+side]=(index,base)
  for name in names:
   if name.endswith('_'+side) and any(name.startswith(x) for x in ['index','middle','pinky','ring','thumb']):groups[name]=(arm+2,'hand_'+side)
 transforms={}
 for name,(index,base) in groups.items():
  if name not in names:continue
  origin=pos[base];dest=TARGET[index].copy();linear=np.eye(3)*(.84 if index==4 else .93)
  if index in [5,6,8,9,11,12,14,15]:
   side='l' if index in [5,6,11,12] else 'r';nextName={5:'lowerarm',6:'hand',8:'lowerarm',9:'hand',11:'calf',12:'foot',14:'calf',15:'foot'}[index]+'_'+side
   v=pos[nextName]-origin;w=TARGET[index+1]-dest;u=v/np.linalg.norm(v);radial=.88
   scale=radial*np.eye(3)+(np.linalg.norm(w)/np.linalg.norm(v)-radial)*np.outer(u,u);linear=rotation(v,w)@scale
  elif index in [7,10]:
   side='l' if index==7 else 'r';v=pos['middle_03_'+side]-origin;linear=rotation(v,np.array([0,-1.,0]))*.66
  elif index in [13,16]:linear=np.eye(3)*.86
  elif name=='spine_02':
   origin=pos['spine_02'];dest=np.array([0,1.215,0])
  m=np.eye(4);m[:3,:3]=linear@FLIP;m[:3,3]=dest-linear@origin;transforms[name]=(index,m)
 return names,transforms
class Output:
 def __init__(self):
  self.data=bytearray();self.g={'asset':{'version':'2.0','generator':'Rainward / CC0 Quaternius Standard adaptation'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[{'name':'Rainward adapted human','children':list(range(1,18))}],'buffers':[{}],'bufferViews':[],'accessors':[],'meshes':[],'materials':[],'images':[],'textures':[],'extensionsUsed':['EXT_texture_webp'],'extensionsRequired':['EXT_texture_webp'],'samplers':[{'magFilter':9729,'minFilter':9987,'wrapS':10497,'wrapT':10497}]}
  for i in range(17):
   n={'name':NAMES[i],'translation':(TARGET[i]-(TARGET[PARENT[i]] if PARENT[i]>=0 else 0)).tolist()};children=[j+1 for j,p in enumerate(PARENT) if p==i]
   if children:n['children']=children
   self.g['nodes'].append(n)
  self.g['nodes'][0]['children']=[1]
  ib=np.repeat(np.eye(4)[None,:,:],17,axis=0);ib[:,:3,3]=-TARGET
  a=self.access(ib.transpose(0,2,1).reshape(17,16),'MAT4');self.g['skins']=[{'name':'Rainward 17-bone skin','joints':list(range(1,18)),'inverseBindMatrices':a}]
 def view(self,data):
  self.data.extend(b'\0'*((-len(self.data))%4));i=len(self.g['bufferViews']);self.g['bufferViews'].append({'buffer':0,'byteOffset':len(self.data),'byteLength':len(data)});self.data.extend(data);return i
 def access(self,a,kind,integer=False):
  a=np.asarray(a,dtype='<u2' if integer else '<f4');i=len(self.g['accessors']);r={'bufferView':self.view(a.tobytes()),'componentType':5123 if integer else 5126,'count':len(a),'type':kind}
  if kind=='VEC3':r.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
  self.g['accessors'].append(r);return i
 def image(self,path,size=1024,normal=False):
  im=Image.open(path).convert('RGB');im.thumbnail((size,size),Image.Resampling.LANCZOS)
  b=io.BytesIO();im.save(b,format='WEBP',lossless=normal,quality=92,method=6)
  i=len(self.g['images']);self.g['images'].append({'name':path.stem,'mimeType':'image/webp','bufferView':self.view(b.getvalue())});self.g['textures'].append({'sampler':0,'extensions':{'EXT_texture_webp':{'source':i}}});return len(self.g['textures'])-1
 def write(self,path):
  self.data.extend(b'\0'*((-len(self.data))%4));self.g['buffers'][0]['byteLength']=len(self.data);j=json.dumps(self.g,separators=(',',':')).encode();j+=b' '*((-len(j))%4);blob=struct.pack('<III',0x46546c67,2,28+len(j)+len(self.data))+struct.pack('<II',len(j),0x4e4f534a)+j+struct.pack('<II',len(self.data),0x004e4942)+self.data;path.write_bytes(blob);return hashlib.sha256(blob).hexdigest()
def adapt(source,gender,dest):
 base=source/'Base Characters/Godot - UE';src=Input(base/f'Superhero_{gender}_FullBody.gltf');out=Output();names,transforms=rig_mapping(src)
 tex=source/'Base Characters/Textures';norm=tex/'Normals Unity - Godot'
 skinColor=tex/('T_Superhero_Female_Light_BaseColor.png' if gender=='Female' else 'T_Superhero_Male_Ligh.png')
 skinTex=out.image(skinColor);skinNormal=out.image(norm/f'T_Superhero_{gender}_Normal.png',normal=True)
 eye=out.image(tex/'T_Eye_Brown.png',256);hairNum=2 if gender=='Female' else 1;hairtex=out.image(tex/f'T_Hair_{hairNum}_BaseColor.png',512);hairnorm=out.image(norm/f'T_Hair_{hairNum}_Normal.png',512,True)
 out.g['materials']=[{'name':'skin','pbrMetallicRoughness':{'baseColorTexture':{'index':skinTex},'roughnessFactor':.72,'metallicFactor':0},'normalTexture':{'index':skinNormal,'scale':.55}}, {'name':'eyes','pbrMetallicRoughness':{'baseColorTexture':{'index':eye},'roughnessFactor':.38,'metallicFactor':0}}, {'name':'hair','pbrMetallicRoughness':{'baseColorTexture':{'index':hairtex},'roughnessFactor':.82,'metallicFactor':0},'normalTexture':{'index':hairnorm,'scale':.65}}, {'name':'jacket','pbrMetallicRoughness':{'baseColorFactor':[.28,.36,.29,1],'roughnessFactor':.93,'metallicFactor':0}}, {'name':'trousers','pbrMetallicRoughness':{'baseColorFactor':[.17,.21,.18,1],'roughnessFactor':.96,'metallicFactor':0}}, {'name':'boots','pbrMetallicRoughness':{'baseColorFactor':[.07,.08,.07,1],'roughnessFactor':.8,'metallicFactor':0}}]
 primitives=[];totals={};bounds=[]
 def geometry(inp,nodeIndex,forced=None):
  node=inp.g['nodes'][nodeIndex];joints=inp.g['skins'][node.get('skin',0)]['joints'];lookup={n.get('name'):i for i,n in enumerate(inp.g['nodes'])}
  for primitive in inp.g['meshes'][node['mesh']]['primitives']:
   attrs=primitive['attributes'];pos=inp.array(attrs['POSITION']);normal=inp.array(attrs['NORMAL']);uv=inp.array(attrs['TEXCOORD_0']);si=inp.array(attrs['JOINTS_0']);sw=inp.array(attrs['WEIGHTS_0']);idx=inp.array(primitive['indices']).reshape(-1).astype(int)
   meshworld=inp.world[nodeIndex];pos=np.c_[pos,np.ones(len(pos))]@meshworld.T;normal=normal@np.linalg.inv(meshworld[:3,:3]);point=np.zeros((len(pos),3));nrm=np.zeros((len(pos),3));weights=np.zeros((len(pos),17))
   # Convert each influence around its segment pivot, then collapse finger and
   # auxiliary weights into the game's existing stable hand bones.
   for j,nodeID in enumerate(joints):
    name=inp.g['nodes'][nodeID]['name'];targetIndex,m=transforms[name];influence=(sw*(si==j)).sum(axis=1);active=influence>1e-7
    if not active.any():continue
    point[active]+=(pos[active]@m.T)[:,:3]*influence[active,None];nrm[active]+=(normal[active]@np.linalg.inv(m[:3,:3]))*influence[active,None];weights[active,targetIndex]+=influence[active]
   nrm/=np.maximum(1e-9,np.linalg.norm(nrm,axis=1))[:,None]
   joints17=np.argsort(-weights,axis=1,kind='stable')[:,:4];weights17=np.take_along_axis(weights,joints17,axis=1);weights17/=np.maximum(weights17.sum(axis=1)[:,None],1e-9)
   dominant=weights.argmax(axis=1);skin=(point[:,1]>1.49)|np.isin(dominant,[7,10]);category=np.where(skin,0,np.where(point[:,1]<.19,5,np.where(point[:,1]<.91,4,3)))
   if forced is not None:category[:]=forced
   if forced is None:
    thickness=np.where(category==3,.023,np.where(category==4,.012,np.where(category==5,.014,0)))
    point+=nrm*thickness[:,None]
   tris=idx.reshape(-1,3);majority=category[tris];materials=np.array([np.bincount(row,minlength=6).argmax() for row in majority]);bounds.append(point)
   pacc=out.access(point,'VEC3');nacc=out.access(nrm,'VEC3');uacc=out.access(uv,'VEC2');jacc=out.access(joints17,'VEC4',True);wacc=out.access(weights17,'VEC4')
   for material in sorted(set(materials)):
    sub=tris[materials==material].reshape(-1);iac=out.access(sub.reshape(-1,1),'SCALAR',True);primitives.append({'attributes':{'POSITION':pacc,'NORMAL':nacc,'TEXCOORD_0':uacc,'JOINTS_0':jacc,'WEIGHTS_0':wacc},'indices':iac,'material':int(material)});totals[str(material)]=totals.get(str(material),0)+len(sub)//3
 for i,n in enumerate(src.g['nodes']):
  if 'mesh' in n:geometry(src,i,2 if src.g['meshes'][n['mesh']]['primitives'][0]['material']==0 else 1 if src.g['meshes'][n['mesh']]['primitives'][0]['material']==1 else None)
 hairName='Hair_Buns' if gender=='Female' else 'Hair_SimpleParted';hair=Input(source/f'Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/{hairName}.gltf')
 for i,n in enumerate(hair.g['nodes']):
  if 'mesh' in n:geometry(hair,i,2)
 out.g['meshes']=[{'name':f'Rainward {gender} survivor / CC0 adaptation','primitives':primitives}];out.g['nodes'].append({'name':'adapted-surface','mesh':0,'skin':0});out.g['nodes'][0]['children'].append(len(out.g['nodes'])-1)
 out.g['asset']['copyright']='Base mesh, face/eye/hair textures and hair by Quaternius, CC0 1.0. Rainward rig adaptation and clothing surface conversion.'
 dest.mkdir(parents=True,exist_ok=True);file=dest/('survivor-'+gender.lower()+'.glb');sha=out.write(file);allPoints=np.vstack(bounds);return {'path':file.name,'sha256':sha,'bytes':file.stat().st_size,'triangles':sum(totals.values()),'materialTriangles':totals,'bounds':{'min':allPoints.min(axis=0).tolist(),'max':allPoints.max(axis=0).tolist()},'bones':17,'source':f'Superhero_{gender}_FullBody.gltf','hair':hairName}
def main():
 a=argparse.ArgumentParser();a.add_argument('source',type=Path);a.add_argument('--out',type=Path,default=Path(__file__).resolve().parents[1]/'assets/humans');args=a.parse_args()
 source=args.source
 if source.name!='Universal Base Characters[Standard]':source=next(p for p in source.rglob('*') if p.name=='Universal Base Characters[Standard]')
 result=[adapt(source,g,args.out) for g in ['Female','Male']]
 license=(source/'License_Standard.txt').read_text();assert 'CC0' in license;args.out.joinpath('LICENSE-Quaternius.txt').write_text(license)
 args.out.joinpath('manifest.json').write_text(json.dumps({'schema':1,'author':'Quaternius','license':'CC0-1.0','source_url':'https://quaternius.itch.io/universal-base-characters','source_archive':'Universal Base Characters[Standard].zip','source_sha256':'fdbf1804c90dfc1ea03e992bff7da2dfd1a79318e13270a660180f9308455f40','adaptation':'Clothed surfaces, compact textures, 17-bone rest-pose retarget; original gameplay animation and collision retained. No paid Source assets.','models':result},indent=2)+'\n');print(json.dumps(result,indent=2))
if __name__=='__main__':main()
