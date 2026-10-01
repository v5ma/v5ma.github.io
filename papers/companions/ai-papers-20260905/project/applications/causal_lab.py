"""Small trained-network causal assay. No pretrained model or conscious-access claim.

World semantics define correct actions, not the network's learned internal algorithm.
The development comparison is not a claim that these standard surrogates are novel.
"""
from __future__ import annotations
import time
import numpy as np


def sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -40, 40)))


def worlds():
    bits = np.array([[1.0 if (n >> k) & 1 else -1.0 for k in range(8)] for n in range(256)])
    # owner A/B, grant A/B, hazard A/B, selected object, requester identity.
    selected = (bits[:, 6] > 0).astype(int)
    idx = np.arange(256)
    owner = bits[idx, selected]
    grant = bits[idx, selected + 2]
    hazard = bits[idx, selected + 4]
    target = ((owner == bits[:, 7]) & (grant > 0) & (hazard < 0)).astype(float)
    return bits, target, grant


class Network:
    def __init__(self, seed=1):
        rng = np.random.default_rng(seed)
        self.p = {"w1": rng.normal(0, 0.35, (10, 24)), "b1": np.zeros(24),
                  "w2": rng.normal(0, 0.25, (24, 16)), "b2": np.zeros(16),
                  "wo": rng.normal(0, 0.2, (16, 1)), "bo": np.zeros(1)}

    def hidden(self, x):
        return np.tanh(x @ self.p["w1"] + self.p["b1"])

    def tail(self, h, w2=None):
        w2 = self.p["w2"] if w2 is None else w2
        z = np.tanh(h @ w2 + self.p["b2"])
        return (z @ self.p["wo"] + self.p["bo"]).ravel()

    def gradient(self, h):
        z = np.tanh(h @ self.p["w2"] + self.p["b2"])
        return ((1 - z * z) * self.p["wo"].ravel()) @ self.p["w2"].T

    def train(self, x, y, epochs, rate, max_seconds):
        start = time.monotonic()
        m = {k: np.zeros_like(v) for k, v in self.p.items()}
        v = {k: np.zeros_like(v) for k, v in self.p.items()}
        for epoch in range(1, epochs + 1):
            if time.monotonic() - start > max_seconds:
                raise TimeoutError("Training exceeded the prespecified single-seed ceiling")
            h = self.hidden(x)
            z = np.tanh(h @ self.p["w2"] + self.p["b2"])
            logits = (z @ self.p["wo"] + self.p["bo"]).ravel()
            d = (sigmoid(logits) - y)[:, None] / len(y)
            dz = (d @ self.p["wo"].T) * (1 - z * z)
            dh = (dz @ self.p["w2"].T) * (1 - h * h)
            grads = {"wo": z.T @ d, "bo": d.sum(axis=0), "w2": h.T @ dz,
                     "b2": dz.sum(axis=0), "w1": x.T @ dh, "b1": dh.sum(axis=0)}
            for k, g in grads.items():
                m[k] = 0.9 * m[k] + 0.1 * g
                v[k] = 0.999 * v[k] + 0.001 * g * g
                self.p[k] -= rate * (m[k] / (1 - 0.9 ** epoch)) / (np.sqrt(v[k] / (1 - 0.999 ** epoch)) + 1e-8)
        return epochs


def ridge(x, y, penalty):
    x = np.column_stack((np.ones(len(x)), x))
    reg = np.eye(x.shape[1]) * penalty
    reg[0, 0] = 0
    return np.linalg.solve(x.T @ x + reg, x.T @ y)


def predict(x, weights):
    return np.column_stack((np.ones(len(x)), x)) @ weights


def intervention_batch(net, x, ids):
    # Natural donor: same world except permission on the selected object is toggled.
    h = net.hidden(x)
    xd = x.copy()
    selected = (x[:, 6] > 0).astype(int)
    xd[np.arange(len(x)), selected + 2] *= -1
    donor = net.hidden(xd)
    contexts = np.repeat(h, 24, axis=0)
    units = np.tile(np.arange(24), len(x))
    deltas = np.zeros_like(contexts)
    deltas[np.arange(len(deltas)), units] = (donor - h).ravel()
    effects = net.tail(contexts + deltas) - net.tail(contexts)
    receiver = np.repeat(x[:, 6], 24)[:, None]
    features = {
        "global_linear": deltas,
        "matched_polynomial": np.column_stack((deltas, deltas ** 2, deltas ** 3)),
        "receiver_conditioned": np.column_stack((deltas, deltas * contexts, deltas * receiver)),
    }
    jacobian = (net.gradient(contexts) * deltas).sum(axis=1)
    return contexts, deltas, effects, features, jacobian, np.repeat(ids, 24), units


