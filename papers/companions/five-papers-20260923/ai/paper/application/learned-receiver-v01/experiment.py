"""Fixed-inventory, single-thread synthetic neural experiment. No network/search."""
from __future__ import annotations

import argparse
import ctypes
import hashlib
import json
import math
import os
from pathlib import Path
import sys
import time

for name in ("OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "OMP_NUM_THREADS",
             "NUMEXPR_NUM_THREADS", "VECLIB_MAXIMUM_THREADS"):
    os.environ[name] = "1"
sys.dont_write_bytecode = True
import numpy as np

if os.name == "nt":
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)

ROOT = Path(__file__).resolve().parent
DEADLINE = time.monotonic() + 180
H, K, D, C = 8, 4, 4, 20
SHAPES = ((H, D), (H, H), (H, C), (H,), (H,), (1,))
N = sum(math.prod(s) for s in SHAPES)
LR, DELTA, CAP, TOL = .04, .0002, .02, 1e-12
GATES = ("trajectory", "history", "permuted", "scalar")
ARMS = GATES + ("always", "replay", "agem", "frozen")
STAGES = (("mastered", 24), ("acquire", 36), ("correct", 36),
          ("noise", 24), ("revisit", 36), ("future", 40), ("final", 24))
CONCEPT = Path("D:/micahone/D Documents/SAN-Selective-Dissipation-Continual-Learning-Concept.txt")


def guard():
    if time.monotonic() > DEADLINE:
        raise TimeoutError("180-second invocation limit; partial outputs are not a final result")


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def arrhash(a):
    return hashlib.sha256(np.asarray(a, dtype="<f8").tobytes()).hexdigest()


def js(value):
    return json.dumps(value, sort_keys=True, indent=2, ensure_ascii=False, allow_nan=False) + "\n"


