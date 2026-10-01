"""Separate recount implementation, within the same authoring process, not independent review."""
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"
import argparse
import csv
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import sys
import time
from collections import defaultdict
import numpy as np

ROOT = Path(__file__).resolve().parents[1]


def canon(x):
    return json.dumps(x, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def digest(path):
    with path.open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def rows(path):
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def fresh(alpha):
    return dict(alpha=alpha, q=[[0.5]*3 for _ in range(2)], visits=[0, 0],
                accepted=[[0]*3 for _ in range(2)], last_nonce=-1, phase=1)


def state_hash(state):
    return hashlib.sha256(canon(state)).hexdigest()


def apply_reward(state, message):
    c, a = message["context"], message["action"]
    state["q"][c][a] += state["alpha"] * (message["reward"] - state["q"][c][a])
    state["accepted"][c][a] += 1
    state["last_nonce"] = message["nonce"]


def main(source, output):
    started = time.monotonic()
    output.mkdir(parents=True, exist_ok=False)
    protocol = json.loads((ROOT / "applications/PROTOCOL-ACTIVE-RECEIVER-04.json").read_text())
    freeze = json.loads((source / "INPUT-FREEZE.json").read_text())
    assert all(digest(ROOT / path) == expected for path, expected in freeze.items())
    paths = [Path(__file__), ROOT / "applications/test_active_receiver_v4.py"] + list(source.iterdir())
    (output / "AUDIT-INPUT-FREEZE.json").write_bytes(canon({str(p.relative_to(ROOT)).replace("\\", "/"): digest(p) for p in paths if p.is_file()}))
    split = json.loads((ROOT / "results/dev-02/world-splits.json").read_text())["worlds"]
    weights = json.loads((ROOT / "results/dev-02/models.json").read_text())
    events = rows(source / "feedback-events.csv")
    evals = rows(source / "evaluation-events.csv")
    attacks = rows(source / "attack-events.csv")
    metrics = rows(source / "metrics.csv")
    saved = json.loads((source / "LEARNER-STATES.json").read_text())
    schedule = json.loads((source / "TRAINING-SCHEDULE.json").read_text())
    by_event = {row["event"]: row for row in events}
    assert len(by_event) == len(events)
    bits = np.array([[2*((i >> k) & 1)-1 for k in range(8)] for i in range(256)], dtype=float)
    x = np.column_stack([bits, np.zeros((256, 2))])
    selected = (bits[:, 6] > 0).astype(int)
    idx = np.arange(256)
    grants = bits[idx, 2+selected]
    target = ((bits[idx, selected] == bits[:, 7]) & (grants > 0) & (bits[idx, 4+selected] < 0)).astype(int)
    models = {seed: {k: np.array(v) for k, v in p.items()} for seed, p in weights.items()}
    probe = {}

    def hidden(seed, value):
        p = models[str(seed)]
        return np.tanh(value @ p["w1"] + p["b1"])

    for seed in protocol["seeds"]:
        design = np.column_stack([np.ones(len(split["train"])), hidden(seed, x[split["train"]])])
        regularizer = np.eye(design.shape[1])*protocol["probe_ridge"]
        regularizer[0, 0] = 0
        probe[seed] = np.linalg.solve(design.T @ design + regularizer, design.T @ grants[split["train"]])

    measured = {}
    def measurement(seed, world, action, wiring):
        key = seed, world, action, wiring
        if key not in measured:
            value = x[world].copy()
            value[2+selected[world]] *= -1
            if action:
                value[2+((action-1)^wiring)] *= -1
            h = hidden(seed, value[None, :])
            p = models[str(seed)]
            logit = ((np.tanh(h @ p["w2"]+p["b2"]) @ p["wo"])+p["bo"])[0, 0]
            probability = float(1 / (1 + np.exp(-np.clip(logit, -40, 40))))
            decoded = float(np.tanh(np.column_stack([np.ones(1), h]) @ probe[seed])[0])
            measured[key] = (probability, 1-(decoded-grants[world])**2/4,
                             1-(probability-target[world])**2,
                             int(np.array_equal(value, x[world])),
                             int(value[2+(1-selected[world])] != x[world, 2+(1-selected[world])]))
        return measured[key]

    def identity(condition):
        a, b, c, policy = condition.split("-", 3)
        return int(a[1:]), int(b[1:]), int(c[1:]), policy

    active, phase_one = {}, {}
    for row in events:
        condition = row["condition"]
        seed, budget, first_wiring, policy = identity(condition)
        if condition not in active:
            active[condition] = fresh(protocol["learning_rate"])
        state = active[condition]
        phase, c, visit, a, world, wiring = (int(row[k]) for k in ("phase", "context", "visit", "action", "world", "wiring"))
        if phase != state["phase"]:
            phase_one[condition] = json.loads(json.dumps(state))
            state["phase"] = phase
        n = state["visits"][c]
        expected = n if n < 3 else (((n-3)//4)%3 if n%4 == 3 else int(np.argmax(state["q"][c])))
        assert expected == a
        state["visits"][c] += 1
        assert state_hash(state) == row["before"]
        assert world in split["train"] and world == schedule[str(c)][visit % len(schedule[str(c)])]
        assert selected[world] == c and wiring == (first_wiring ^ (phase-1))
        _, internal, task, _, _ = measurement(seed, world, a, wiring)
        assert abs(internal - float(row["internal_reward"])) < 1e-12
        assert abs(task - float(row["task_reward"])) < 1e-12
        if policy in ("live_internal", "external_matched"):
            reward = internal
        elif policy == "visible_task":
            reward = task
        elif policy == "constant_feedback":
            reward = 0.5
        else:
            donor = by_event[row["donor_event"]]
            assert identity(donor["condition"]) == (seed, budget, 1-first_wiring, "live_internal")
            assert all(donor[k] == row[k] for k in ("phase", "context", "visit", "world"))
            reward = float(donor["reward"])
        assert abs(reward - float(row["reward"])) < 1e-12
        message = json.loads(row["envelope"])
        body = {k: message[k] for k in ("phase", "nonce", "context", "action", "reward")}
        signature = hmac.new(b"public-feedback-v4-fixture-not-a-production-secret", canon(body), "sha256").hexdigest()
        assert message["signature"] == signature and message["nonce"] > state["last_nonce"]
        assert (message["phase"], message["context"], message["action"]) == (phase, c, a)
        assert message["reward"] == float(row["reward"]) and row["accepted"] == "1"
        apply_reward(state, message)
        assert state_hash(state) == row["after"]
    assert all(canon(value) == canon(saved[key]) for key, value in active.items())

    attack_states = {}
    for row in attacks:
        key = row["condition"], row["receiver"]
        if key not in attack_states:
            attack_states[key] = json.loads(json.dumps(saved[row["condition"]]))
        state = attack_states[key]
        assert state_hash(state) == row["before"]
        message = json.loads(row["envelope"])
        body = {k: v for k, v in message.items() if k != "signature"}
        valid_signature = hmac.compare_digest(message["signature"], hmac.new(b"public-feedback-v4-fixture-not-a-production-secret", canon(body), "sha256").hexdigest())
        accepted = (valid_signature or row["receiver"] == "unverified") and message["phase"] == state["phase"] and message["nonce"] > state["last_nonce"]
        assert int(accepted) == int(row["accepted"])
        if accepted:
            apply_reward(state, message)
        assert state_hash(state) == row["after"]
    grouped = defaultdict(list)
    for row in evals:
        condition, checkpoint = row["condition"], row["checkpoint"]
        seed, budget, first_wiring, policy = identity(condition)
        world, a, wiring = int(row["world"]), int(row["action"]), int(row["wiring"])
        assert world in split["test"] and world not in split["train"]
        assert wiring == (first_wiring if checkpoint in ("initial", "learned_phase_1") else 1-first_wiring)
        if checkpoint in ("initial", "learner_state_reset"):
            state = fresh(protocol["learning_rate"])
        elif checkpoint in ("learned_phase_1", "immediate_drift"):
            state = phase_one.get(condition, fresh(protocol["learning_rate"]))
        elif checkpoint.startswith("after_"):
            state = attack_states[condition, "authenticated" if checkpoint == "after_guarded_attack" else "unverified"]
        else:
            state = saved[condition]
        c = int(selected[world])
        expected_action = 1+(c ^ wiring) if policy == "oracle_wiring" else 1+c if policy == "fixed_wiring" else int(np.argmax(state["q"][c]))
        assert a == expected_action
        probability, internal, task, restored, off_target = measurement(seed, world, a, wiring)
        for k, expected in (("probability", probability), ("internal_reward", internal), ("task_reward", task), ("restored", restored), ("off_target", off_target)):
            assert abs(float(row[k])-expected) < 1e-12
        allowed, proposed = int(target[world]), int(probability >= 0.5)
        expected = dict(truth=allowed, proposed=proposed, executed=allowed*proposed,
                        raw_unauthorized=(1-allowed)*proposed, mediated_unauthorized=0,
                        accuracy=int(proposed == allowed))
        assert all(int(row[k]) == value for k, value in expected.items())
        grouped[condition, checkpoint].append(row)
    for row in metrics:
        group = grouped[row["condition"], row["checkpoint"]]
        assert len(group) == len(split["test"]) == int(row["worlds"])
        assert {int(r["world"]) for r in group} == set(split["test"])
        for name, key in (("eligible", "truth"), ("useful", "executed"), ("raw_unauthorized", "raw_unauthorized"), ("mediated_unauthorized", "mediated_unauthorized")):
            assert int(row[name]) == sum(int(r[key]) for r in group)
        for name, key in (("restoration", "restored"), ("off_target", "off_target"), ("accuracy", "accuracy")):
            assert abs(float(row[name])-sum(float(r[key]) for r in group)/len(group)) < 1e-12
    summaries = []
    for budget in protocol["feedback_queries_per_context_per_phase"]:
        for policy in protocol["policies"]:
            checkpoints = sorted({r["checkpoint"] for r in metrics if r["policy"] == policy})
            for checkpoint in checkpoints:
                group = [r for r in metrics if identity(r["condition"])[1] == budget and r["policy"] == policy and r["checkpoint"] == checkpoint]
                summaries.append(dict(budget=budget, policy=policy, checkpoint=checkpoint, conditions=len(group),
                    useful=sum(int(r["useful"]) for r in group), eligible=sum(int(r["eligible"]) for r in group),
                    raw_unauthorized=sum(int(r["raw_unauthorized"]) for r in group),
                    restoration=float(np.mean([float(r["restoration"]) for r in group])),
                    off_target=float(np.mean([float(r["off_target"]) for r in group]))))
    (output / "AGGREGATES.json").write_bytes(canon(summaries))
    completed = subprocess.run([sys.executable, "-m", "unittest", "test_labs", "test_protocol_v2", "test_context_provenance_v3", "test_active_receiver_v4", "-v"], cwd=ROOT / "applications", capture_output=True, text=True, timeout=20)
    (output / "APPLICATION-TESTS.log").write_text(completed.stdout+completed.stderr, encoding="utf-8")
    assert completed.returncode == 0
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    figdir = output / "figures"
    figdir.mkdir()
    selection = [r for r in summaries if r["budget"] == 48 and r["checkpoint"] == "learned_phase_2"]
    labels = [r["policy"].replace("_", "\n") for r in selection]
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.5))
    axes[0].bar(labels, [r["restoration"] for r in selection], color="#496c84")
    axes[0].set(ylabel="Fraction of inputs exactly restored", ylim=(0, 1.08), title="Active calibration after wiring reversal")
    axes[1].bar(labels, [r["useful"] for r in selection], color="#497f63")
    axes[1].axhline(48, linestyle="--", color="#555555", linewidth=1)
    axes[1].set(ylabel="Useful virtual exports (48 eligible)", ylim=(0, 52), title="Restoration does not repair model competence")
    for axis in axes:
        axis.tick_params(axis="x", labelsize=8)
    fig.suptitle("48 feedback queries per context per phase; three seeds x two wirings\nPaired development conditions, not independent population estimates", fontsize=10)
    fig.tight_layout()
    fig.savefig(figdir / "active-calibration-results.png", dpi=160)
    fig.savefig(figdir / "active-calibration-results.svg")
    plt.close(fig)
    receipt = dict(status="PASS", feedback_events_recomputed=len(events), evaluation_events_recomputed=len(evals),
                   attack_envelopes_replayed=len(attacks), metric_rows_recounted=len(metrics),
                   regression_test_exit=completed.returncode, test_count=27,
                   original_inputs_unchanged=True, independent_review=False, seconds=time.monotonic()-started)
    assert all(digest(ROOT / path) == expected for path, expected in freeze.items())
    (output / "AUDIT.json").write_bytes(canon(receipt))
    print(json.dumps(receipt, indent=2))
    print(json.dumps([r for r in summaries if r["policy"] in ("live_internal", "visible_task") and r["checkpoint"] in ("initial", "learned_phase_1", "immediate_drift", "learned_phase_2", "after_unverified_attack")], indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    source, output = Path(args.source).resolve(), Path(args.output).resolve()
    if not source.is_relative_to(ROOT / "results") or not output.is_relative_to(ROOT / "reviews"):
        raise SystemExit("Only this paper's exact result/review roots are permitted")
    main(source, output)
