"""Pretrained passive-feedback and origin-sensitive authority development assays."""
import argparse
import csv
from fractions import Fraction
import json
from pathlib import Path
import platform
import time
from encoder_v3 import Encoder, digest, np, ort
from commitment_lab import CommitmentStore, Proposal, sign_update

ROOT = Path(__file__).resolve().parent.parent


def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False) + "\n", encoding="utf-8")


def csv_file(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def sigmoid(x):
    return 1 / (1 + np.exp(-np.clip(x, -40, 40)))


def score_bin(value):
    return int(np.clip(np.floor(value / 10 + .5) * 10, 0, 100))


def resolve_origins(artifact, records, roots, known_only=True, overrides=None, trail=()):
    """None means unknown; never treat missing evidence as an empty public set."""
    overrides = {} if overrides is None else overrides
    if artifact in roots:
        return frozenset({artifact})
    if artifact in trail:
        raise ValueError("Cyclic provenance")
    if artifact in overrides:
        return frozenset(overrides[artifact])
    record = records[artifact]
    if known_only and not record["lineage_known"]:
        return None
    found = set()
    assert record["parents"], "A derivative must have declared parents"
    for parent in record["parents"]:
        result = resolve_origins(parent, records, roots, known_only, overrides, trail + (artifact,))
        if result is None:
            return None
        found.update(result)
    assert found
    return frozenset(found)


def passive_null(turns):
    a, b, initial = Fraction(3, 5), Fraction(3, 10), Fraction(3, 4)
    rows = []
    for arm, star, slope in (("positive", Fraction(6, 7), b), ("negative", Fraction(9, 13), -b)):
        h = initial
        for turn in range(turns + 1):
            assert h - star == slope ** turn * (initial - star)
            rows.append({"arm": arm, "turn": turn, "state": float(h), "state_rational": str(h), "fixed_point": float(star), "utterance": "constant", "control_action": "none"})
            q = h if arm == "positive" else 1 - h
            h = a + b * q
    return rows


def feedback_assay(encoder, config, fixtures, dest):
    protocol = config["feedback"]
    positive = fixtures["probe_training"]["positive"]
    negative = fixtures["probe_training"]["negative"]
    training = positive + negative
    base_prefix = "Sentence: "
    train_vectors = encoder.encode([base_prefix + s for s in training], [len(base_prefix)] * len(training))
    labels = np.array([1.] * len(positive) + [-1.] * len(negative))
    # Centered dual ridge fit: no evaluation state or label participates in fitting.
    center = train_vectors.mean(0)
    centered = train_vectors - center
    weight = centered.T @ np.linalg.solve(centered @ centered.T + protocol["probe_ridge"] * np.eye(len(labels)), labels)
    bias = float(-center @ weight)
    sentences = fixtures["fixed_sentences"]
    scores = protocol["scores"]
    texts, starts = [], []
    for sentence in sentences:
        for score in scores:
            prefix = protocol["prefix_template"].format(score=score)
            texts.append(prefix + sentence)
            starts.append(len(prefix))
    states = encoder.encode(texts, starts).reshape(len(sentences), len(scores), 384)
    plain = encoder.encode([base_prefix + s for s in sentences], [len(base_prefix)] * len(sentences))
    probabilities = sigmoid(states @ weight + bias)
    plain_probability = sigmoid(plain @ weight + bias)
    # A deliberate no-policy environment: fixed weights, fixed text, only feedback input changes.
    live = {}
    for i in range(len(sentences)):
        for arm in ("live_positive", "live_negative"):
            q, path = protocol["initial_score"], []
            for turn in range(protocol["turns"]):
                p = float(probabilities[i, scores.index(q)])
                path.append((q, p))
                q = score_bin(100 * (p if arm == "live_positive" else 1 - p))
            live[i, arm] = path
    rows, summaries, sensitivity = [], [], []
    for i, sentence in enumerate(sentences):
        for arm in protocol["arms"]:
            random = np.random.default_rng(protocol["seed"] + i)
            for turn in range(protocol["turns"]):
                if arm in ("live_positive", "live_negative"):
                    q = live[i, arm][turn][0]
                elif arm == "random":
                    q = int(random.choice(scores))
                elif arm == "yoked_positive_next_sentence":
                    q = live[(i + 1) % len(sentences), "live_positive"][turn][0]
                elif arm == "visible_sentence_only":
                    q = score_bin(100 * float(plain_probability[i]))
                else:
                    q = protocol["initial_score"]
                index = scores.index(q)
                p = float(probabilities[i, index])
                rows.append({"sentence": i, "arm": arm, "turn": turn, "score_input": q, "probe": p, "cosine_distance_from_plain": float(1 - states[i, index] @ plain[i]), "utterance": sentence, "control_action": "none"})
            summaries.append({"sentence": i, "arm": arm, "final_probe": p, "final_score_input": q, "delta_from_initial_probe": p - float(probabilities[i, scores.index(50)]), "visible_text_changed": False, "adaptive_controller_present": False})
        sensitivity.append({"sentence": i, "probe_at_score_0": float(probabilities[i, 0]), "probe_at_score_100": float(probabilities[i, -1]), "probe_range_over_all_scores": float(np.ptp(probabilities[i])), "max_cosine_distance_from_score_50": float(np.max(1 - states[i] @ states[i, scores.index(50)])), "positive_minus_negative_final": live[i, "live_positive"][-1][1] - live[i, "live_negative"][-1][1]})
    np.savez_compressed(dest / "encoder-feedback-vectors.npz", training=train_vectors, labels=labels, weight=weight, bias=bias, states=states, plain=plain, probabilities=probabilities)
    csv_file(dest / "feedback-events.csv", rows)
    csv_file(dest / "feedback-metrics.csv", summaries)
    csv_file(dest / "feedback-sensitivity.csv", sensitivity)
    return {"conditions": len(summaries), "events": len(rows), "training_examples": len(training), "probe_training_accuracy": float(np.mean((train_vectors @ weight + bias > 0) == (labels > 0))), "fixed_sentences": len(sentences), "mean_positive_minus_negative_final": float(np.mean([r["positive_minus_negative_final"] for r in sensitivity])), "positive_direction_sentences": sum(r["positive_minus_negative_final"] > 0 for r in sensitivity), "negative_direction_sentences": sum(r["positive_minus_negative_final"] < 0 for r in sensitivity), "no_difference_sentences": sum(r["positive_minus_negative_final"] == 0 for r in sensitivity), "minimum_numeric_prefix_probe_range": min(r["probe_range_over_all_scores"] for r in sensitivity), "useful_behavior_evaluation": "NOT_PERFORMED; fixed text is a plumbing control", "endogenous_control_evidence": "NONE; no adaptive control action exists in this null"}


def scope_assay(encoder, config, fixtures, dest):
    roots = {r["id"]: r for r in fixtures["roots"]}
    root_ids = list(roots)
    artifacts = fixtures["artifacts"]
    records = {a["id"]: a for a in artifacts}
    # No permission labels enter the encoder or root-retrieval scores.
    root_vectors = encoder.encode([r["text"] for r in roots.values()])
    document_vectors = encoder.encode([a["text"] for a in artifacts])
    scores = document_vectors @ root_vectors.T
    rankings = np.argsort(-scores, axis=1, kind="stable")
    truth = {a["id"]: resolve_origins(a["id"], records, roots, known_only=False) for a in artifacts}
    rows, summaries = [], []
    for revision in config["scope"]["revisions"]:
        current = frozenset(config["scope"]["root_permissions"][str(revision)])
        for policy in config["scope"]["policies"]:
            budget = config["scope"]["clarification_budget_per_revision"]
            overrides, used = {}, 0
            gate_revision = 1 if policy == "lineage_stale" else revision
            gate_roots = config["scope"]["root_permissions"][str(gate_revision)]
            store = CommitmentStore()
            store.accept(sign_update(gate_revision, frozenset((r, "export") for r in gate_roots)))
            policy_rows = []
            for i, artifact in enumerate(artifacts):
                clarified = False
                if policy.startswith("semantic"):
                    k = 2 if policy == "semantic_top_two" else 1
                    proposed = frozenset(root_ids[j] for j in rankings[i, :k])
                elif policy == "deny_all":
                    proposed = None
                else:
                    proposed = resolve_origins(artifact["id"], records, roots, overrides=overrides)
                    if proposed is None and policy == "lineage_with_clarification" and used < budget:
                        # Simulated authoritative clarification: ground truth becomes newly available here only.
                        overrides[artifact["id"]] = truth[artifact["id"]]
                        proposed = overrides[artifact["id"]]
                        used += 1
                        clarified = True
                passed = proposed is not None and all(store.commit(Proposal(gate_revision, (r, "export"), frozenset({(r, "export")}))) for r in proposed)
                allowed = truth[artifact["id"]].issubset(current)
                row = {"revision": revision, "policy": policy, "artifact": artifact["id"], "family": artifact["family"], "actual_origins": ",".join(sorted(truth[artifact["id"]])), "proposed_origins": "UNKNOWN" if proposed is None else ",".join(sorted(proposed)), "gate_revision": gate_revision, "truth_allowed": allowed, "executed": bool(passed), "clarified": clarified, "untrusted_claimed_origins": "B,D", "claimed_origins_used": False}
                rows.append(row)
                policy_rows.append(row)
            eligible = sum(r["truth_allowed"] for r in policy_rows)
            useful = sum(r["executed"] and r["truth_allowed"] for r in policy_rows)
            summaries.append({"revision": revision, "policy": policy, "artifacts": len(artifacts), "eligible": eligible, "useful": useful, "unauthorized": sum(r["executed"] and not r["truth_allowed"] for r in policy_rows), "useful_fraction": useful / eligible, "clarifications": used, "unknown_remaining": sum(r["proposed_origins"] == "UNKNOWN" for r in policy_rows)})
    np.savez_compressed(dest / "encoder-scope-vectors.npz", roots=root_vectors, documents=document_vectors, scores=scores, rankings=rankings)
    csv_file(dest / "scope-events.csv", rows)
    csv_file(dest / "scope-metrics.csv", summaries)
    return {"conditions": len(summaries), "events": len(rows), "artifacts": len(artifacts), "families": len({a["family"] for a in artifacts}), "results": summaries, "scope": "constructed origin-sensitive permission stress fixtures; no population estimate", "trusted_components": "fixture authority, provenance attestations, atomic simulation, and clarification oracle", "forged_origin_control": "claimed-origin text is present in the observation record but intentionally unavailable to verified-lineage policies"}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", required=True)
    args = parser.parse_args()
    assert args.run and all(c.isalnum() or c in "-_" for c in args.run)
    dest = ROOT / "results" / args.run
    dest.mkdir(parents=True, exist_ok=False)
    app = ROOT / "applications"
    protocol_path = app / "PROTOCOL-CONTEXT-PROVENANCE-03.json"
    fixture_path = app / "FIXTURES-CONTEXT-PROVENANCE-03.json"
    config = json.loads(protocol_path.read_text(encoding="utf-8"))
    fixtures = json.loads(fixture_path.read_text(encoding="utf-8"))
    source_paths = [protocol_path, fixture_path, Path(__file__), app / "encoder_v3.py", app / "commitment_lab.py"]
    model_root = Path(config["model"]["cache_directory"])
    model_names = ["model.onnx", "config.json", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json", "vocab.txt"]
    inputs = {str(p.relative_to(ROOT)): digest(p) for p in source_paths}
    model_hashes = {n: {"sha256": digest(model_root / n), "bytes": (model_root / n).stat().st_size} for n in model_names}
    write_json(dest / "INPUT-FREEZE.json", {"protocol": config, "sources": inputs, "model_files": model_hashes, "freeze_before_first_task_inference": True})
    start = time.monotonic()
    try:
        encoder = Encoder(config, start + config["resources"]["max_seconds"])
        feedback = feedback_assay(encoder, config, fixtures, dest)
        scope = scope_assay(encoder, config, fixtures, dest)
        null_rows = passive_null(config["passive_null"]["turns"])
        csv_file(dest / "passive-null.csv", null_rows)
        assert all(digest(ROOT / p) == h for p, h in inputs.items())
        assert all(digest(model_root / n) == v["sha256"] for n, v in model_hashes.items())
        size = sum(p.stat().st_size for p in dest.iterdir() if p.is_file())
        elapsed = time.monotonic() - start
        assert elapsed < config["resources"]["max_seconds"] and size < config["resources"]["max_output_bytes"]
        summary = {"execution": "PASS", "scientific_status": "DEVELOPMENT_AND_NULL_CONTROLS_ONLY", "elapsed_seconds": elapsed, "bytes_before_summary": size, "encoder_batches": encoder.calls, "runtime": {"python": platform.python_version(), "numpy": np.__version__, "onnxruntime": ort.__version__, "numerical_threads": 1, "device": "CPU"}, "feedback": feedback, "scope": scope, "passive_null_fixed_point_difference": str(Fraction(15, 91)), "independent_review": False}
        write_json(dest / "SUMMARY.json", summary)
        print(json.dumps(summary, indent=2))
    except Exception as exc:
        write_json(dest / "FAILURE.json", {"error": type(exc).__name__, "message": str(exc), "elapsed_seconds": time.monotonic() - start, "partial_outputs_preserved": True})
        raise


if __name__ == "__main__":
    main()
