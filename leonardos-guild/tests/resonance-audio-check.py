"""Inspect every actual packaged audio file, not only its declared manifest."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
root=Path(__file__).resolve().parents[1];folder=root/'assets/resonance';data=json.loads((folder/'manifest.json').read_text());results=[]
assert len(data['files'])==50
for entry in data['files']:
 p=folder/entry['file'];assert p.is_file();assert hashlib.sha256(p.read_bytes()).hexdigest()==entry['sha256']
 decoded=subprocess.check_output(['ffmpeg','-hide_banner','-loglevel','error','-i',str(p),'-f','f32le','-ac','2','-ar','32000','pipe:1'])
 samples=np.frombuffer(decoded,dtype='<f4').reshape(-1,2);peak=float(np.max(np.abs(samples)));rms=float(np.sqrt(np.mean(samples*samples)))
 duration=len(samples)/32000
 assert abs(duration-entry['duration'])<.06,(p.name,duration)
 assert np.isfinite(samples).all() and 0.0005<rms<.4 and peak<1.05,(p.name,rms,peak)
 seam=float(np.max(np.abs(samples[0]-samples[-1])))
 if entry['loop']:assert seam<.08,(p.name,'loop seam',seam)
 if entry['kind']=='music':assert duration>120 and entry['bars']==64
 results.append({'file':p.name,'duration':round(duration,3),'decodedPeak':round(peak,6),'decodedRms':round(rms,6),'seam':round(seam,6),'sha256':entry['sha256']})
out=root/'resonance-output';out.mkdir(exist_ok=True);(out/'audio-analysis.json').write_text(json.dumps({'files':results,'musicTracks':sum(e['kind']=='music' for e in data['files']),'totalMusicSeconds':sum(e['duration'] for e in data['files'] if e['kind']=='music'),'method':'Actual ffmpeg decode, hash, duration, finite sample, level and loop boundary checks. Not a claim of subjective listening or physical speaker testing.'},indent=2))
print('PASS:',len(results),'packaged audio files decode, match hashes, and satisfy level/duration/loop-boundary checks')
