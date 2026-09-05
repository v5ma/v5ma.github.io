"""Small active calibration laboratory. No GPT-2/DeepSeek or introspection claim."""
from __future__ import annotations
import os
for variable in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[variable] = "1"
import argparse
import copy
import csv
import hashlib
import hmac
import json
import math
from pathlib import Path
import time
import numpy as np
from causal_lab import Network, worlds, ridge, predict, sigmoid
from commitment_lab import CommitmentStore, Proposal, sign_update

ROOT = Path(__file__).resolve().parents[1]
KEY = b"public-feedback-v4-fixture-not-a-production-secret"


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode()


def sha(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def envelope(phase, nonce, context, action, reward):
    result = dict(phase=phase, nonce=nonce, context=context, action=action, reward=reward)
    result["signature"] = hmac.new(KEY, canonical(result), "sha256").hexdigest()
    return result


class Learner:
    """A contextual bandit with an explicit authenticated measurement interface."""
    def __init__(self, alpha=0.25):
        self.alpha = alpha
        self.q = np.full((2, 3), 0.5)
        self.visits = [0, 0]
        self.accepted = np.zeros((2, 3), dtype=int)
        self.last_nonce = -1
        self.phase = 1

    def choose(self, context):
        visit = self.visits[context]
        if visit < 3:
            action = visit
        elif visit % 4 == 3:
            action = ((visit - 3) // 4) % 3
        else:
            action = int(self.q[context].argmax())
        self.visits[context] += 1
        return action

    def receive(self, item, authenticate=True):
        fields = ("phase", "nonce", "context", "action", "reward")
        if set(item) != set(fields) | {"signature"}:
            return False
        if any(type(item[k]) is not int for k in fields[:4]):
            return False
        if type(item["reward"]) not in (int, float) or not math.isfinite(item["reward"]):
            return False
        if not 0 <= item["reward"] <= 1 or item["context"] not in (0, 1) or item["action"] not in (0, 1, 2):
            return False
        if item["phase"] != self.phase or item["nonce"] <= self.last_nonce:
            return False
        if not isinstance(item["signature"], str):
            return False
        body = {k: item[k] for k in fields}
        expected = hmac.new(KEY, canonical(body), "sha256").hexdigest()
        if authenticate and not hmac.compare_digest(expected, item["signature"]):
            return False
        context, action = item["context"], item["action"]
        self.q[context, action] += self.alpha * (item["reward"] - self.q[context, action])
        self.accepted[context, action] += 1
        self.last_nonce = item["nonce"]
        return True

    def state(self):
        return dict(alpha=self.alpha, q=self.q.tolist(), visits=self.visits.copy(),
                    accepted=self.accepted.tolist(), last_nonce=self.last_nonce, phase=self.phase)

    @classmethod
    def restore(cls, state):
        result = cls(state["alpha"])
        result.q = np.array(state["q"], dtype=float)
        result.accepted = np.array(state["accepted"], dtype=int)
        result.visits = state["visits"].copy()
        result.last_nonce, result.phase = state["last_nonce"], state["phase"]
        return result

    def digest(self):
        return hashlib.sha256(canonical(self.state())).hexdigest()


def corrected_input(original, action, wiring):
    value = original.copy()
    context = int(value[6] > 0)
    value[2 + context] *= -1
    if action:
        value[2 + ((action - 1) ^ wiring)] *= -1
    return value


def wire_action(context, wiring):
    return 1 + (context ^ wiring)


def fixed_action(policy, learner, context, wiring):
    if policy == "oracle_wiring":
        return wire_action(context, wiring)
    if policy == "fixed_wiring":
        return wire_action(context, 0)
    return int(learner.q[context].argmax())


def measure(net, probe, original, action, wiring, truth, grant):
    changed = corrected_input(original, action, wiring)
    hidden = net.hidden(changed[None, :])
    probability = float(sigmoid(net.tail(hidden))[0])
    readout = float(np.tanh(predict(hidden, probe))[0])
    context = int(original[6] > 0)
    return dict(probability=probability, internal_reward=1 - (readout - grant) ** 2 / 4,
                task_reward=1 - (probability - truth) ** 2,
                restored=int(np.array_equal(changed, original)),
                off_target=int(changed[2 + (1 - context)] != original[2 + (1 - context)]))


def write_csv(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def run(output):
    started = time.monotonic()
    config_path = Path(__file__).with_name("PROTOCOL-ACTIVE-RECEIVER-04.json")
    config = json.loads(config_path.read_text(encoding="utf-8"))
    sources = [config_path, Path(__file__), Path(__file__).with_name("causal_lab.py"),
               Path(__file__).with_name("commitment_lab.py"), ROOT / "results/dev-02/models.json",
               ROOT / "results/dev-02/world-splits.json"]
    frozen = {str(p.relative_to(ROOT)).replace("\\", "/"): sha(p) for p in sources}
    output.mkdir(parents=True, exist_ok=False)
    (output / "INPUT-FREEZE.json").write_bytes(canonical(frozen))
    split = json.loads(sources[-1].read_text(encoding="utf-8"))["worlds"]
    weights = json.loads(sources[-2].read_text(encoding="utf-8"))
    bits, truth, grants = worlds()
    inputs = np.column_stack((bits, np.zeros((256, 2))))
    train, test = split["train"], split["test"]
    assert set(train).isdisjoint(test)
    assert all((w ^ mask) in group for group in (train, test) for w in group for mask in (4, 8, 12))
    schedule = {}
    for context in (0, 1):
        ids = [w for w in train if int(bits[w, 6] > 0) == context]
        order = np.random.default_rng(config["schedule_seed"] + context).permutation(ids).tolist()
        schedule[context] = order
    (output / "TRAINING-SCHEDULE.json").write_bytes(canonical(schedule))
    events, evaluations, attacks, states, metrics = [], [], [], {}, []
    yoked_source = {}
    replay_valid = matched_valid = True

    def ceiling():
        if time.monotonic() - started > config["resources"]["max_seconds"]:
            raise TimeoutError("Single-threaded active-receiver ceiling reached")

    def evaluate(ident, net, probe, learner, policy, wiring, checkpoint):
        rows = []
        for world in test:
            context = int(bits[world, 6] > 0)
            action = fixed_action(policy, learner, context, wiring)
            result = measure(net, probe, inputs[world], action, wiring, truth[world], grants[world])
            proposed = result["probability"] >= 0.5
            virtual_action = ("B" if context else "A", "export")
            authority = frozenset({virtual_action}) if truth[world] else frozenset()
            store = CommitmentStore()
            assert store.accept(sign_update(learner.phase, authority))
            executed = proposed and store.commit(Proposal(learner.phase, virtual_action, frozenset({virtual_action})))
            row = dict(condition=ident, checkpoint=checkpoint, policy=policy, world=world,
                       family=world & ~12, context=context, wiring=wiring, action=action,
                       truth=int(truth[world]), **result, proposed=int(proposed), executed=int(executed),
                       accuracy=int(proposed == bool(truth[world])),
                       raw_unauthorized=int(proposed and not truth[world]),
                       mediated_unauthorized=int(executed and not truth[world]))
            rows.append(row)
        evaluations.extend(rows)
        metrics.append(dict(condition=ident, checkpoint=checkpoint, policy=policy,
                            worlds=len(rows), eligible=sum(r["truth"] for r in rows),
                            useful=sum(r["executed"] for r in rows),
                            raw_unauthorized=sum(r["raw_unauthorized"] for r in rows),
                            mediated_unauthorized=sum(r["mediated_unauthorized"] for r in rows),
                            restoration=sum(r["restored"] for r in rows) / len(rows),
                            off_target=sum(r["off_target"] for r in rows) / len(rows),
                            accuracy=sum(r["accuracy"] for r in rows) / len(rows)))
        return rows

    for seed in config["seeds"]:
        net = Network(seed)
        net.p = {k: np.array(v) for k, v in weights[str(seed)].items()}
        probe = ridge(net.hidden(inputs[train]), grants[train], config["probe_ridge"])
        for budget in config["feedback_queries_per_context_per_phase"]:
            # All live donors are completed before yoking; no fitted/test-world results select them.
            for policy in config["policies"]:
                for start_wiring in config["starting_wirings"]:
                    ceiling()
                    ident = f"s{seed}-b{budget}-w{start_wiring}-{policy}"
                    learner = Learner(config["learning_rate"])
                    evaluate(ident, net, probe, learner, policy, start_wiring, "initial")
                    nonce, last = 0, None
                    learned = policy not in ("fixed_wiring", "oracle_wiring")
                    for phase in (1, 2):
                        wiring = start_wiring ^ (phase - 1)
                        learner.phase = phase
                        if phase == 2:
                            evaluate(ident, net, probe, learner, policy, wiring, "immediate_drift")
                        if learned:
                            for visit in range(budget):
                                for context in (0, 1):
                                    world = schedule[context][visit % len(schedule[context])]
                                    action = learner.choose(context)
                                    result = measure(net, probe, inputs[world], action, wiring, truth[world], grants[world])
                                    donor = ""
                                    if policy in ("live_internal", "external_matched"):
                                        reward = result["internal_reward"]
                                    elif policy == "visible_task":
                                        reward = result["task_reward"]
                                    elif policy == "constant_feedback":
                                        reward = 0.5
                                    elif policy == "yoked_internal":
                                        reward, donor = yoked_source[(seed, budget, 1-start_wiring, phase, context, visit)]
                                    else:
                                        raise ValueError(policy)
                                    before = learner.digest()
                                    last = envelope(phase, nonce, context, action, float(reward))
                                    accepted = learner.receive(last)
                                    assert accepted
                                    event_id = f"{ident}-p{phase}-c{context}-t{visit}"
                                    events.append(dict(event=event_id, condition=ident, policy=policy, phase=phase,
                                                       visit=visit, context=context, world=world, wiring=wiring,
                                                       action=action, reward=float(reward), donor_event=donor,
                                                       internal_reward=result["internal_reward"], task_reward=result["task_reward"],
                                                       envelope=json.dumps(last, sort_keys=True), before=before,
                                                       after=learner.digest(), accepted=int(accepted)))
                                    if policy == "live_internal":
                                        yoked_source[(seed, budget, start_wiring, phase, context, visit)] = (reward, event_id)
                                    nonce += 1
                        evaluate(ident, net, probe, learner, policy, wiring, f"learned_phase_{phase}")
                    states[ident] = learner.state()
                    persisted = Learner.restore(json.loads(json.dumps(learner.state())))
                    replay_valid &= persisted.digest() == learner.digest()
                    evaluate(ident, net, probe, persisted, policy, wiring, "persisted_state_reload")
                    reset = Learner(learner.alpha)
                    reset.phase = learner.phase
                    evaluate(ident, net, probe, reset, policy, wiring, "learner_state_reset")
                    if policy == "external_matched":
                        original = states[f"s{seed}-b{budget}-w{start_wiring}-live_internal"]
                        matched_valid &= canonical(original) == canonical(learner.state())
                    if policy == "live_internal":
                        guarded = copy.deepcopy(learner)
                        unverified = copy.deepcopy(learner)
                        for receiver_name, receiver, authenticate in (("authenticated", guarded, True), ("unverified", unverified, False)):
                            before = receiver.digest()
                            accepted = receiver.receive(last, authenticate=authenticate)
                            attacks.append(dict(condition=ident, receiver=receiver_name, kind="replay",
                                                envelope=json.dumps(last, sort_keys=True), accepted=int(accepted),
                                                before=before, after=receiver.digest()))
                            assert not accepted and before == receiver.digest()
                        for repeat in range(12):
                            for context in (0, 1):
                                wrong = wire_action(1-context, wiring)
                                for action in (0, 1, 2):
                                    bad = envelope(2, nonce, context, action, float(action == wrong))
                                    bad["signature"] = "untrusted-instrument-imitation"
                                    for receiver_name, receiver, authenticate in (("authenticated", guarded, True), ("unverified", unverified, False)):
                                        before = receiver.digest()
                                        accepted = receiver.receive(bad, authenticate=authenticate)
                                        attacks.append(dict(condition=ident, receiver=receiver_name, kind="forged_measurement",
                                                            envelope=json.dumps(bad, sort_keys=True), accepted=int(accepted),
                                                            before=before, after=receiver.digest()))
                                        if authenticate:
                                            assert not accepted and before == receiver.digest()
                                        else:
                                            assert accepted
                                    nonce += 1
                        evaluate(ident, net, probe, guarded, policy, wiring, "after_guarded_attack")
                        evaluate(ident, net, probe, unverified, policy, wiring, "after_unverified_attack")
    assert replay_valid and matched_valid
    assert frozen == {str(p.relative_to(ROOT)).replace("\\", "/"): sha(p) for p in sources}
    for name, rows in (("feedback-events.csv", events), ("evaluation-events.csv", evaluations),
                       ("attack-events.csv", attacks), ("metrics.csv", metrics)):
        write_csv(output / name, rows)
    (output / "LEARNER-STATES.json").write_bytes(canonical(states))
    receipt = dict(status="PASS", conditions=len(states), feedback_events=len(events),
                   evaluation_events=len(evaluations), attack_events=len(attacks),
                   persisted_state_exact=replay_valid, matched_external_state_exact=matched_valid,
                   sources_unchanged=True, seconds=time.monotonic()-started,
                   numerical_threads=1, numpy=np.__version__, transformers_tested=False,
                   independent_review=False, output_bytes=sum(p.stat().st_size for p in output.iterdir() if p.is_file()))
    assert receipt["output_bytes"] < config["resources"]["max_output_bytes"]
    ceiling()
    (output / "EXECUTION-RECEIPT.json").write_bytes(canonical(receipt))
    print(json.dumps(receipt, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    destination = Path(args.output).resolve()
    if not destination.is_relative_to(ROOT / "results"):
        raise SystemExit("Output must stay in this paper's results directory")
    run(destination)
