"""Run after prepare-street-art.py from the repository root. Curates one named
CC0 source asset; never changes gameplay or runs in verification workflows."""
import urllib.request,pathlib,json,hashlib,io
from PIL import Image
root=pathlib.Path('svgn-planet/assets/street-art')
url='https://dl.polyhaven.org/file/ph-assets/HDRIs/extra/Tonemapped%20JPG/kloppenheim_06_puresky.jpg'
with urllib.request.urlopen(url,timeout=60) as response:data=response.read(30*1024*1024)
assert len(data)<30*1024*1024
source=Image.open(io.BytesIO(data));entry={'type':'sky','author':'Greg Zaal / Jarod Guest / Poly Haven','source':'https://polyhaven.com/a/kloppenheim_06_puresky','sourceUrl':url,'license':'CC0-1.0','sourceSha256':hashlib.sha256(data).hexdigest(),'modification':'Resized official tonemapped JPEG; not an unclipped HDR lighting file.','files':[]}
for size,name in [(4096,'sky-desktop.jpg'),(2048,'sky-mobile.jpg')]:
 im=source.copy();im.thumbnail((size,size//2),Image.Resampling.LANCZOS);p=root/name;im.convert('RGB').save(p,quality=89,optimize=True)
 entry['files'].append({'file':name,'size':list(im.size),'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
p=root/'asset-register.json';registry=json.loads(p.read_text());registry['sources']=[s for s in registry['sources'] if s.get('type')!='sky']+[entry];p.write_text(json.dumps(registry,indent=2))
print(json.dumps(entry,indent=2))