def evaluate(config, resource):
    bits, targets, grants = worlds()
    shuffled = np.random.default_rng(config["split_seed"]).permutation(256)
    train, valid, test = shuffled[:128], shuffled[128:192], shuffled[192:]
    assert not (set(train) & set(test) or set(valid) & set(test) or set(train) & set(valid))
    all_metrics, predictions, models = [], [], {}
    for seed in config["seeds"]:
        rng = np.random.default_rng(seed + 1)
        xall = np.column_stack((bits, np.zeros((256, 2))))
        xtrain = np.repeat(xall[train], config["training_replicates"], axis=0)
        xtrain[:, -2:] = rng.normal(0, 0.25, xtrain[:, -2:].shape)
        ytrain = np.repeat(targets[train], config["training_replicates"])
        net = Network(seed)
        epochs = net.train(xtrain, ytrain, config["epochs"], config["learning_rate"], resource["max_seconds_per_training_seed"])
        htrain = net.hidden(xall[train])
        probe = ridge(htrain, grants[train], config["ridge"])
        dev_batch = intervention_batch(net, xall[train], train)
        weights = {name: ridge(feats, dev_batch[2], config["ridge"]) for name, feats in dev_batch[3].items()}
        for split, ids in (("validation", valid), ("test", test)):
            x, y = xall[ids], targets[ids]
            p = sigmoid(net.tail(net.hidden(x)))
            positive, negative = y == 1, y == 0
            accuracy = float(((p >= 0.5) == y).mean())
            balanced = float(0.5 * ((p[positive] >= 0.5).mean() + (p[negative] < 0.5).mean()))
            loss = float((-y * np.log(np.clip(p, 1e-9, 1)) - (1-y) * np.log(np.clip(1-p, 1e-9, 1))).mean())
            probe_acc = float(((predict(net.hidden(x), probe) > 0) == (grants[ids] > 0)).mean())
            contexts, delta, effects, feats, jac, row_ids, units = intervention_batch(net, x, ids)
            outputs = {name: predict(f, weights[name]) for name, f in feats.items()}
            outputs["local_jacobian"] = jac
            # Every intervened unit's outgoing route is independently removed.
            lesion = np.empty(len(effects))
            restore = np.empty(len(effects))
            for unit in range(24):
                mask = units == unit
                w2 = net.p["w2"].copy()
                w2[unit] = 0
                lesion[mask] = net.tail(contexts[mask]+delta[mask], w2) - net.tail(contexts[mask], w2)
                restore[mask] = net.tail(contexts[mask]+delta[mask]) - net.tail(contexts[mask])
            for method, prediction in outputs.items():
                error = prediction - effects
                all_metrics.append({"seed": seed, "split": split, "method": method,
                    "task_accuracy": accuracy, "task_balanced_accuracy": balanced,
                    "task_log_loss": loss, "relation_probe_accuracy": probe_acc,
                    "intervention_mae": float(np.abs(error).mean()),
                    "intervention_rmse": float(np.sqrt((error**2).mean())),
                    "lesion_influence": float(np.max(np.abs(lesion))),
                    "exact_restore_error": float(np.max(np.abs(restore-effects))),
                    "worlds": len(ids), "interventions": len(effects), "epochs": epochs})
            for k, effect in enumerate(effects):
                predictions.append({"seed": seed, "split": split, "world": int(row_ids[k]),
                    "unit": int(units[k]), "delta": float(delta[k, units[k]]),
                    "actual_logit_effect": float(effect),
                    **{name: float(values[k]) for name, values in outputs.items()}})
        models[str(seed)] = {k: v.tolist() for k, v in net.p.items()}
    split_manifest = {"train": train.tolist(), "validation": valid.tolist(), "test": test.tolist()}
    return all_metrics, predictions, models, split_manifest
