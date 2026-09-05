"""Read-only verification of the finite public distribution manifest."""
import hashlib
import json
from pathlib import Path, PurePosixPath

def main():
    root = Path(__file__).resolve().parent
    manifest = json.loads((root / "PUBLIC-MANIFEST.json").read_text(encoding="utf-8"))
    files = manifest["files"]
    if not 2 <= len(files) <= 1200:
        raise ValueError("Unexpected distribution size")
    names = set()
    total = 0
    for row in files:
        name = row["path"]
        p = PurePosixPath(name)
        if p.is_absolute() or ".." in p.parts or "\\" in name or ":" in name or name in names:
            raise ValueError("Unsafe or duplicate distribution path")
        names.add(name)
        path = root / name
        if not path.resolve().is_relative_to(root) or not path.is_file():
            raise ValueError("Missing or escaped distribution file: " + name)
        if path.stat().st_size != row["bytes"]:
            raise ValueError("Size mismatch: " + name)
        with path.open("rb") as stream:
            actual = hashlib.file_digest(stream, "sha256").hexdigest()
        if actual != row["sha256"]:
            raise ValueError("Hash mismatch: " + name)
        total += row["bytes"]
    if total != manifest["total_bytes_excluding_manifest"]:
        raise ValueError("Distribution total mismatch")
    print(json.dumps({"status": "PASS", "files": len(files), "bytes": total,
                      "model_runs": 0, "compiler_jobs": 0, "writes": 0,
                      "boundary": "Declared file integrity, not scientific validation or author signature"}, indent=2))

if __name__ == "__main__":
    main()
