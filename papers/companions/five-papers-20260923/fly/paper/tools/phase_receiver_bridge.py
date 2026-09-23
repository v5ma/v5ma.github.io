"""Exploratory phase/readout bridge; NOT native hue physiology or full SAN.

Only reported within-seed routes constrain adjacency. Dynamics, drive mapping,
clock and most signs are hypotheses. The coordinate twin is deliberately an
equivalent nonoscillatory description, not an inferior comparison model.
"""
import copy
import hashlib
import json
import math
from pathlib import Path
import time

import numpy as np
from embodied_reference import ReferenceController, SpectralWorld, controller_settings

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "application/phase-receiver-bridge-v0"
PLAN_PATH = APP / "ANALYSIS-PLAN.json"


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def inputs():
    plan = json.loads(PLAN_PATH.read_text("utf-8"))
    for key in ("seeds", "routes"):
        item = plan["sourceFiles"][key]
        if digest(ROOT / item["path"]) != item["sha256"]:
            raise ValueError("Registered source bytes changed: " + key)
    seeds = json.loads((ROOT / plan["sourceFiles"]["seeds"]["path"]).read_text("utf-8"))
    routes = json.loads((ROOT / plan["sourceFiles"]["routes"]["path"]).read_text("utf-8"))
    env = json.loads((ROOT / plan["sourceFiles"]["environment"]["path"]).read_text("utf-8"))
    return plan, seeds, routes, env


def graph(seeds, routes, plan, case):
    ids = [s["identifier"] for s in seeds]
    types = {s["identifier"]: s["type"] for s in seeds}
    index = {x: i for i, x in enumerate(ids)}
    known = {(x["preType"], x["postType"]): x["sign"] for x in plan["knownSignConstraints"]}
    matrix = np.zeros((len(ids), len(ids)))
    used = []
    for route in routes:
        pre, post = route["sourceId"], route["targetId"]
        if pre not in index or post not in index:
            continue
        variants = route["countVariants"]
        count = min(variants) if case["counts"] == "lower" else max(variants)
        key = (types[pre], types[post])
        sign = known.get(key, case["unknownSign"])
        matrix[index[post], index[pre]] = sign * count
        used.append({"pre": pre, "post": post, "countVariants": variants,
                     "chosenCount": count, "sign": sign,
                     "signProvenance": "inherited model constraint" if key in known else "hypothetical unknown-sign setting"})
    totals = np.abs(matrix).sum(axis=1)
    matrix = np.divide(matrix, totals[:, None], out=np.zeros_like(matrix), where=totals[:, None] > 0)
    return matrix, {"identifiers": ids, "types": [types[x] for x in ids], "routes": used,
                    "excludedReportedRoutes": len(routes) - len(used), "orientation": "post rows, pre columns",
                    "matrix": matrix.tolist(), "incomingAbsoluteCounts": totals.tolist()}


def rhs(phi, drive, matrix, anchor, coupling):
    s, c = np.sin(phi), np.cos(phi)
    return -anchor * s + drive + coupling * (c * (matrix @ s) - s * (matrix @ c))


def integrate(drive, matrix, settings, deadline):
    dt = settings["dt"]
    count = int(round(settings["exposure"] / dt))
    if abs(count * dt - settings["exposure"]) > 1e-12:
        raise ValueError("Exposure is not an exact number of steps")
    phi = np.zeros(len(drive))
    maximum = 0.0
    for step in range(count):
        if step % 32 == 0 and time.perf_counter() > deadline:
            raise TimeoutError("Declared foreground execution budget reached")
        a = rhs(phi, drive, matrix, settings["anchor"], settings["coupling"])
        b = rhs(phi + dt*a/2, drive, matrix, settings["anchor"], settings["coupling"])
        c = rhs(phi + dt*b/2, drive, matrix, settings["anchor"], settings["coupling"])
        d = rhs(phi + dt*c, drive, matrix, settings["anchor"], settings["coupling"])
        phi += dt * (a + 2*b + 2*c + d) / 6
        maximum = max(maximum, float(np.max(np.abs(phi))))
    if not np.isfinite(phi).all():
        raise ValueError("Nonfinite receiver state")
    return phi, maximum, count


def relative_signal(phi, theta, implementation):
    if implementation == "coordinate":
        return np.column_stack((np.cos(phi), np.sin(phi)))
    # Form the actual carrier and tonic reference before the local relative
    # product. Its cancellation is a testable identification limit, not hidden.
    real, imag = np.cos(theta + phi), np.sin(theta + phi)
    return np.column_stack((real*math.cos(theta) + imag*math.sin(theta),
                            imag*math.cos(theta) - real*math.sin(theta)))


