"""Pinned, single-token ONNX GPT-2 with explicit last-token intervention sites."""
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ[key] = "1"
import gc
import hashlib
import json
from pathlib import Path
import sys
import time
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "runtime-dependencies/onnx-1.19.1"))
import numpy as np
import onnx
import onnxruntime as ort
from tokenizers import Tokenizer

DEPENDENCY = ROOT / "model-dependencies/gpt2-xenova-bf2c7f02"
MODEL = DEPENDENCY / "onnx/decoder_with_past_model_quantized.onnx"
HOOKS = {"r7": "/transformer/h.7/Add_1_output_0",
         "r8": "/transformer/h.8/Add_1_output_0",
         "a9": "/transformer/h.9/attn/Reshape_3_output_0"}
CACHE_IN = [f"past_key_values.{layer}.{kind}" for layer in range(12) for kind in ("key", "value")]
CACHE_OUT = [f"present.{layer}.{kind}" for layer in range(12) for kind in ("key", "value")]

def sha(path):
    with Path(path).open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()

def session_options():
    options = ort.SessionOptions()
    options.intra_op_num_threads = 1
    options.inter_op_num_threads = 1
    options.execution_mode = ort.ExecutionMode.ORT_SEQUENTIAL
    options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_BASIC
    options.enable_cpu_mem_arena = False
    options.enable_mem_pattern = False
    return options

def instrument():
    model = onnx.load(MODEL)
    new_nodes = []
    rename = {}
    for node in model.graph.node:
        for i, value in enumerate(node.input):
            if value in rename:
                node.input[i] = rename[value]
        new_nodes.append(node)
        for alias, target in HOOKS.items():
            if target in node.output:
                output = f"san.{alias}.post"
                new_nodes.append(onnx.helper.make_node("Where", [f"san.{alias}.use", f"san.{alias}.value", target],
                                                       [output], name=f"san.{alias}.intervention"))
                rename[target] = output
    assert set(rename) == set(HOOKS.values())
    del model.graph.node[:]
    model.graph.node.extend(new_nodes)
    for alias, target in HOOKS.items():
        model.graph.input.extend([
            onnx.helper.make_tensor_value_info(f"san.{alias}.use", onnx.TensorProto.BOOL, []),
            onnx.helper.make_tensor_value_info(f"san.{alias}.value", onnx.TensorProto.FLOAT, [1, 1, 768])])
        model.graph.output.extend([
            onnx.helper.make_tensor_value_info(target, onnx.TensorProto.FLOAT, [1, 1, 768]),
            onnx.helper.make_tensor_value_info(f"san.{alias}.post", onnx.TensorProto.FLOAT, [1, 1, 768])])
    onnx.checker.check_model(model)
    serialized = model.SerializeToString()
    digest = hashlib.sha256(serialized).hexdigest()
    del model
    return serialized, digest

