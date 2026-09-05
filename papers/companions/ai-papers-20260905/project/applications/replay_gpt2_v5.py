"""Six deterministic data artifacts, one bounded same-runtime replay."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "results/gpt2-receiver-05"
OUT = ROOT / "results/gpt2-receiver-05-replay-01"

def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream,"sha256").hexdigest()

assert not OUT.exists()
freeze = json.loads((SOURCE/"INPUT-FREEZE.json").read_text())
assert all(sha(ROOT/name) == digest for name,digest in freeze.items())
run = subprocess.run([sys.executable,str(ROOT/"applications/gpt2_receiver_v5.py"),"--output",str(OUT)],
                     capture_output=True,text=True,timeout=85)
if run.returncode:
    print(run.stdout+run.stderr)
    raise SystemExit(run.returncode)
names = ["INPUT-FREEZE.json","FAMILIES.json","intervention-events.csv","authority-events.csv","hook-states.npz","metrics.csv"]
matches = {name:{"source":sha(SOURCE/name),"replay":sha(OUT/name)} for name in names}
passed = all(pair["source"] == pair["replay"] for pair in matches.values())
receipt = {"status":"PASS" if passed else "FAIL", "artifacts":matches,"matched_artifacts":sum(pair["source"]==pair["replay"] for pair in matches.values()),
           "same_model_machine_and_runtime":True,"independent_replication":False,"wrapper_sha256":sha(Path(__file__))}
(OUT/"REPLAY-RECEIPT.json").write_text(json.dumps(receipt,indent=2)+"\n")
print(json.dumps(receipt,indent=2))
assert passed
