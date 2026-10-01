"""Conventional closed-loop reference, NOT the SAN or native fly implementation.

Four idealized spectral bands plus an engineered signed-range sensor establish a
small shared task. World truth never appears in the controller's serialized
observation. No temporal oscillator, PWD, NAPOT or biological learning is claimed.
"""
import copy
import json
import math
import random

POLICIES = ("adaptive_sampling", "fixed_full", "command_as_return_ablation", "frozen_calibration_ablation")
CONTROL_KEYS = frozenset(("targetReflectance", "otherReflectance", "calibrationRate", "maxCommand",
    "desiredStandoff", "spectralDistanceTolerance", "motionAssociationTolerance", "maxInferredAgeForMovement",
    "initialGainEstimate"))

def controller_settings(full_environment_plan):
    """Copy the allowlisted public task/controller settings across the boundary."""
    return {key: copy.deepcopy(full_environment_plan[key]) for key in sorted(CONTROL_KEYS)}

def normalized(values):
    total = sum(values)
    if total <= 0:
        return [0.0] * len(values)
    return [v / total for v in values]

def spectral_distance(a, b):
    return sum(abs(x - y) for x, y in zip(normalized(a), normalized(b), strict=True))

class ReferenceController:
    """Only this class owns the policy's temporary and retained state."""
    def __init__(self, config, policy):
        if policy not in POLICIES:
            raise ValueError("Unknown policy")
        if set(config) != CONTROL_KEYS:
            raise ValueError("Controller settings must contain only the public allowlist")
        # Read only globally declared instrument/task/policy parameters, never a
        # scenario, environment instance, seed, hidden gain or object location.
        self.target_template = tuple(config["targetReflectance"])
        self.other_template = tuple(config["otherReflectance"])
        self.alpha = config["calibrationRate"]
        self.max_command = config["maxCommand"]
        self.standoff = config["desiredStandoff"]
        self.spectral_tolerance = config["spectralDistanceTolerance"]
        self.motion_tolerance = config["motionAssociationTolerance"]
        self.max_age = config["maxInferredAgeForMovement"]
        self.prior_gain = config["initialGainEstimate"]
        self.gain = self.prior_gain
        self.policy = policy
        self.clear_transient()

    def clear_transient(self):
        """Clear episode state without touching retained actuator calibration."""
        self.relative_target = None
        self.last_observed = None
        self.last_time = None
        self.body_odometry = 0.0
        self.status = "unresolved"
        self.mode = "full" if self.policy == "fixed_full" else "coarse"
        self.last_observation = None

    @staticmethod
    def decode_observation(payload):
        value = json.loads(payload)
        if set(value) != {"time", "bands", "samples"}:
            raise ValueError("Only the declared observation fields are accepted")
        if not isinstance(value["time"], int) or value["time"] < 0:
            raise ValueError("Invalid observation clock")
        if value["bands"] not in ([0, 1, 2], [0, 1, 2, 3]):
            raise ValueError("Unknown sampling mode")
        for sample in value["samples"]:
            if set(sample) != {"signed_range", "captures"}:
                raise ValueError("Hidden or undeclared sample fields")
            if len(sample["captures"]) != len(value["bands"]):
                raise ValueError("Capture dimension does not match the instrument")
            if not math.isfinite(sample["signed_range"]) or any(not math.isfinite(v) or v < 0 for v in sample["captures"]):
                raise ValueError("Invalid instrument value")
        return value

    def observe(self, payload):
        obs = self.decode_observation(payload)
        if self.last_time is not None and obs["time"] <= self.last_time:
            raise ValueError("Observations must advance the clock")
        self.last_time = obs["time"]
        self.last_observation = copy.deepcopy(obs)
        target = [self.target_template[i] for i in obs["bands"]]
        other = [self.other_template[i] for i in obs["bands"]]
        identifiable = spectral_distance(target, other) > self.spectral_tolerance
        matches = [sample for sample in obs["samples"]
                   if spectral_distance(sample["captures"], target) <= self.spectral_tolerance]
        # A single observation under an aliased instrument is not necessarily
        # the target. Previously acquired relational state can constrain it.
        if not identifiable:
            matches = [] if self.relative_target is None else [s for s in matches
                if abs(s["signed_range"] - self.relative_target) <= self.motion_tolerance]
        if len(matches) == 1:
            self.relative_target = matches[0]["signed_range"]
            self.last_observed = obs["time"]
            self.status = "observed"
        elif self.relative_target is not None:
            self.status = "inferred"
        else:
            self.status = "unresolved"
        self.mode = "full" if self.policy == "fixed_full" or self.status != "observed" else "coarse"
        return {"status": self.status, "relative_target": self.relative_target,
                "last_observed": self.last_observed, "sampling_identifies_templates": identifiable}

    def act(self):
        age = None if self.last_observed is None else self.last_time - self.last_observed
        if self.relative_target is None or age is None or age > self.max_age:
            command = 0.0
        else:
            remaining = max(abs(self.relative_target) - self.standoff, 0.0)
            magnitude = min(self.max_command, remaining / self.gain)
            command = math.copysign(magnitude, self.relative_target)
        return {"command": command, "sampling_mode": self.mode}

    def receive_body_return(self, payload):
        body = json.loads(payload)
        if set(body) != {"command", "measured_displacement"}:
            raise ValueError("Only declared body-return fields are accepted")
        command, measured = body["command"], body["measured_displacement"]
        if not math.isfinite(command) or not math.isfinite(measured):
            raise ValueError("Invalid body return")
        prediction = self.gain * command
        used = command if self.policy == "command_as_return_ablation" else measured
        self.body_odometry += used
        if self.relative_target is not None:
            self.relative_target -= used
        gain_before = self.gain
        if abs(command) > 1e-12 and self.policy != "frozen_calibration_ablation":
            ratio = measured / command
            self.gain = min(2.0, max(0.1, (1 - self.alpha) * self.gain + self.alpha * ratio))
        return {"predicted_displacement": prediction, "measured_displacement": measured,
                "used_displacement": used, "gain_before": gain_before, "gain_after": self.gain}

    def state(self):
        return {"target_relation": self.relative_target, "status": self.status,
                "last_observed": self.last_observed, "body_odometry": self.body_odometry,
                "retained_gain": self.gain}

