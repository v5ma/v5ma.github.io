"""Build or restore a self-contained *public Aether Reach* source snapshot.
No private repositories, runtime accounts, credentials or local player saves.
This is a release snapshot, not a replacement for an independent Git mirror.
"""
from pathlib import Path, PurePosixPath
import argparse, hashlib, json, re, subprocess, zipfile
ROOT=Path(__file__).resolve().parents[2]
def allowed(name):
 p=PurePosixPath(name)
 return (not p.is_absolute() and '..' not in p.parts and '\\' not in name and
  (name in {'index.html','projects.css','.nojekyll'} or name.startswith('aether-reach/') or name.startswith('.github/workflows/aether-')) and
  not any(x in p.parts for x in ['test-output','__pycache__','node_modules','.git']) and
  not any(x.startswith('.env') or x.startswith('integrate-') for x in p.parts) and p.suffix not in {'.pyc','.pem','.key'})
def sha(b):return hashlib.sha256(b).hexdigest()
def build(out):
 if subprocess.run(['git','diff','--quiet','HEAD','--','aether-reach'],cwd=ROOT).returncode:raise ValueError('Commit game changes before creating a release snapshot')
 source=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
 version=json.loads((ROOT/'aether-reach/release.json').read_text())['version']
 if not re.fullmatch(r'\d+\.\d+\.\d+',version):raise ValueError('Invalid release version')
 names=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).decode().split('\0');contents={}
 for name in sorted(n for n in names if n and allowed(n)):
  p=ROOT/name
  if p.is_symlink():raise ValueError('Symlink not permitted: '+name)
  contents[name]=p.read_bytes()
 manifest={'format':1,'project':'Aether Reach','version':version,'source':source,'scope':'Public game snapshot. GitHub revision history and unrelated projects are not included. No browser player saves or private story.','files':{n:{'sha256':sha(b),'size':len(b)}for n,b in contents.items()}}
 out.mkdir(parents=True,exist_ok=True);archive=out/f'Aether-Reach-v{version}-source.zip';data=(json.dumps(manifest,indent=2)+'\n').encode()
 with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as z:
  for name,raw in [*contents.items(),('BACKUP-MANIFEST.json',data)]:
   info=zipfile.ZipInfo(name,(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16;z.writestr(info,raw)
 (out/'BACKUP-MANIFEST.json').write_bytes(data)
 (out/'SHA256SUMS.txt').write_text(sha(archive.read_bytes())+'  '+archive.name+'\n'+sha(data)+'  BACKUP-MANIFEST.json\n')
 print(json.dumps({'archive':str(archive),'source':source,'files':len(contents),'sha256':sha(archive.read_bytes())}));return archive

def restore(archive,dest):
 if dest.exists() and any(dest.iterdir()):raise ValueError('Restore destination must be empty')
 with zipfile.ZipFile(archive) as z:
  if len(z.infolist())>2000 or sum(i.file_size for i in z.infolist())>100_000_000:raise ValueError('Archive exceeds restore limits')
  m=json.loads(z.read('BACKUP-MANIFEST.json'));names=z.namelist()
  if m.get('format')!=1 or m.get('project')!='Aether Reach' or not re.fullmatch('[0-9a-f]{40}',m.get('source','')):raise ValueError('Not a supported source backup')
  if len(names)!=len(set(names)) or set(names)!=set(m['files'])|{'BACKUP-MANIFEST.json'}:raise ValueError('Unexpected archive members')
  for name,spec in m['files'].items():
   if not allowed(name) or (z.getinfo(name).external_attr>>16)&0o170000==0o120000:raise ValueError('Unsafe path: '+name)
   raw=z.read(name)
   if len(raw)!=spec['size'] or sha(raw)!=spec['sha256']:raise ValueError('Checksum mismatch: '+name)
  # Only write after every member has passed validation.
  for name in names:
   p=dest/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(z.read(name))
 print('Restored',len(m['files']),'verified public files at',m['source']);return m
if __name__=='__main__':
 a=argparse.ArgumentParser();a.add_argument('--out',type=Path);a.add_argument('--restore',type=Path);a.add_argument('--destination',type=Path);v=a.parse_args()
 if v.restore:
  if not v.destination:a.error('--restore requires --destination')
  restore(v.restore,v.destination)
 elif v.out:build(v.out)
 else:a.error('Use --out or --restore with --destination')
