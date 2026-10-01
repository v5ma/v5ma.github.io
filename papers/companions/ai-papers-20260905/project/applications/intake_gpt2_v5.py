"""One immutable public ONNX checkpoint; no recursive retrieval or private inputs."""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / "model-dependencies/gpt2-xenova-bf2c7f02"
REVISION = "bf2c7f02e0b826c60d03af341171bde20893da66"
MODEL = "onnx/decoder_with_past_model_quantized.onnx"
MODEL_HASH = "f65bfa5c0d033ca3db23ece03d34c12d87ea2e7b3007b8944e4a9122ee64e029"
FILES = [MODEL, "tokenizer.json", "config.json", "quantize_config.json",
         "tokenizer_config.json", "special_tokens_map.json", "README.md"]

def sha(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def main():
    start = time.monotonic()
    receipt = DEST / "LOCAL-INTAKE-RECEIPT.json"
    if receipt.exists():
        record = json.loads(receipt.read_text(encoding="utf-8"))
        for entry in record["files"]:
            assert sha(DEST / entry["path"]) == entry["sha256"]
        print("Existing pinned intake verified; no download.")
        return
    env = os.environ.copy()
    env.update({"HF_HUB_DISABLE_IMPLICIT_TOKEN": "1", "HF_HUB_DISABLE_TELEMETRY": "1",
                "HF_HUB_DISABLE_XET": "1", "HF_HUB_DOWNLOAD_TIMEOUT": "20",
                "HF_HOME": str(ROOT / "model-dependencies/hf-metadata"),
                "OMP_NUM_THREADS": "1", "OPENBLAS_NUM_THREADS": "1"})
    os.environ.update(env)
    from huggingface_hub import HfApi
    info = HfApi(token=False).model_info("Xenova/gpt2", revision=REVISION, files_metadata=True)
    assert info.sha == REVISION
    entries = {s.rfilename: s for s in info.siblings}
    total = sum(entries[name].size for name in FILES)
    assert total < 130_000_000
    assert entries[MODEL].lfs.sha256 == MODEL_HASH
    DEST.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, "-m", "huggingface_hub.cli.hf", "download", "Xenova/gpt2",
               *FILES, "--revision", REVISION, "--local-dir", str(DEST), "--max-workers", "1"]
    dry = subprocess.run(command + ["--dry-run"], env=env, capture_output=True,
                         text=True, timeout=35, check=True)
    (DEST / "CLI-DRY-RUN.log").write_text(dry.stdout + dry.stderr, encoding="utf-8")
    run = subprocess.run(command, env=env, capture_output=True, text=True, timeout=150)
    (DEST / "CLI-DOWNLOAD.log").write_text(run.stdout + run.stderr, encoding="utf-8")
    run.check_returncode()
    local = []
    for name in FILES:
        path = DEST / name
        assert path.stat().st_size == entries[name].size
        digest = sha(path)
        if entries[name].lfs:
            assert digest == entries[name].lfs.sha256
        local.append({"path": name, "bytes": path.stat().st_size, "sha256": digest,
                      "upstream_blob_id": entries[name].blob_id})
    record = {"status": "PASS", "repository": "Xenova/gpt2", "revision": REVISION,
              "bytes": total, "files": local, "elapsed_seconds": time.monotonic() - start,
              "precision": "community ONNX dynamic quantization; see quantize_config.json",
              "fp32_upstream_equivalence_verified": False, "weights_redistribution_cleared": False,
              "scope": "Public dependency only; no external inference and no private uploads",
              "intake_script_sha256": sha(Path(__file__))}
    receipt.write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: record[key] for key in ("status", "revision", "bytes", "elapsed_seconds")}))

if __name__ == "__main__":
    main()
