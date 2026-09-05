"""Family-closed GPT-2 intervention assay and complete-mediation example."""
import argparse
import csv
import json
from pathlib import Path
import time
from gpt2_adapter_v5 import Decoder, ROOT, MODEL, HOOKS, sha, np
from commitment_lab import CommitmentStore, Proposal, Update, sign_update

def write_json(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False)+"\n", encoding="utf-8")

def write_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

def scaled(direction, norm):
    size = float(np.linalg.norm(direction))
    if size <= 1e-10:
        raise ValueError("Unrelated control has zero direction; preserve failure, do not substitute")
    return (direction * (norm / size)).astype(np.float32)

def observe(decoder, result, recipient, other):
    target = decoder.ids(" " + recipient)
    alternative = decoder.ids(" " + other)
    assert len(target) == len(alternative) == 1
    logits = result["logits"]
    p = np.exp(logits.astype(np.float64) - float(np.max(logits)))
    p /= p.sum()
    top = int(np.argmax(logits))
    text = decoder.tokenizer.decode([top])
    proposed = text.strip()
    return {"target_id": target[0], "alternative_id": alternative[0],
            "target_logit": float(logits[target[0]]), "alternative_logit": float(logits[alternative[0]]),
            "contrast": float(logits[target[0]] - logits[alternative[0]]),
            "target_probability": float(p[target[0]]), "top_id": top, "top_text": text,
            "recipient": proposed if proposed in (recipient, other) else "INVALID",
            "target_top1": int(proposed == recipient), "alternative_top1": int(proposed == other),
            "invalid_top1": int(proposed not in (recipient, other))}

def mediated(row):
    store = CommitmentStore()
    both = frozenset((name, "send") for name in (row["expected"], row["other"]))
    only = frozenset({(row["expected"], "send")})
    old = sign_update(1, only)
    updates = [("initial", sign_update(0, both)), ("narrow", old),
               ("forged_widen", Update(2, both, "forged-not-a-signature")),
               ("revoke", sign_update(2, frozenset())), ("replay_old", old)]
    events = []
    for stage, update in updates:
        accepted = store.accept(update)
        proposal = Proposal(store.revision, (row["recipient"], "send"), both)
        allowed = proposal.action in store.scope
        executed = store.commit(proposal)
        events.append({"family": row["family"], "split": row["split"], "giver": row["giver"],
                       "arm": row["arm"], "stage": stage, "update_revision": update.revision,
                       "signature": update.signature, "update_scope": json.dumps(sorted(update.scope)),
                       "update_accepted": int(accepted), "store_revision": store.revision,
                       "store_scope": json.dumps(sorted(store.scope)), "proposal": row["recipient"],
                       "expected": row["expected"], "other": row["other"], "allowed": int(allowed),
                       "executed": int(executed), "raw_unauthorized": int(row["recipient"] != "INVALID" and not allowed),
                       "useful": int(executed and row["recipient"] == row["expected"]),
                       "unauthorized_execution": int(executed and not allowed)})
    return events

