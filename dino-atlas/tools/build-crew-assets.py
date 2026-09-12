"""Reproduce locally hosted CC0 crew assets. Downloads only exact checksummed sources.
Run explicitly with Python and Node 22. No cloud accounts or runtime service dependency.
"""
from pathlib import Path
from urllib.request import urlopen, Request
import hashlib,io,zipfile,json,subprocess,shutil
D=Path(__file__).resolve().parents[1]
SOURCE='https://kenney.nl/media/pages/assets/animated-characters-survivors/27b16052a7-1774772958/kenney_animated-characters-survivors.zip'
ZIP_HASH='fdadced07a0454c9b7f0b46507be6144a072b4d03b4ffa37f225893c76c62845'
VENDOR={
 'LICENSE':'bfe119ea4fd413f5f7ca3fcd63adb0c4a073ed39daa2fe7d3e6b769e21272601',
 'libs/fflate.module.js':'209a4412eb48ce609edb4391992a792ffcc3983d30ee7e2b0b89a8c470f3cd8a',
 'curves/NURBSCurve.js':'bef2607618a7778455e71a1f0bd206951c382d313e2e245808cc7d3533d60fb6',
 'curves/NURBSUtils.js':'c6bd7c4137d585098923f189687898ea3e8762ea3ecbe255d749a56353894379',
 'exporters/GLTFExporter.js':'3d91af558632f8ced2ac9bb4230f108c4004ef82966338ae001b9fa84be59550',
 'loaders/FBXLoader.js':'f04736fa73501298a45253adc287d712a9e2f2ac9ee9d00ccb92214620407ce6',
 'loaders/GLTFLoader.js':'caba6c51cfd8c7d5313bd7705a54b76bc0a7199d9822ecc497c5311eaffe8e5e',
 'utils/SkeletonUtils.js':'0761b1e003917b215d25dd81439d854b36034b5a57ce84c2cfe3b02428d7b253',
 'utils/BufferGeometryUtils.js':'cbcfe1864abedcc0122cb893373918fe14469491717a34ca6efcc38551805765'}
def get(url,expected):
 data=urlopen(Request(url,headers={'User-Agent':'DinoAtlasAssetReview/1.0'}),timeout=60).read()
 assert hashlib.sha256(data).hexdigest()==expected, 'Source changed; review before accepting '+url
 return data
out=D/'assets/crew';out.mkdir(parents=True,exist_ok=True);temp=D/'tools/.crew-input';temp.mkdir(exist_ok=True)
raw=get(SOURCE,ZIP_HASH)
with zipfile.ZipFile(io.BytesIO(raw)) as z:
 for f in ['Model/characterMedium.fbx','Animations/idle.fbx','Animations/run.fbx']:
  p=temp/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(f))
 for src,dst in [('Skins/survivorMaleB.png','male.png'),('Skins/survivorFemaleA.png','female.png'),('License.txt','LICENSE.txt')]:
  (out/dst).write_bytes(z.read(src))
for path,expected in VENDOR.items():
 url='https://raw.githubusercontent.com/mrdoob/three.js/r177/'+('LICENSE' if path=='LICENSE' else 'examples/jsm/'+path)
 data=get(url,expected);p=D/'vendor/addons'/path;p.parent.mkdir(parents=True,exist_ok=True)
 p.write_text(data.decode().replace("from 'three'", "from '../../three.module.js'"))
subprocess.run(['node',str(D/'tools/build-crew-assets.mjs')],check=True)
assert hashlib.sha256((out/'ranger.glb').read_bytes()).hexdigest()=='042f655423ee399c428c59c01e6c65be7e970c36db0c49f595e6542e1b99c370'
shutil.rmtree(temp)
for name in ['libs','curves','exporters']:shutil.rmtree(D/'vendor/addons'/name)
(D/'vendor/addons/loaders/FBXLoader.js').unlink()
receipt={'pack':'Animated Characters Survivors 1.1','author':'Kenney','license':'CC0','source':SOURCE,'source_sha256':ZIP_HASH,'three_revision':'177','upstream_libraries':VENDOR,'conversion':'Original mesh and two clips; materials replaced with separately hosted original living-human skins. Conversion-only utilities excluded from runtime.','files':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in out.iterdir() if p.name in ['ranger.glb','male.png','female.png','LICENSE.txt']}}
(out/'provenance.json').write_text(json.dumps(receipt,indent=2)+'\n')
print('Verified and converted assets:',receipt['files'])