class Decoder:
    def __init__(self, modified=True, max_seconds=90):
        self.deadline = time.monotonic() + max_seconds
        self.modified = modified
        assert sha(MODEL) == "f65bfa5c0d033ca3db23ece03d34c12d87ea2e7b3007b8944e4a9122ee64e029"
        self.tokenizer = Tokenizer.from_file(str(DEPENDENCY / "tokenizer.json"))
        if modified:
            blob, self.graph_sha256 = instrument()
            self.session = ort.InferenceSession(blob, sess_options=session_options(), providers=["CPUExecutionProvider"])
            del blob
            gc.collect()
        else:
            self.graph_sha256 = sha(MODEL)
            self.session = ort.InferenceSession(str(MODEL), sess_options=session_options(), providers=["CPUExecutionProvider"])
        self.calls = 0

    def ids(self, text):
        return self.tokenizer.encode(text, add_special_tokens=False).ids

    def empty(self):
        return [np.zeros((1, 12, 0, 64), dtype=np.float32) for _ in CACHE_IN]

    def step(self, token, cache, patches=None):
        if time.monotonic() > self.deadline:
            raise TimeoutError("Bounded GPT-2 assay time ceiling")
        assert len(cache) == 24 and 0 <= token < 50257
        length = cache[0].shape[2]
        assert length < 64 and all(x.shape == (1, 12, length, 64) for x in cache)
        inputs = {"input_ids": np.array([[token]], dtype=np.int64),
                  "attention_mask": np.ones((1, length + 1), dtype=np.int64),
                  **dict(zip(CACHE_IN, cache))}
        patches = patches or {}
        assert set(patches).issubset(HOOKS)
        if self.modified:
            for alias in HOOKS:
                value = np.asarray(patches.get(alias, np.zeros((1, 1, 768))), dtype=np.float32)
                assert value.shape == (1, 1, 768) and np.isfinite(value).all()
                inputs[f"san.{alias}.use"] = np.array(alias in patches, dtype=np.bool_)
                inputs[f"san.{alias}.value"] = value
        else:
            assert not patches
        names = ["logits", *CACHE_OUT]
        if self.modified:
            names += list(HOOKS.values()) + [f"san.{alias}.post" for alias in HOOKS]
        raw = self.session.run(names, inputs)
        self.calls += 1
        values = dict(zip(names, raw))
        result = {"logits": values["logits"][0, -1], "cache": [values[name] for name in CACHE_OUT]}
        if self.modified:
            result["hooks"] = {alias: values[target] for alias, target in HOOKS.items()}
            result["post"] = {alias: values[f"san.{alias}.post"] for alias in HOOKS}
        return result

    def prompt(self, ids):
        assert 2 <= len(ids) <= 48
        cache = self.empty()
        before_penultimate = None
        penultimate = None
        for i, token in enumerate(ids):
            if i == len(ids) - 2:
                before_penultimate = cache
            before = cache
            result = self.step(token, cache)
            cache = result["cache"]
            if i == len(ids) - 2:
                penultimate = result
        result.update({"before": before, "before_penultimate": before_penultimate,
                       "penultimate": penultimate})
        return result

def sanity():
    destination = ROOT / "results/gpt2-adapter-05"
    destination.mkdir(parents=True, exist_ok=False)
    start = time.monotonic()
    text = "When John and Mary went to the store, John gave a book to"
    original = Decoder(modified=False, max_seconds=30)
    ids = original.ids(text)
    baseline = original.prompt(ids)
    del original
    gc.collect()
    decoder = Decoder(max_seconds=40)
    check = decoder.prompt(ids)
    error = float(np.max(np.abs(check["logits"] - baseline["logits"])))
    cache_error = max(float(np.max(np.abs(a-b))) for a, b in zip(check["cache"], baseline["cache"]))
    self_patch = decoder.step(ids[-1], check["before"], {"r8": check["hooks"]["r8"]})
    self_error = float(np.max(np.abs(self_patch["logits"] - check["logits"])))
    cache_path = destination / "prefix-cache.npz"
    np.savez(cache_path, **{str(i): value for i, value in enumerate(check["before"])})
    with np.load(cache_path, allow_pickle=False) as saved:
        reloaded = [saved[str(i)] for i in range(24)]
    reload = decoder.step(ids[-1], reloaded)
    reload_error = float(np.max(np.abs(reload["logits"] - check["logits"])))
    reset = decoder.step(ids[-1], decoder.empty())
    top = np.argsort(check["logits"])[-5:][::-1]
    record = {"status": "PASS" if max(error, cache_error, self_error, reload_error) <= 0.0001 else "FAIL",
              "onnxruntime": ort.__version__, "onnx": onnx.__version__, "numpy": np.__version__,
              "model_sha256": sha(MODEL), "modified_graph_sha256": decoder.graph_sha256,
              "adapter_sha256": sha(Path(__file__)), "single_token_export": True,
              "input_ids": ids, "prompt": text, "token_count": len(ids), "hooks": HOOKS,
              "original_vs_instrumented_max_logit_error": error,
              "original_vs_instrumented_max_cache_error": cache_error,
              "self_replacement_max_logit_error": self_error,
              "persisted_cache_reload_max_logit_error": reload_error,
              "cache_reset_max_logit_difference": float(np.max(np.abs(reset["logits"]-check["logits"]))),
              "top_tokens": [{"id": int(i), "text": decoder.tokenizer.decode([int(i)]),
                              "logit": float(check["logits"][i])} for i in top],
              "elapsed_seconds": time.monotonic()-start,
              "fp32_equivalence": "Not tested; comparison uses the same pinned quantized single-token export",
              "full_sequence_vs_incremental": "Not tested: this export declares sequence length one"}
    (destination / "RECEIPT.json").write_text(json.dumps(record, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(record, indent=2))
    assert record["status"] == "PASS"

if __name__ == "__main__":
    sanity()
