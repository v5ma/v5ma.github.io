"""Restore-input tests, separate from game acceptance; no remote service used."""
import importlib.util, unittest, tempfile, json, zipfile
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'tools/backup.py'
spec=importlib.util.spec_from_file_location('backup',p);backup=importlib.util.module_from_spec(spec);spec.loader.exec_module(backup)
class RestoreTests(unittest.TestCase):
 def archive(self,root,files,corrupt=None,extra=None):
  m={'format':1,'project':'Aether Reach','source':'a'*40,'version':'0.4.0','files':{n:{'size':len(v),'sha256':backup.sha(v)} for n,v in files.items()}}
  zpath=root/'source.zip'
  with zipfile.ZipFile(zpath,'w') as z:
   z.writestr('BACKUP-MANIFEST.json',json.dumps(m))
   for n,v in files.items():z.writestr(n,b'corrupt' if n==corrupt else v)
   if extra:z.writestr(extra,b'extra')
  return zpath
 def test_valid_archive(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);z=self.archive(root,{'aether-reach/test.mjs':b'public'});dest=root/'restored';backup.restore(z,dest);self.assertEqual((dest/'aether-reach/test.mjs').read_bytes(),b'public')
 def test_corruption_is_rejected_before_any_write(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);z=self.archive(root,{'aether-reach/a':b'a','aether-reach/b':b'b'},'aether-reach/b');dest=root/'restored'
   with self.assertRaises(ValueError):backup.restore(z,dest)
   self.assertFalse(dest.exists())
 def test_unsafe_and_noncanonical_paths(self):
  for name in ['../private.txt','/aether-reach/a','aether-reach/../private.txt','aether-reach//file','aether-reach/.env','other-game/code.mjs','aether-reach/test-output/local.json','aether-reach/a\\b']:
   self.assertFalse(backup.allowed(name),name)
 def test_extra_member(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);z=self.archive(root,{'aether-reach/a':b'a'},extra='outside.txt')
   with self.assertRaises(ValueError):backup.restore(z,root/'restored')
 def test_nonempty_destination(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);z=self.archive(root,{'aether-reach/a':b'a'});dest=root/'restored';dest.mkdir();(dest/'mine').write_text('keep')
   with self.assertRaises(ValueError):backup.restore(z,dest)
   self.assertEqual((dest/'mine').read_text(),'keep')
 def test_symlink(self):
  with tempfile.TemporaryDirectory() as tmp:
   root=Path(tmp);z=self.archive(root,{});m={'format':1,'project':'Aether Reach','source':'a'*40,'files':{'aether-reach/link':{'size':1,'sha256':backup.sha(b'x')}}}
   with zipfile.ZipFile(z,'w') as f:
    f.writestr('BACKUP-MANIFEST.json',json.dumps(m));i=zipfile.ZipInfo('aether-reach/link');i.external_attr=0o120777<<16;f.writestr(i,b'x')
   with self.assertRaises(ValueError):backup.restore(z,root/'restored')
if __name__=='__main__':unittest.main()