class SpectralWorld:
    """Synthetic environment; hidden state is accessible only to the evaluator."""
    def __init__(self, config, scenario, seed, permuted_labels=False):
        self.c = config
        self.scenario = scenario
        self.seed = seed
        self.position = 0.0
        self.clock = 0
        side = -1 if seed % 4 == 3 else 1
        self.objects = [
            {"identity": "target" if not permuted_labels else "secret-Y", "is_target": True,
             "position": side * (config["targetDistanceBase"] + 0.05 * (seed % 5)), "reflectance": tuple(config["targetReflectance"])},
            {"identity": "other" if not permuted_labels else "secret-X", "is_target": False,
             "position": -side * (config["otherDistanceBase"] + 0.05 * (seed % 3)), "reflectance": tuple(config["otherReflectance"])},
        ]
        self.permuted = permuted_labels

    def gain(self):
        changing = self.scenario in ("gain_change", "occlusion_gain", "uniform_illumination_gain", "adverse_colour_shift")
        return self.c["changedGain"] if changing and self.clock >= self.c["gainChangeTime"] else 1.0

    def observation(self, mode):
        bands = self.c["fullBands"] if mode == "full" else self.c["coarseBands"]
        illumination = [1.0] * 4
        if self.clock >= self.c["illuminationChangeTime"]:
            if self.scenario == "uniform_illumination_gain":
                illumination = self.c["uniformIlluminant"]
            elif self.scenario == "adverse_colour_shift":
                illumination = self.c["adverseColouredIlluminant"]
        samples = []
        hidden_target = self.scenario in ("occlusion", "occlusion_gain", "uniform_illumination_gain", "adverse_colour_shift") and self.clock in self.c["occlusionTimes"]
        for item in self.objects:
            if item["is_target"] and hidden_target:
                continue
            samples.append({"signed_range": item["position"] - self.position,
                            "captures": [item["reflectance"][i] * illumination[i] for i in bands]})
        random.Random(self.seed * 1000 + self.clock).shuffle(samples)
        if self.permuted:
            samples.reverse()
        return json.dumps({"time": self.clock, "bands": bands, "samples": samples}, allow_nan=False)

    def execute(self, action):
        if set(action) != {"command", "sampling_mode"} or action["sampling_mode"] not in ("coarse", "full"):
            raise ValueError("Invalid actuator/instrument request")
        if not math.isfinite(action["command"]) or abs(action["command"]) > self.c["maxCommand"] + 1e-12:
            raise ValueError("Out-of-range movement command")
        actual = self.gain() * action["command"]
        self.position += actual
        self.clock += 1
        return json.dumps({"command": action["command"], "measured_displacement": actual}, allow_nan=False)

    def evaluator_truth(self):
        target = next(x for x in self.objects if x["is_target"])
        return {"position": self.position, "target_relative": target["position"] - self.position,
                "actual_gain": self.gain(), "clock": self.clock}

