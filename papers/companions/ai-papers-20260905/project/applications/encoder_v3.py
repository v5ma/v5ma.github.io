"""Bounded offline access to one pre-existing ONNX encoder. No downloads."""
import os
for _key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS", "TOKENIZERS_PARALLELISM"):
    os.environ[_key] = "false" if _key == "TOKENIZERS_PARALLELISM" else "1"
import hashlib
from pathlib import Path
import time
import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer


def digest(path):
    h = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def normalize(x):
    return x / np.maximum(np.linalg.norm(x, axis=-1, keepdims=True), 1e-12)


class Encoder:
    def __init__(self, config, deadline):
        root = Path(config["model"]["cache_directory"])
        options = ort.SessionOptions()
        options.intra_op_num_threads = options.inter_op_num_threads = 1
        options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
        self.session = ort.InferenceSession(str(root / "model.onnx"), sess_options=options, providers=["CPUExecutionProvider"])
        self.tokenizer = Tokenizer.from_file(str(root / "tokenizer.json"))
        # No silent truncation: a changed fixture must pass the explicit ceiling.
        self.tokenizer.no_truncation()
        self.tokenizer.no_padding()
        self.max_tokens = config["model"]["max_tokens"]
        self.batch_size = config["resources"]["batch_size"]
        self.deadline = deadline
        self.calls = 0

    def encode(self, texts, starts=None):
        results = []
        starts = [0] * len(texts) if starts is None else starts
        assert len(starts) == len(texts)
        for offset in range(0, len(texts), self.batch_size):
            if time.monotonic() > self.deadline:
                raise TimeoutError("Bounded encoder budget exhausted before next batch")
            batch = texts[offset:offset + self.batch_size]
            encodings = self.tokenizer.encode_batch(batch)
            width = max(len(e.ids) for e in encodings)
            assert width <= self.max_tokens, (width, self.max_tokens)
            ids = np.zeros((len(batch), width), dtype=np.int64)
            mask = np.zeros_like(ids)
            types = np.zeros_like(ids)
            selection = np.zeros_like(ids)
            for j, e in enumerate(encodings):
                n = len(e.ids)
                ids[j, :n] = e.ids
                mask[j, :n] = 1
                types[j, :n] = e.type_ids
                begin = starts[offset + j]
                if begin == 0:
                    selection[j, :n] = 1
                else:
                    for k, (left, right) in enumerate(e.offsets):
                        if right > left and left >= begin:
                            selection[j, k] = 1
                    assert selection[j].sum() > 0, "No fixed-sentence tokens selected"
                    assert all(left >= begin for k, (left, right) in enumerate(e.offsets) if selection[j, k])
            h = self.session.run(["last_hidden_state"], {"input_ids": ids, "attention_mask": mask, "token_type_ids": types})[0]
            self.calls += 1
            pooled = (h.astype(np.float64) * selection[..., None]).sum(1) / selection.sum(1)[:, None]
            results.append(normalize(pooled))
        result = np.concatenate(results)
        assert np.isfinite(result).all() and result.shape == (len(texts), 384)
        return result