class PhaseReceiver:
    def __init__(self, matrix, settings, implementation, deadline):
        self.matrix = np.array(matrix, dtype=float, copy=True)
        self.settings = copy.deepcopy(settings)
        raw = np.asarray(settings["driveRows"], dtype=float)
        self.projection = raw / np.sum(np.abs(raw), axis=1)[:, None]
        self.implementation = implementation
        self.deadline = deadline
        self.clear_transient()

    def clear_transient(self):
        self.cache = {}
        self.counters = {"requests": 0, "solves": 0, "rk4Steps": 0, "maximumPhase": 0.0}

    def receive(self, captures, bands, clock, intervention=None):
        total = sum(captures)
        x = np.zeros(4)
        if total > 0:
            for j, value in zip(bands, captures, strict=True):
                x[j] = value/total - 1/len(bands)
        drive = self.settings["driveGain"] * (self.projection @ x)
        key = tuple(float(v) for v in x)
        self.counters["requests"] += 1
        if key not in self.cache:
            if len(self.cache) >= 256:
                raise ValueError("Bounded solve cache exhausted")
            phi, maximum, count = integrate(drive, self.matrix, self.settings, self.deadline)
            self.cache[key] = (phi.copy(), maximum)
            self.counters["solves"] += 1
            self.counters["rk4Steps"] += count
            self.counters["maximumPhase"] = max(self.counters["maximumPhase"], maximum)
        phi, maximum = self.cache[key]
        delivered = np.zeros_like(phi) if intervention == "flatten" else phi
        theta = self.settings["carrierRadiansPerModelUnit"] * clock
        signal = relative_signal(delivered, theta, self.implementation)
        return signal, {"normalizedTonicDifference": x.tolist(), "drive": drive.tolist(),
                        "relativePhase": phi.tolist(), "deliveredRelativePhase": delivered.tolist(),
                        "signal": signal.tolist(), "maximumPhaseAlongSolve": maximum,
                        "carrierPhase": theta, "intervention": intervention}


def distance(left, right):
    return float(np.mean(np.sum((np.asarray(left) - np.asarray(right))**2, axis=1)))


class BridgeController(ReferenceController):
    def __init__(self, public_config, matrix, settings, implementation, deadline):
        super().__init__(public_config, "adaptive_sampling")
        self.receiver = PhaseReceiver(matrix, settings, implementation, deadline)
        self.receiver_settings = copy.deepcopy(settings)
        self.learned = {}
        self.familiarization = []
        self.intervention = None
        # Public task exemplars only, not live environment labels or answers.
        for bands in settings["familiarizationMasks"]:
            mask = "".join(str(i) for i in bands)
            self.learned[mask] = {}
            for cue, exemplar in (("target", self.target_template), ("other", self.other_template)):
                weight = np.zeros((len(matrix), 2))
                for count, intensity in enumerate(settings["familiarizationIntensities"], start=1):
                    capture = [exemplar[i]*intensity for i in bands]
                    signal, audit = self.receiver.receive(capture, bands, count)
                    weight += (signal - weight)/count
                    self.familiarization.append({"cue": cue, "bands": bands, "capture": capture,
                        "count": count, "signal": signal.tolist(), "weightAfter": weight.tolist(),
                        "relativePhase": audit["relativePhase"]})
                self.learned[mask][cue] = {"weight": weight.tolist(), "count": count}
        self.training_counters = copy.deepcopy(self.receiver.counters)
        # No ordinary-template bypass exists inside candidate observation logic.
        del self.target_template
        del self.other_template
        self.clear_transient()

    def clear_transient(self):
        super().clear_transient()
        if hasattr(self, "receiver"):
            self.receiver.clear_transient()

    def observe(self, payload):
        obs = self.decode_observation(payload)
        if self.last_time is not None and obs["time"] <= self.last_time:
            raise ValueError("Observations must advance the clock")
        self.last_time = obs["time"]
        self.last_observation = copy.deepcopy(obs)
        key = "".join(str(i) for i in obs["bands"])
        weights = self.learned[key]
        target, other = weights["target"]["weight"], weights["other"]["weight"]
        epsilon = self.receiver_settings["numericalEpsilon"]
        separation = distance(target, other)
        identifiable = separation > epsilon
        have_learning = weights["target"]["count"] > 0 and weights["other"]["count"] > 0
        audit, matches = [], []
        for sample in obs["samples"]:
            signal, evidence = self.receiver.receive(sample["captures"], obs["bands"], obs["time"], self.intervention)
            dt, do = distance(signal, target), distance(signal, other)
            accepted = have_learning and dt <= self.receiver_settings["readoutToleranceFraction"]*separation + epsilon
            if identifiable:
                accepted = accepted and dt + epsilon < do
            else:
                accepted = accepted and self.relative_target is not None and abs(sample["signed_range"] - self.relative_target) <= self.motion_tolerance
            evidence.update({"signed_range": sample["signed_range"], "targetDistance": dt,
                             "otherDistance": do, "accepted": accepted})
            audit.append(evidence)
            if accepted:
                matches.append(sample)
        if len(matches) == 1:
            self.relative_target = matches[0]["signed_range"]
            self.last_observed = obs["time"]
            self.status = "observed"
        elif self.relative_target is not None:
            self.status = "inferred"
        else:
            self.status = "unresolved"
        self.mode = "coarse" if self.status == "observed" else "full"
        return {"status": self.status, "relative_target": self.relative_target, "last_observed": self.last_observed,
                "sampling_identifies_templates": identifiable, "learnedSeparation": separation,
                "haveLearning": have_learning, "receiver": audit}


