"""Separate finite-data recount, probe refit, token controls, and review plots."""
import argparse
import csv
from fractions import Fraction
import json
import os
from pathlib import Path
import subprocess
import sys
from encoder_v3 import digest, np, Tokenizer

ROOT = Path(__file__).resolve().parent.parent


def read_rows(path):
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def audit(run, review):
    data = ROOT / "results" / run
    dest = ROOT / "reviews" / review
    dest.mkdir(parents=True, exist_ok=False)
    freeze = json.loads((data / "INPUT-FREEZE.json").read_text())
    cfg = freeze["protocol"]
    fixture = json.loads((ROOT / "applications" / "FIXTURES-CONTEXT-PROVENANCE-03.json").read_text())
    (dest / "AUDIT-INPUT-FREEZE.json").write_text(json.dumps({"auditor_sha256": digest(Path(__file__)), "data_input_freeze_sha256": digest(data / "INPUT-FREEZE.json"), "data_files": {p.name: digest(p) for p in data.iterdir() if p.is_file()}}, indent=2) + "\n")
    assert all(digest(ROOT / p) == h for p, h in freeze["sources"].items())
    cache = Path(cfg["model"]["cache_directory"])
    assert all(digest(cache / p) == v["sha256"] for p, v in freeze["model_files"].items())
    tokenizer = Tokenizer.from_file(str(cache / "tokenizer.json"))
    tokenizer.no_padding(); tokenizer.no_truncation()
    token_rows = []
    for i, sentence in enumerate(fixture["fixed_sentences"]):
        selected = []
        for score in cfg["feedback"]["scores"]:
            prefix = cfg["feedback"]["prefix_template"].format(score=score)
            encoded = tokenizer.encode(prefix + sentence)
            selected.append([(k, encoded.ids[k]) for k, (left, right) in enumerate(encoded.offsets) if right > left and left >= len(prefix)])
        token_rows.append({"sentence": i, "identical_sentence_token_ids_and_positions_across_scores": all(x == selected[0] for x in selected), "selected_tokens": len(selected[0])})
    # This stronger control is reported, not assumed from fixed visible strings.
    (dest / "TOKEN-CONTROLS.json").write_text(json.dumps(token_rows, indent=2) + "\n")
    vectors = np.load(data / "encoder-feedback-vectors.npz", allow_pickle=False)
    train = vectors["training"]
    centered = train - train.mean(0)
    weight = centered.T @ np.linalg.solve(centered @ centered.T + cfg["feedback"]["probe_ridge"] * np.eye(len(train)), vectors["labels"])
    bias = float(-train.mean(0) @ weight)
    assert np.allclose(weight, vectors["weight"], atol=1e-12, rtol=0)
    assert abs(bias - float(vectors["bias"])) < 1e-12
    probabilities = 1 / (1 + np.exp(-(vectors["states"] @ weight + bias)))
    assert np.allclose(probabilities, vectors["probabilities"], atol=1e-12, rtol=0)
    for vector_name in ("states", "plain", "training"):
        assert np.allclose(np.linalg.norm(vectors[vector_name], axis=-1), 1, atol=1e-12, rtol=0)
    feedback_events = read_rows(data / "feedback-events.csv")
    assert len(feedback_events) == 960
    feedback_metrics = read_rows(data / "feedback-metrics.csv")
    for row in feedback_events:
        i, q = int(row["sentence"]), int(row["score_input"])
        assert abs(float(row["probe"]) - probabilities[i, cfg["feedback"]["scores"].index(q)]) < 1e-12
        assert row["utterance"] == fixture["fixed_sentences"][i] and row["control_action"] == "none"
    for row in feedback_metrics:
        sequence = [r for r in feedback_events if r["sentence"] == row["sentence"] and r["arm"] == row["arm"]]
        assert len(sequence) == 20 and float(sequence[-1]["probe"]) == float(row["final_probe"])
        i, arm = int(row["sentence"]), row["arm"]
        random = np.random.default_rng(cfg["feedback"]["seed"] + i)
        for t, event in enumerate(sequence):
            if arm.startswith("live_"):
                expected = 50 if t == 0 else int(np.clip(np.floor((float(sequence[t - 1]["probe"]) if arm == "live_positive" else 1 - float(sequence[t - 1]["probe"])) * 10 + .5) * 10, 0, 100))
            elif arm == "random":
                expected = int(random.choice(cfg["feedback"]["scores"]))
            elif arm == "yoked_positive_next_sentence":
                donor = next(r for r in feedback_events if int(r["sentence"]) == (i + 1) % 8 and r["arm"] == "live_positive" and int(r["turn"]) == t)
                expected = int(donor["score_input"])
            elif arm == "visible_sentence_only":
                base = 1 / (1 + np.exp(-(vectors["plain"][i] @ weight + bias)))
                expected = int(np.clip(np.floor(base * 10 + .5) * 10, 0, 100))
            else:
                expected = 50
            assert int(event["score_input"]) == expected, (i, arm, t)
    scope_vectors = np.load(data / "encoder-scope-vectors.npz", allow_pickle=False)
    scores = scope_vectors["documents"] @ scope_vectors["roots"].T
    assert np.allclose(scores, scope_vectors["scores"], atol=1e-12, rtol=0)
    # Iterative ancestry reconstruction, separate from the recursive application implementation.
    root_ids = [r["id"] for r in fixture["roots"]]
    truth, known = {r: {r} for r in root_ids}, {r: {r} for r in root_ids}
    for artifact in fixture["artifacts"]:
        aid, parents = artifact["id"], artifact["parents"]
        assert all(p in truth for p in parents), "Fixture must be topologically ordered"
        truth[aid] = set().union(*(truth[p] for p in parents))
        known[aid] = set().union(*(known[p] for p in parents)) if artifact["lineage_known"] and all(known[p] is not None for p in parents) else None
    scope_events = read_rows(data / "scope-events.csv")
    scope_metrics = read_rows(data / "scope-metrics.csv")
    assert len(scope_events) == 288
    for row in scope_events:
        current = set(cfg["scope"]["root_permissions"][row["revision"]])
        actual = truth[row["artifact"]]
        allowed = actual <= current
        assert row["truth_allowed"] == str(allowed)
        assert set(row["actual_origins"].split(",")) == actual
        policy = row["policy"]
        proposed = None if row["proposed_origins"] == "UNKNOWN" else set(row["proposed_origins"].split(","))
        if policy in ("lineage_current", "lineage_stale"):
            assert proposed == known[row["artifact"]]
        if policy == "lineage_with_clarification" and row["clarified"] == "True":
            assert proposed == actual
        gate_allowed = set(cfg["scope"]["root_permissions"][row["gate_revision"]])
        assert row["executed"] == str(proposed is not None and proposed <= gate_allowed)
        assert row["claimed_origins_used"] == "False"
    for row in scope_metrics:
        subset = [r for r in scope_events if r["revision"] == row["revision"] and r["policy"] == row["policy"]]
        assert int(row["eligible"]) == sum(r["truth_allowed"] == "True" for r in subset)
        assert int(row["useful"]) == sum(r["executed"] == "True" and r["truth_allowed"] == "True" for r in subset)
        assert int(row["unauthorized"]) == sum(r["executed"] == "True" and r["truth_allowed"] == "False" for r in subset)
        assert int(row["clarifications"]) == sum(r["clarified"] == "True" for r in subset)
    null = read_rows(data / "passive-null.csv")
    for arm, star, slope in (("positive", Fraction(6, 7), Fraction(3, 10)), ("negative", Fraction(9, 13), Fraction(-3, 10))):
        initial = Fraction(3, 4)
        for row in [r for r in null if r["arm"] == arm]:
            assert Fraction(row["state_rational"]) - star == slope ** int(row["turn"]) * (initial - star)
    checks = subprocess.run([sys.executable, "-m", "unittest", "test_labs", "test_protocol_v2", "test_context_provenance_v3", "-v"], cwd=ROOT / "applications", capture_output=True, text=True, timeout=20)
    (dest / "APPLICATION-TESTS.log").write_text(checks.stdout + checks.stderr, encoding="utf-8")
    assert checks.returncode == 0
    make_figures(dest, scope_metrics, null, feedback_metrics, probabilities)
    receipt = {"status": "PASS", "application_tests": 21, "probe_refit_and_metrics": True, "all_feedback_arm_transition_rules_recomputed": True, "feedback_events_checked": len(feedback_events), "directly_measured_feedback_states": 88, "scope_events_checked": len(scope_events), "exact_rational_null_rows": len(null), "fixed_sentence_token_position_control": token_rows, "source_model_hashes_unchanged": True, "independent_review": False, "protocol_deviations": ["The forged-origin field is logged but never delivered to a policy. The planned input-injection control is not executed and provides no empirical injection-resistance evidence."], "limits": ["Same authoring agent, separate recount, not independent scientific review", "Probe has training accuracy only; neutral evaluation sentences have no semantic ground truth", "960 lookup-based feedback events reuse 88 measured encoder states, not 960 independent neural inferences", "Stale arm deliberately uses a stale authority store, not the proved current-store premise", "Learned encoder is not generative, and no useful feedback-controlled behavior is evaluated"]}
    (dest / "AUDIT.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(receipt, indent=2))


def make_figures(dest, scope_metrics, null, feedback_metrics, probabilities):
    os.environ["MPLCONFIGDIR"] = str(dest / "matplotlib-cache")
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    plt.rcParams.update({"font.family": "DejaVu Sans", "font.size": 10, "axes.spines.top": False, "axes.spines.right": False, "savefig.dpi": 160})
    figures = dest / "figures"
    figures.mkdir()
    policies = ["semantic_nearest", "semantic_top_two", "lineage_stale", "lineage_current", "lineage_with_clarification", "deny_all"]
    labels = ["Nearest semantic origin", "Top-two semantic origins", "Verified ancestry, stale authority", "Verified ancestry, current authority", "Current ancestry + clarification", "Deny all"]
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.4), layout="constrained")
    for ax, field, title in zip(axes, ("unauthorized", "useful"), ("Prohibited virtual exports", "Permitted virtual exports completed / 20")):
        values = [sum(int(r[field]) for r in scope_metrics if r["policy"] == p) for p in policies]
        ax.barh(labels, values, color=["#777777", "#aaaaaa", "#ad5c43", "#47687a", "#3e7354", "#bbbbbb"])
        ax.invert_yaxis(); ax.set_title(title)
        ax.set_xlim(0, 21)
        for i, value in enumerate(values): ax.text(value + .3, i, str(value), va="center")
    axes[1].set_yticklabels([])
    fig.suptitle("Designed origin-sensitive fixtures: 24 artifacts × 2 authority revisions")
    for suffix in ("png", "svg"): fig.savefig(figures / ("ca-origin-sensitive-results." + suffix))
    plt.close(fig)
    fig, axes = plt.subplots(1, 3, figsize=(13, 4.1), layout="constrained")
    for arm, label, color in (("positive", "q = h", "#3e7354"), ("negative", "q = 1 − h", "#ad5c43")):
        rows = [r for r in null if r["arm"] == arm]
        axes[0].plot([int(r["turn"]) for r in rows], [float(r["state"]) for r in rows], label=label, color=color)
    axes[0].set_title("Passive rational countermodel"); axes[0].set_xlabel("Feedback step"); axes[0].set_ylabel("State h"); axes[0].legend(frameon=False)
    for i, curve in enumerate(probabilities): axes[1].plot(range(0, 101, 10), curve, marker=".", linewidth=1, label=str(i + 1))
    axes[1].set_title("Cached encoder: fixed-sentence probe"); axes[1].set_xlabel("Numerical prefix score"); axes[1].set_ylabel("Uncalibrated probe output")
    differences = []
    for i in range(8):
        values = {r["arm"]: float(r["final_probe"]) for r in feedback_metrics if int(r["sentence"]) == i}
        differences.append(values["live_positive"] - values["live_negative"])
    axes[2].bar(range(1, 9), differences, color="#47687a")
    axes[2].axhline(0, color="black", linewidth=.7)
    axes[2].set_title("Final positive − negative feedback"); axes[2].set_xlabel("Fixed sentence"); axes[2].set_ylabel("Probe difference"); axes[2].set_xticks(range(1, 9))
    fig.suptitle("No adaptive controller, no changed visible sentence, no demonstrated task improvement")
    for suffix in ("png", "svg"): fig.savefig(figures / ("mi-passive-feedback-results." + suffix))
    plt.close(fig)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--run", required=True); parser.add_argument("--review", required=True)
    args = parser.parse_args()
    assert all(all(c.isalnum() or c in "-_" for c in x) for x in (args.run, args.review))
    audit(args.run, args.review)