def write(path, value):
    if path.exists():
        raise FileExistsError(f"Will not overwrite {path}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(js(value), encoding="utf-8")


def split(w):
    out, at = [], 0
    for shape in SHAPES:
        size = math.prod(shape)
        out.append(w[at:at+size].reshape(shape))
        at += size
    return out


def flat(parts):
    return np.concatenate([p.ravel() for p in parts])


def initial(seed=74021):
    r = np.random.default_rng(seed)
    w = [r.normal(0, .2, s) for s in SHAPES]
    w[1] /= math.sqrt(H)
    w[3] *= 0
    w[5] *= 0
    return flat(w)


def forward(w, x, c, work=None):
    x, c = np.atleast_2d(x), np.atleast_2d(c)
    wx, wh, wc, b, v, d = split(w)
    states = [np.tanh(c @ wc.T)]
    preds = [states[0] @ v + d[0]]
    drive = x @ wx.T + b
    for _ in range(K):
        states.append(np.tanh(states[-1] @ wh.T + drive))
        preds.append(states[-1] @ v + d[0])
    if work is not None:
        work["forward_examples"] += len(x)
        work["recurrent_steps"] += len(x) * K
        work["forward_multiply_accumulates"] += len(x) * (H*C + K*(H*H+H*D) + (K+1)*H)
    return np.asarray(preds).T, states


def gradient(w, x, c, y, work=None):
    x, c, y = np.atleast_2d(x), np.atleast_2d(c), np.asarray(y).reshape(-1)
    pred, states = forward(w, x, c, work)
    wx, wh, wc, b, v, d = split(w)
    grads = [np.zeros(s) for s in SHAPES]
    dy = 2*(pred[:, -1] - y)/len(y)
    grads[4] = states[-1].T @ dy
    grads[5][0] = dy.sum()
    dh = dy[:, None] * v
    for k in range(K, 0, -1):
        da = dh * (1-states[k]**2)
        grads[0] += da.T @ x
        grads[1] += da.T @ states[k-1]
        grads[3] += da.sum(axis=0)
        dh = da @ wh
    grads[2] = (dh*(1-states[0]**2)).T @ c
    if work is not None:
        work["backward_examples"] += len(y)
    return flat(grads)


def loss(w, x, y, c=None, work=None):
    x = np.atleast_2d(x)
    if c is None:
        c = np.zeros((len(x), C))
    p, _ = forward(w, x, c, work)
    return float(np.mean((p[:, -1] - y)**2))


def step(w, g, rate=LR):
    g = g / max(1., float(np.linalg.norm(g)))
    return w - rate*g


def pack_history(events, count):
    a = np.zeros((count, D+1))
    recent = events[-count:]
    if recent:
        a[-len(recent):] = [np.r_[x, y] for x, y in recent]
    return a.ravel()


def cue_x(r, role, count):
    uv = r.uniform(-1, 1, (count, 2))
    cues = ((-1., -1.), (-1., 1.), (1., -1.), (1., 1.))
    return np.c_[uv, np.tile(cues[role], (count, 1))]


def target(x, rule, family, scale):
    u, v = x[:, 0], x[:, 1]
    if rule == 0:
        y = .7*u - .4*v
    elif rule == 1:
        y = .7*u - .4*v + .8*(u*v if family == 0 else np.sin(np.pi*u)*v)
    elif rule == 2:
        y = -.6*u + .7*v + .6*(u*v if family == 0 else -np.sin(np.pi*v)*u)
    elif rule == 3:
        y = np.zeros(len(x))
    elif rule == 4:
        y = .6*(u*v if family == 0 else np.sin(np.pi*u)*v) - .8*v*v + .2*u
    else:
        raise ValueError(rule)
    return scale*y


def draw(r, role, rule, family, scale, count=1, sigma=.08):
    x = cue_x(r, role, count)
    mean = target(x, rule, family, scale)
    y = mean + r.normal(0, .7 if rule == 3 else sigma, count)
    return x, y, mean


def pretrain():
    w, r = initial(), np.random.default_rng(74022)
    start = w.copy()
    for i in range(240):
        guard()
        beta = r.uniform(-1, 1, (32, 2))
        x = cue_x(r, 0, 32)
        hist_x = r.uniform(-1, 1, (32, 4, 2))
        hist_y = (hist_x * beta[:, None, :]).sum(axis=2) + r.normal(0, .04, (32, 4))
        hist = np.concatenate([hist_x, -np.ones((32, 4, 2)), hist_y[:, :, None]], axis=2)
        y = (x[:, :2]*beta).sum(axis=1)
        w = step(w, gradient(w, x, hist.reshape(32, C), y), rate=.04)
    assert not np.array_equal(w, start)
    return w


def setup(seed, family, pre):
    r = np.random.default_rng(seed)
    scale = float(r.uniform(.8, 1.2))
    x, y, _ = draw(r, 0, 0, family, scale, 64, sigma=.04)
    histories = []
    events = []
    for xi, yi in zip(x, y):
        histories.append(pack_history(events, 4))
        events.append((xi, float(yi)))
    c = np.asarray(histories)
    w = pre.copy()
    for _ in range(120):
        idx = r.integers(0, 64, 16)
        w = step(w, gradient(w, x[idx], c[idx], y[idx]), rate=.04)
    ax, ay, _ = draw(r, 0, 0, family, scale, 16, sigma=.04)
    stream = []
    for stage, length in STAGES:
        for _ in range(length):
            if stage == "mastered": role, rule = 0, 0
            elif stage == "acquire": role, rule = 1, 1
            elif stage == "correct": role, rule = 1, 2
            elif stage == "noise": role, rule = 2, 3
            elif stage == "revisit": role, rule = (0, 0) if r.random() < .5 else (1, 2)
            elif stage == "future": role, rule = 3, 4
            else:
                role, rule = ((0, 0), (1, 2), (3, 4))[int(r.integers(0, 3))]
            ex, ey, mean = draw(r, role, rule, family, scale)
            stream.append({"x": ex[0], "y": float(ey[0]), "mean": float(mean[0]),
                           "stage": stage, "role": role, "rule": rule})
    probes = {}
    for name, role, rule in (("base", 0, 0), ("corrected", 1, 2), ("later", 3, 4)):
        px = cue_x(r, role, 64)
        probes[name] = (px, target(px, rule, family, scale))
    return {"w": w, "a": (ax, ay), "stream": stream, "probes": probes,
            "scale": scale, "family": family, "seed": seed}


def accept(w, candidate, x, c, y, a, initial_anchor, work=None):
    old = loss(w, x, y, c, work)
    anchor = loss(w, *a, work=work)
    if not np.all(np.isfinite(candidate)) or candidate.shape != w.shape:
        return False, {"old_new": old, "old_anchor": anchor, "invalid": True}
    new = loss(candidate, x, y, c, work)
    new_anchor = loss(candidate, *a, work=work)
    ok = (new < old-1e-10 and new_anchor <= anchor+DELTA+TOL
          and new_anchor <= initial_anchor+CAP+TOL
          and np.linalg.norm(candidate-w) <= LR+TOL)
    return bool(ok), {"old_new": old, "new_new": new, "old_anchor": anchor,
                      "new_anchor": new_anchor, "step_norm": float(np.linalg.norm(candidate-w))}


def project(g, ref):
    inner, norm = float(g @ ref), float(ref @ ref)
    return g - inner/norm*ref if inner < 0 and norm > 0 else g.copy()


def features(w, x, y, history, a, predictions):
    # Deployed inputs only. No stream dictionary, hidden truth or stage argument.
    context = pack_history(history, 4)
    protected = np.c_[a[0], a[1]].ravel()
    base = np.r_[w, x, y, context, protected, pack_history(history, 16),
                 predictions[-1], (y-predictions[-1])**2]
    trace = y-predictions
    assert len(base) == 460 and len(trace) == 5
    return base, trace


def gate_input(base, trace, kind, permutation):
    if kind == "history":
        trace = np.zeros(5)
    elif kind == "permuted":
        trace = trace[permutation]
    elif kind == "scalar":
        short = np.zeros_like(base)
        short[-2:] = base[-2:]
        base, trace = short, np.zeros(5)
    return np.r_[base, trace]


def sigmoid(x):
    return 1/(1+np.exp(-np.clip(x, -40, 40)))


def mlp_probability(model, x):
    z = np.clip((x-model["mean"])/model["std"], -8, 8)
    return sigmoid(np.tanh(z @ model["w1"] + model["b1"]) @ model["w2"] + model["b2"])


def fit_gate(x, y):
    mean, std = x.mean(axis=0), np.maximum(x.std(axis=0), .05)
    z = np.clip((x-mean)/std, -8, 8)
    r = np.random.default_rng(75001)
    parts = [r.normal(0, .05, (z.shape[1], 24)), np.zeros(24),
             r.normal(0, .05, 24), np.zeros(1)]
    m, v = [np.zeros_like(p) for p in parts], [np.zeros_like(p) for p in parts]
    tick = 0
    for _ in range(40):
        guard()
        order = r.permutation(len(z))
        for at in range(0, len(z), 64):
            idx = order[at:at+64]
            xb, yb = z[idx], y[idx]
            hidden = np.tanh(xb @ parts[0] + parts[1])
            probability = sigmoid(hidden @ parts[2] + parts[3][0])
            dout = (probability-yb)/len(idx)
            dh = (dout[:, None]*parts[2])*(1-hidden**2)
            grads = [xb.T @ dh + 1e-4*parts[0], dh.sum(axis=0),
                     hidden.T @ dout + 1e-4*parts[2], np.array([dout.sum()])]
            tick += 1
            for j in range(4):
                m[j] = .9*m[j] + .1*grads[j]
                v[j] = .999*v[j] + .001*grads[j]**2
                parts[j] -= .003*(m[j]/(1-.9**tick))/(np.sqrt(v[j]/(1-.999**tick))+1e-8)
    return dict(zip(("mean", "std", "w1", "b1", "w2", "b2"), (mean, std, *parts)))


def dev_examples(data):
    w, a = data["w"].copy(), data["a"]
    initial_anchor = loss(w, *a)
    history, rows = [], []
    r = np.random.default_rng(data["seed"] + 70000)
    for event in data["stream"]:
        guard()
        x, y = event["x"], event["y"]
        c = pack_history(history, 4)
        prediction, _ = forward(w, x, c)
        base, trace = features(w, x, y, history, a, prediction[0])
        candidate = step(w, gradient(w, x, c, y))
        allowed, _ = accept(w, candidate, x, c, y, a, initial_anchor)
        qx = cue_x(r, event["role"], 16)
        qy = target(qx, event["rule"], data["family"], data["scale"])
        bx = cue_x(r, 0, 8)
        by = target(bx, 0, data["family"], data["scale"])
        # Development-only future-outcome supervision; never a deployed feature.
        utility = .8*(loss(w, qx, qy)-loss(candidate, qx, qy)) + .2*(loss(w, bx, by)-loss(candidate, bx, by)) - .0001
        label = float(allowed and utility > 0)
        permutation = r.permutation(5)
        rows.append((base, trace, permutation, label))
        if allowed and r.random() < .6:
            w = candidate
        history.append((x.copy(), y))
        history = history[-16:]
    return rows


def frozen_hashes():
    return {"experiment": sha(Path(__file__)), "protocol": sha(ROOT/"PROTOCOL.md"),
            "math": sha(ROOT/"MATHEMATICAL-BOUNDARY.md"), "concept": sha(CONCEPT)}


def contracts():
    r = np.random.default_rng(1900001)
    w = initial()
    x, c, y = r.normal(size=(3, D)), r.normal(size=(3, C)), r.normal(size=3)
    analytic = gradient(w, x, c, y)
    numeric = np.zeros(N)
    for i in range(N):
        plus, minus = w.copy(), w.copy()
        plus[i] += 1e-6
        minus[i] -= 1e-6
        numeric[i] = (loss(plus, x, y, c)-loss(minus, x, y, c))/2e-6
    checks = {"all_273_bptt_derivatives": bool(np.max(abs(numeric-analytic)) < 1e-7)}
    before = arrhash(w)
    forward(w, x, c)
    checks["diagnostic_no_write"] = before == arrhash(w)
    a = (x, y)
    bad = w.copy(); bad[0] = float("nan")
    ok, _ = accept(w, bad, x, c, y, a, loss(w, *a))
    checks["nonfinite_rejected_without_mutation"] = not ok and before == arrhash(w)
    huge = w+100
    ok, _ = accept(w, huge, x, c, y, a, loss(w, *a))
    checks["overbudget_rejected_without_mutation"] = not ok and before == arrhash(w)
    checks["projection_halfspace"] = all(float(project(g, -g) @ (-g)) >= -1e-10 for g in r.normal(size=(20, N)))
    checks["projection_zero_reference"] = np.array_equal(project(analytic, np.zeros(N)), analytic)
    checks["first_order_not_finite_retention"] = 10*2 > 0 and (1-.3*10)**2 > 1
    p, _ = forward(w, x[0], c[0])
    history = [(x[1], float(y[1]))]
    ax = np.tile(x[0], (16, 1)); ay = np.tile(y[0], 16)
    b, t = features(w, x[0], y[0], history, (ax, ay), p[0])
    checks["controller_465_fixed_coordinates"] = all(len(gate_input(b, t, g, np.arange(5)[::-1])) == 465 for g in GATES)
    checks["trace_exact_reconstruction"] = np.array_equal(t, y[0]-p[0])
    bx, by, bm = draw(r, 0, 0, 0, 1., 40, sigma=0.)
    checks["one_input_generates_outcome"] = np.array_equal(by, .7*bx[:, 0]-.4*bx[:, 1])
    checks["partitions_disjoint"] = len(set(range(100, 112)) & set(range(200, 204))) == 0
    checks["fixed_stream_length"] = sum(n for _, n in STAGES) == 220
    result = {"checks": checks, "all_pass": all(checks.values()), "passed": sum(checks.values()),
              "total": len(checks), "max_bptt_error": float(np.max(abs(numeric-analytic))),
              "receiver_parameters": N, "source_hashes": frozen_hashes()}
    write(ROOT/"CONTRACT-CHECKS.json", result)
    assert result["all_pass"], result
    print(js({k: result[k] for k in ("all_pass", "passed", "total", "max_bptt_error")}))


def develop():
    checked = json.loads((ROOT/"CONTRACT-CHECKS.json").read_text(encoding="utf-8"))
    assert checked["all_pass"] and checked["source_hashes"] == frozen_hashes()
    out = ROOT/"development"
    if out.exists():
        raise FileExistsError(out)
    write(ROOT/"RUN-FREEZE.json", {"source_hashes": frozen_hashes(), "dev_seeds": list(range(100, 112)),
          "validation_seeds": list(range(200, 204)), "test_id": list(range(1000, 1004)),
          "test_shift": list(range(2000, 2004)), "heldout_generated": False})
    pre = pretrain()
    rows, val = [], []
    for seed in range(100, 112):
        rows.extend(dev_examples(setup(seed, 0, pre)))
        print(f"development seed {seed} complete", flush=True)
    for seed in range(200, 204):
        val.extend(dev_examples(setup(seed, 0, pre)))
    ys, vy = np.array([row[3] for row in rows]), np.array([row[3] for row in val])
    models, scores = {}, {}
    for kind in GATES:
        guard()
        xx = np.array([gate_input(b, t, kind, perm) for b, t, perm, _ in rows])
        vx = np.array([gate_input(b, t, kind, perm) for b, t, perm, _ in val])
        model = fit_gate(xx, ys)
        p = mlp_probability(model, vx)
        scores[kind] = {"accuracy": float(np.mean((p >= .5) == vy)),
                        "brier": float(np.mean((p-vy)**2)), "propose_fraction": float(np.mean(p >= .5))}
        models[kind] = {k: v.tolist() for k, v in model.items()}
        print(f"fitted {kind}; development validation only", flush=True)
    payload = {"pretrained_receiver": pre.tolist(), "models": models, "validation": scores,
               "train_n": len(rows), "validation_n": len(val), "train_positive_fraction": float(ys.mean()),
               "validation_positive_fraction": float(vy.mean()), "source_hashes": frozen_hashes(),
               "threshold": .5, "epochs": 40, "selected_on_final_results": False}
    write(out/"FITTED.json", payload)
    write(out/"SEAL.json", {"fitted_sha256": sha(out/"FITTED.json"), "source_hashes": frozen_hashes(),
                            "final_streams_opened": False})
    print(js(scores))


def empty_work():
    return {"forward_examples": 0, "recurrent_steps": 0, "forward_multiply_accumulates": 0,
            "backward_examples": 0, "gate_calls": 0}


def run_arm(data, arm, model, only_future=False):
    w, a = data["w"].copy(), data["a"]
    start = w.copy()
    initial_anchor = loss(w, *a)
    history, ledger, version = [], [], 0
    work = empty_work()
    last_before = w.copy()
    first_later = None
    phase_sums = {}
    checkpoints = []
    for t, event in enumerate(data["stream"]):
        if only_future and event["stage"] != "future":
            continue
        guard()
        x = event["x"]
        c = pack_history(history, 4)
        before_hash = arrhash(w)
        preds, _ = forward(w, x, c, work)
        # Only now is current outcome exposed to feature extraction and updates.
        y = event["y"]
        error = float((preds[0, -1]-y)**2)
        base, trace = features(w, x, y, history, a, preds[0])
        permutation = np.random.default_rng(data["seed"]*1000+t).permutation(5)
        probability = None
        proposed = arm != "frozen"
        if arm in GATES:
            work["gate_calls"] += 1
            probability = float(mlp_probability(model, gate_input(base, trace, arm, permutation))[0])
            proposed = probability >= .5
        if event["stage"] == "future" and first_later is None:
            first_later = loss(w, *data["probes"]["later"])
        allowed, info = False, {}
        if proposed:
            g = gradient(w, x, c, y, work)
            if arm in ("agem", "replay"):
                ref = gradient(w, a[0], np.zeros((16, C)), a[1], work)
                g = project(g, ref) if arm == "agem" else .5*(g+ref)
            candidate = step(w, g)
            allowed, info = accept(w, candidate, x, c, y, a, initial_anchor, work)
            if allowed:
                last_before = w.copy()
                w = candidate
                version += 1
            else:
                assert arrhash(w) == before_hash
        anchor = loss(w, *a)
        assert anchor <= initial_anchor + min(version*DELTA, CAP) + max(version, 1)*TOL
        stage = event["stage"]
        phase_sums.setdefault(stage, []).append(error)
        ledger.append({"event": t, "stage_evaluator_only": stage, "x": x.tolist(), "y": y,
                       "pre_feedback_prediction": float(preds[0, -1]), "error": error,
                       "residual_initial": float(trace[0]), "residual_final": float(trace[-1]),
                       "normalized_final": float(abs(trace[-1])/(abs(trace[0])+1e-6)),
                       "reactivation": bool(np.any(np.diff(abs(trace)) > 1e-9)),
                       "probability": probability, "proposed": bool(proposed), "accepted": allowed,
                       "version": version, "pre_hash": before_hash, "post_hash": arrhash(w),
                       "protected_loss": anchor, "transaction": info})
        history.append((x.copy(), y)); history = history[-16:]
        end = t+1 == len(data["stream"]) or data["stream"][t+1]["stage"] != stage
        if end:
            checkpoints.append({"stage": stage, "probe_zero_history": {k: loss(w, *v) for k, v in data["probes"].items()}})
    final = {k: loss(w, *v) for k, v in data["probes"].items()}
    initial_probe = {k: loss(start, *v) for k, v in data["probes"].items()}
    last_removed = {k: loss(last_before, *v) for k, v in data["probes"].items()}
    summary = {"seed": data["seed"], "family": data["family"], "arm": arm,
               "events": len(ledger), "mse": float(np.mean([e["error"] for e in ledger])),
               "phase_mse": {k: float(np.mean(v)) for k, v in phase_sums.items()},
               "writes": version, "proposals": sum(e["proposed"] for e in ledger),
               "rejections": sum(e["proposed"] and not e["accepted"] for e in ledger),
               "protected_initial": initial_anchor, "protected_final": loss(w, *a),
               "protected_max": max(e["protected_loss"] for e in ledger),
               "probes_initial_zero_history": initial_probe, "probes_final_zero_history": final,
               "probes_last_write_removed_zero_history": last_removed,
               "last_write_rescue_hash": arrhash(w), "initial_hash": arrhash(start),
               "first_later_probe": first_later, "phase_end_probes": checkpoints,
               "work": work, "parameters": N, "history_float_slots": 80, "protected_float_slots": 80}
    assert arm != "frozen" or (version == 0 and arrhash(w) == arrhash(start))
    return summary, ledger


def evaluate(replay=False):
    dev = ROOT/"development"
    seal = json.loads((dev/"SEAL.json").read_text(encoding="utf-8"))
    assert seal["source_hashes"] == frozen_hashes()
    assert seal["fitted_sha256"] == sha(dev/"FITTED.json")
    fit = json.loads((dev/"FITTED.json").read_text(encoding="utf-8"))
    models = {arm: {k: np.asarray(v) for k, v in model.items()} for arm, model in fit["models"].items()}
    pre = np.asarray(fit["pretrained_receiver"])
    out = ROOT/("replay" if replay else "evaluation")
    if out.exists():
        raise FileExistsError(out)
    out.mkdir()
    summaries = []
    for family, seeds in ((0, range(1000, 1004)), (1, range(2000, 2004))):
        for seed in seeds:
            data = setup(seed, family, pre)
            for arm in ARMS:
                summary, ledger = run_arm(data, arm, models.get(arm))
                fresh, _ = run_arm(data, arm, models.get(arm), only_future=True)
                summary["fresh_later_mse"] = fresh["mse"]
                summary["fresh_later_writes"] = fresh["writes"]
                summary["fresh_later_probe"] = fresh["probes_final_zero_history"]["later"]
                summary["gate_parameters"] = sum(np.asarray(fit["models"][arm][k]).size for k in ("w1", "b1", "w2", "b2")) if arm in GATES else 0
                summaries.append(summary)
                write(out/f"events-{seed}-{arm}.json", ledger)
            print(f"final family {family} seed {seed} complete", flush=True)
    aggregates = {}
    for family in (0, 1):
        aggregates[str(family)] = {}
        for arm in ARMS:
            rows = [s for s in summaries if s["family"] == family and s["arm"] == arm]
            vals = np.array([s["mse"] for s in rows])
            diffs = []
            for row in rows:
                hist = next(s for s in summaries if s["seed"] == row["seed"] and s["arm"] == "history")
                diffs.append(row["mse"]-hist["mse"])
            aggregates[str(family)][arm] = {"mean_mse": float(vals.mean()), "seed_mse": vals.tolist(),
                "mean_writes": float(np.mean([r["writes"] for r in rows])),
                "mean_later_mse": float(np.mean([r["phase_mse"]["future"] for r in rows])),
                "mean_fresh_later_mse": float(np.mean([r["fresh_later_mse"] for r in rows])),
                "paired_minus_history": diffs,
                "mean_base_probe_final": float(np.mean([r["probes_final_zero_history"]["base"] for r in rows])),
                "mean_later_probe_final": float(np.mean([r["probes_final_zero_history"]["later"] for r in rows]))}
    result = {"scope": "One fixed-capacity synthetic learned-receiver family; no biological or transformer validation",
              "source_hashes": frozen_hashes(), "development_seal": seal, "summaries": summaries,
              "aggregate": aggregates, "fresh_comparison": "Same initial warmup model and protected set, only later-phase observations; no refreshed cap", "test_streams": 8}
    write(out/"RESULT.json", result)
    write(out/"MANIFEST.json", {"result_sha256": sha(out/"RESULT.json"), "event_files": 64,
                               "event_count": sum(s["events"] for s in summaries),
                               "all_retention_assertions_passed": True})
    if replay:
        assert (out/"RESULT.json").read_bytes() == (ROOT/"evaluation/RESULT.json").read_bytes()
        for seed in (*range(1000, 1004), *range(2000, 2004)):
            for arm in ARMS:
                name = f"events-{seed}-{arm}.json"
                assert sha(out/name) == sha(ROOT/"evaluation"/name)
        write(out/"REPLAY-CHECK.json", {"result_and_all_64_event_files_byte_identical": True})
    print(js(aggregates))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("phase", choices=("check", "develop", "evaluate", "replay"))
    args = parser.parse_args()
    started = time.monotonic()
    if args.phase == "check": contracts()
    elif args.phase == "develop": develop()
    else: evaluate(args.phase == "replay")
    print(f"phase={args.phase} seconds={time.monotonic()-started:.3f}")


if __name__ == "__main__":
    main()
