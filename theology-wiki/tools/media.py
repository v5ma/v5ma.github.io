"""Bundle three museum images only after the museum's API confirms public-domain status.
Existing bundled images are verified by SHA-256. Raw source conversations are never modified.
"""
import hashlib
import io
import json
from pathlib import Path
import time
import urllib.request
from urllib.parse import urlparse
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ENTRIES = [
    ('riders',336215,'A later artistic interpretation of Revelation, not documentary evidence of a modern prediction.','A black-and-white woodcut depicting the four horsemen of the Apocalypse.'),
    ('hours',684184,'A later Christian devotional manuscript, illustrating prayer as a material practice rather than proving the proposed cognitive model.','An illuminated Book of Hours with a miniature and decorated handwritten pages.'),
    ('papyrus',550820,'An Egyptian funerary manuscript for comparative context, not a Samaritan manuscript or proof of a direct textual relationship.','A long papyrus with Egyptian writing and a funerary scene.')
]

def request(url):
    parsed=urlparse(url)
    if parsed.scheme!='https' or not (parsed.hostname=='metmuseum.org' or parsed.hostname.endswith('.metmuseum.org')):
        raise ValueError('Unexpected museum URL')
    error=None
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'TheologyWikiResearch/1.0 (public-domain image preservation)'})
            with urllib.request.urlopen(req,timeout=45) as response:
                data=response.read(16*1024*1024+1)
                if len(data)>16*1024*1024: raise ValueError('Image exceeds size limit')
                return data
        except Exception as exc:
            error=exc
            time.sleep(attempt+1)
    raise RuntimeError(str(error))

registry=ROOT/'data/media.json'
if registry.exists():
    records=json.loads(registry.read_text())
    if len(records)==3 and all((ROOT/m['localPath']).exists() and hashlib.sha256((ROOT/m['localPath']).read_bytes()).hexdigest()==m['sha256'] for m in records):
        print('Verified three existing bundled image hashes.')
        raise SystemExit(0)

records=[]
for ident,object_id,context,alt in ENTRIES:
    api=f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{object_id}'
    data=json.loads(request(api))
    if data.get('objectID')!=object_id or data.get('isPublicDomain') is not True:
        raise ValueError(f'Public-domain status not verified: {object_id}')
    image_url=data.get('primaryImageSmall') or data.get('primaryImage')
    if not image_url:raise ValueError(f'No image returned for {object_id}')
    original=request(image_url)
    with Image.open(io.BytesIO(original)) as image:
        image.convert('RGB').save(ROOT/'assets'/f'{ident}.jpg',format='JPEG',quality=88,optimize=True)
    relative=f'assets/{ident}.jpg'
    records.append({'id':ident,'objectId':object_id,'title':data['title'],'artist':data.get('artistDisplayName') or data.get('culture',''),'date':data.get('objectDate',''),'credit':data.get('creditLine',''),'accession':data.get('accessionNumber',''),'license':'Public Domain / The Metropolitan Museum of Art Open Access','objectURL':data['objectURL'],'apiURL':api,'imageURL':image_url,'localPath':relative,'sha256':hashlib.sha256((ROOT/relative).read_bytes()).hexdigest(),'alt':alt,'context':context,'verification':'isPublicDomain=true in museum API response; original image converted to JPEG for this reader'})
registry.write_text(json.dumps(records,indent=2)+'\n')
print(json.dumps(records,indent=2))