def run_episode(config, scenario, seed, policy, permuted_labels=False):
    world = SpectralWorld(config, scenario, seed, permuted_labels)
    agent = ReferenceController(controller_settings(config), policy)
    records = []
    for step in range(config["steps"]):
        truth_before = world.evaluator_truth()
        prior = agent.state()
        payload = world.observation(agent.mode)
        acquisition = json.loads(payload)
        relation = agent.observe(payload)
        action = agent.act()
        after_observation = agent.state()
        return_payload = world.execute(action)
        returned = agent.receive_body_return(return_payload)
        truth_after = world.evaluator_truth()
        # All comparisons to truth happen outside the controller.
        prior_error = None if prior["target_relation"] is None else abs(prior["target_relation"] - truth_before["target_relative"])
        relation_error = None if relation["relative_target"] is None else abs(relation["relative_target"] - truth_before["target_relative"])
        records.append({"step": step, "observation": acquisition, "prior_state": prior,
            "state_after_observation": after_observation, "action": action, "body_return": returned,
            "state_after_return": agent.state(), "evaluator_before": truth_before, "evaluator_after": truth_after,
            "prior_relation_absolute_error": prior_error, "observed_relation_absolute_error": relation_error if relation["status"] == "observed" else None,
            "return_prediction_absolute_error": abs(returned["predicted_displacement"] - returned["measured_displacement"]),
            "capture_count": sum(len(s["captures"]) for s in acquisition["samples"])})
    def mean(values):
        values = [x for x in values if x is not None]
        return sum(values) / len(values) if values else None
    final = world.evaluator_truth()
    metric = {"scenario": scenario, "seed": seed, "policy": policy,
        "mean_prior_relation_absolute_error": mean(r["prior_relation_absolute_error"] for r in records),
        "maximum_observed_relation_error": max((r["observed_relation_absolute_error"] for r in records if r["observed_relation_absolute_error"] is not None), default=None),
        "mean_return_prediction_absolute_error": mean(r["return_prediction_absolute_error"] for r in records),
        "final_standoff_error": abs(abs(final["target_relative"]) - config["desiredStandoff"]),
        "inferred_steps": sum(r["state_after_observation"]["status"] == "inferred" for r in records),
        "unresolved_steps": sum(r["state_after_observation"]["status"] == "unresolved" for r in records),
        "captures": sum(r["capture_count"] for r in records), "final_gain": agent.gain,
        "commands_without_usable_relation": sum(abs(r["action"]["command"]) > 1e-12 and
             (r["state_after_observation"]["last_observed"] is None or r["step"] - r["state_after_observation"]["last_observed"] > config["maxInferredAgeForMovement"]) for r in records)}
    return {"metrics": metric, "events": records}
