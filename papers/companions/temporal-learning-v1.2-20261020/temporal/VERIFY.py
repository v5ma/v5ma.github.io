"""Verify the fixed companion inventory without running scientific models."""
from pathlib import Path
import hashlib
import json

root = Path(__file__).resolve().parent
manifest = json.loads((root / "SOURCE-MANIFEST.json").read_text(encoding="utf-8"))
for row in manifest["files"]:
    path = root / row["path"]
    if (not path.is_file() or path.stat().st_size != row["bytes"] or
            hashlib.sha256(path.read_bytes()).hexdigest() != row["sha256"]):
        raise SystemExit("File-integrity mismatch: " + row["path"])
print(json.dumps({"passed": True, "files": len(manifest["files"]),
                  "scope": "File integrity only; no scientific validation or model execution"}))