def metrics(records, final, config, scenario, seed, case_id):
    def mean(values):
        values = [x for x in values if x is not None]
        return sum(values)/len(values) if values else None
    return {"scenario": scenario, "seed": seed, "case": case_id,
        "meanPriorRelationError": mean(r["priorRelationError"] for r in records),
        "maximumObservedRelationError": max((r["observedRelationError"] for r in records if r["observedRelationError"] is not None), default=None),
        "meanReturnPredictionError": mean(abs(r["bodyReturn"]["predicted_displacement"]-r["bodyReturn"]["measured_displacement"]) for r in records),
        "finalStandoffError": abs(abs(final["target_relative"])-config["desiredStandoff"]),
        "observedSteps": sum(r["relation"]["status"] == "observed" for r in records),
        "inferredSteps": sum(r["relation"]["status"] == "inferred" for r in records),
        "unresolvedSteps": sum(r["relation"]["status"] == "unresolved" for r in records),
        "captures": sum(sum(len(s["captures"]) for s in r["observation"]["samples"]) for r in records),
        "commandsWithoutUsableRelation": sum(abs(r["action"]["command"]) > 1e-12 and
            (r["relation"]["last_observed"] is None or r["step"]-r["relation"]["last_observed"] > config["maxInferredAgeForMovement"]) for r in records),
        "finalGain": records[-1]["stateAfterReturn"]["retained_gain"]}


def build_controller(config, case, model, settings, deadline):
    if case["implementation"] == "reference":
        return ReferenceController(controller_settings(config), case["policy"])
    return BridgeController(controller_settings(config), model, settings, case["implementation"], deadline)


def run_episode(config, scenario, seed, case, model, settings, deadline, intervention=None, permuted=False):
    world = SpectralWorld(config, scenario, seed, permuted_labels=permuted)
    agent = build_controller(config, case, model, settings, deadline)
    if isinstance(agent, BridgeController):
        agent.intervention = intervention
    records = []
    initial = copy.deepcopy(agent.state())
    for step in range(config["steps"]):
        if time.perf_counter() > deadline:
            raise TimeoutError("Episode case budget exhausted")
        before, prior = world.evaluator_truth(), agent.state()
        payload = world.observation(agent.mode)
        observation = json.loads(payload)
        relation = agent.observe(payload)
        action = agent.act()
        after_observation = agent.state()
        body_payload = world.execute(action)
        body = agent.receive_body_return(body_payload)
        after = world.evaluator_truth()
        records.append({"step": step, "observation": observation, "priorState": prior,
            "relation": relation, "stateAfterObservation": after_observation, "action": action,
            "bodyReturn": body, "bodyPayload": json.loads(body_payload), "stateAfterReturn": agent.state(),
            "evaluatorBefore": before, "evaluatorAfter": after,
            "priorRelationError": None if prior["target_relation"] is None else abs(prior["target_relation"]-before["target_relative"]),
            "observedRelationError": abs(relation["relative_target"]-before["target_relative"]) if relation["status"] == "observed" else None})
    result = {"metrics": metrics(records, world.evaluator_truth(), config, scenario, seed, case["id"]),
              "initialState": initial, "events": records, "controllerFields": sorted(vars(agent))}
    if isinstance(agent, BridgeController):
        result.update({"learned": copy.deepcopy(agent.learned), "familiarization": agent.familiarization,
                       "trainingCounters": agent.training_counters, "testCounters": agent.receiver.counters,
                       "receiverFields": sorted(vars(agent.receiver))})
    return result