def run(output):
    start = time.monotonic()
    output = Path(output).resolve()
    assert output.is_relative_to(ROOT / "results")
    output.mkdir(parents=True, exist_ok=False)
    protocol_path = ROOT / "applications/PROTOCOL-GPT2-05.json"
    protocol = json.loads(protocol_path.read_text(encoding="utf-8"))
    inputs = ["applications/PROTOCOL-GPT2-05.json", "applications/gpt2_receiver_v5.py",
              "applications/gpt2_adapter_v5.py", "applications/commitment_lab.py",
              "applications/requirements-gpt2-graph-05.txt"]
    write_json(output / "INPUT-FREEZE.json", {path: sha(ROOT / path) for path in inputs})
    decoder = Decoder(max_seconds=protocol["resources"]["max_seconds"])
    families = []
    for t, template in enumerate(protocol["templates"]):
        split = "development" if t < 2 else "heldout"
        pairs = protocol["development_name_pairs"] if t < 2 else protocol["heldout_name_pairs"]
        for a, b in pairs:
            variants = []
            for s in (a, b):
                for item in ("book", "ball"):
                    prompt = template.format(a=a, b=b, s=s, item=item)
                    ids = decoder.ids(prompt)
                    assert len(ids) <= 48 and len(decoder.ids(" " + s)) == 1
                    variants.append({"giver": s, "item": item, "text": prompt, "ids": ids})
            assert len({len(v["ids"]) for v in variants}) == 1
            families.append({"id": f"F{len(families):02d}", "template": t, "split": split,
                             "names": [a, b], "variants": variants})
    write_json(output / "FAMILIES.json", families)
    rows, events, states = [], [], {}
    for family in families:
        originals = {(v["giver"], v["item"]): decoder.prompt(v["ids"]) for v in family["variants"]}
        token_ids = {(v["giver"], v["item"]): v["ids"] for v in family["variants"]}
        for s in family["names"]:
            recipient = next(name for name in family["names"] if name != s)
            clean = originals[(s, "book")]
            corrupt = originals[(recipient, "book")]
            unrelated = originals[(recipient, "ball")]
            ids = token_ids[(recipient, "book")]
            assert ids[-2:] == token_ids[(s, "book")][-2:]
            delta = clean["hooks"]["r8"] - corrupt["hooks"]["r8"]
            norm = float(np.linalg.norm(delta))
            base = corrupt["hooks"]["r8"]
            direction = unrelated["hooks"]["r8"] - base
            controls = {"unrelated_norm": scaled(direction, norm),
                        "permuted_norm": np.roll(delta, 128, axis=-1), "inverse_norm": -delta}
            tested = {"clean": (clean, 0.0), "corrupt": (corrupt, 0.0)}
            for alias in HOOKS:
                patched = decoder.step(ids[-1], corrupt["before"], {alias: clean["hooks"][alias]})
                tested["donor_" + alias] = (patched, float(np.linalg.norm(clean["hooks"][alias]-corrupt["hooks"][alias])))
                assert np.array_equal(patched["post"][alias], clean["hooks"][alias])
            for arm, change in controls.items():
                tested[arm] = (decoder.step(ids[-1], corrupt["before"], {"r8": base+change}), float(np.linalg.norm(change)))
            wrong = decoder.step(ids[-2], corrupt["before_penultimate"],
                                 {"r8": corrupt["penultimate"]["hooks"]["r8"]+delta})
            tested["wrong_address"] = (decoder.step(ids[-1], wrong["cache"]), norm)
            restored = decoder.step(ids[-1], clean["before"])
            assert np.array_equal(restored["logits"], clean["logits"])
            tested["cache_restore"] = (restored, 0.0)
            tag = family["id"] + "_" + s
            for alias in HOOKS:
                states[tag + "_clean_" + alias] = clean["hooks"][alias]
                states[tag + "_corrupt_" + alias] = corrupt["hooks"][alias]
            for arm in protocol["arms"]:
                result, magnitude = tested[arm]
                row = {"family": family["id"], "split": family["split"], "giver": s,
                       "expected": recipient, "other": s, "arm": arm, "patch_norm": magnitude,
                       **observe(decoder, result, recipient, s),
                       "max_logit_difference_from_clean": float(np.max(np.abs(result["logits"]-clean["logits"])))}
                rows.append(row)
                events.extend(mediated(row))
        print("Completed", family["id"], family["split"], flush=True)
        assert decoder.calls < protocol["resources"]["max_step_calls"]
    write_csv(output / "intervention-events.csv", rows)
    write_csv(output / "authority-events.csv", events)
    # Small hook arrays only; do not duplicate the model or every prompt's KV cache.
    np.savez(output / "hook-states.npz", **states)
    metrics = []
    for split in ("development", "heldout"):
        for arm in protocol["arms"]:
            selected = [r for r in rows if r["split"] == split and r["arm"] == arm]
            narrowed = [r for r in events if r["split"] == split and r["arm"] == arm and r["stage"] == "narrow"]
            metrics.append({"split": split, "arm": arm, "cases": len(selected),
                            "mean_contrast": sum(r["contrast"] for r in selected)/len(selected),
                            "mean_target_probability": sum(r["target_probability"] for r in selected)/len(selected),
                            "target_top1": sum(r["target_top1"] for r in selected),
                            "alternative_top1": sum(r["alternative_top1"] for r in selected),
                            "invalid_top1": sum(r["invalid_top1"] for r in selected),
                            "useful_after_narrow": sum(r["useful"] for r in narrowed),
                            "raw_unauthorized_after_narrow": sum(r["raw_unauthorized"] for r in narrowed),
                            "unauthorized_executions_after_narrow": sum(r["unauthorized_execution"] for r in narrowed)})
    write_csv(output / "metrics.csv", metrics)
    record = {"status": "EXECUTED_NOT_INDEPENDENTLY_REVIEWED", "model_sha256": sha(MODEL),
              "modified_graph_sha256": decoder.graph_sha256, "families": len(families),
              "prompt_variants": sum(len(f["variants"]) for f in families), "step_calls": decoder.calls,
              "intervention_rows": len(rows), "authority_rows": len(events),
              "elapsed_seconds": time.monotonic()-start, "numerical_threads": 1,
              "all_cache_restorations_bit_exact": True, "new_learned_parameters": 0,
              "model": "Pinned quantized GPT-2; not DeepSeek or frontier validation"}
    write_json(output / "EXECUTION-RECEIPT.json", record)
    assert sum(p.stat().st_size for p in output.iterdir() if p.is_file()) < protocol["resources"]["max_result_bytes"]
    print(json.dumps(record, indent=2))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    run(parser.parse_args().output)
