"""Separate same-agent recomputation from saved timing outputs; no model import.

This validates file provenance, recorded state, phases, metrics and gap-current
identities. It is not independent scientific review or a native coupled replay.
"""
import bisect
import cmath
import ctypes
import hashlib
import json
import math
import os
from pathlib import Path
import statistics
import time
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "application/flight-timing-component-v0"
OUT = APP / "network-run-01/SEPARATE-CHECKS.json"


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text("utf-8"))


def score(phases):
    n = len(phases)
    ordered = sorted(float(p) % 1.0 for p in phases)
    gaps = [ordered[i + 1] - ordered[i] for i in range(n - 1)] + [1 + ordered[0] - ordered[-1]]
    dispersion = n / (n - 1) * sum((g - 1 / n) ** 2 for g in gaps)
    order = abs(sum(cmath.exp(2j * math.pi * p) for p in phases) / n)
    return dispersion, order


def recompute(trains, times):
    phase = [[] for _ in trains]
    gammas, orders = [], []
    for t in times:
        values = []
        for cell, spikes in enumerate(trains):
            before = bisect.bisect_right(spikes, float(t)) - 1
            if not 0 <= before < len(spikes) - 1:
                raise ValueError("Unbracketed phase sample")
            value = (t - spikes[before]) / (spikes[before + 1] - spikes[before])
            values.append(value)
            phase[cell].append(value)
        gamma, order = score(values)
        gammas.append(gamma)
        orders.append(order)
    return np.asarray(phase), 1 - math.sqrt(statistics.fmean(gammas)), statistics.fmean(orders)


def main():
    if OUT.exists():
        raise FileExistsError(OUT)
    if os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint]
        if not kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x4000):
            raise OSError("Priority change failed")
    started = time.perf_counter()
    checks, negative, summaries, cases = [], [], [], {}

    def ck(name, condition):
        checks.append({"name": name, "passed": bool(condition)})
        if not condition:
            raise AssertionError(name)

    plan = read(APP / "ANALYSIS-PLAN.json")
    native = read(APP / "native-audit-01/EXECUTION.json")
    ck("pinned_plan", sha(APP / "ANALYSIS-PLAN.json") == native["planSha256"])
    ck("native_gate_passed", native["status"] == "pass")
    ck("native_checked_engine", sha(ROOT / "tools/flight_timing_model.py") == native["modelSha256"])
    for case in native["cases"]:
        ck("native_output_" + case["regime"], sha(APP / "native-audit-01" / case["output"]) == case["outputSha256"])
    ck("perfect_splay_metric", abs(score([0, .2, .4, .6, .8])[0]) < 1e-28)
    ck("perfect_synchrony_metric", abs(score([0] * 5)[0] - 1) < 1e-14)
    ck("first_harmonic_distinguishes_examples", score([0] * 5)[1] == 1 and score([0, .2, .4, .6, .8])[1] < 1e-14)
    ck("circular_rotation_invariance", abs(score([0, .1, .4, .6, .6])[0] - score([.7, .8, 1.1, 1.3, 1.3])[0]) < 1e-14)
    # Two opposed clusters have first harmonic zero but are not a splay state.
    ck("first_harmonic_alone_is_insufficient", score([0, 0, .5, .5])[1] < 1e-14 and score([0, 0, .5, .5])[0] > .3)

    for case in plan["cases"]:
        name = case["name"]
        folder = APP / "network-run-01" / name
        report = read(folder / "EXECUTION.json")
        spikes = read(folder / "SPIKES.json")["trains"]
        with np.load(folder / "STATES-AND-PHASES.npz", allow_pickle=False) as bundle:
            data = {key: bundle[key].copy() for key in bundle.files}
        ck(name + "_declared_case", report["case"] == case and report["status"] == "pass")
        ck(name + "_frozen_plan", report["planSha256"] == native["planSha256"])
        ck(name + "_same_native_model", report["modelSha256"] == native["modelSha256"])
        ck(name + "_runner_pin", report["runnerSha256"] == sha(ROOT / "tools/run_flight_timing_case.py"))
        ck(name + "_resource_limits", report["workers"] == 1 and report["seconds"] < 45 and report["belowNormalPriorityVerified"] and all(x == "1" for x in report["threadEnvironment"].values()))
        for rel, expected in report["sourceHashes"].items():
            ck(name + "_source_" + Path(rel).name, sha(ROOT / rel) == expected)
        for rel, expected in report["artifacts"].items():
            ck(name + "_artifact_" + rel, sha(folder / rel) == expected)
        ck(name + "_array_names", set(data) == {"timeMs", "state", "phaseTimeMs", "phase", "gapMatrixNs"})
        state, times = data["state"], data["timeMs"]
        ck(name + "_state_shape", state.shape == (5001, 3, 5))
        ck(name + "_recording_clock", np.array_equal(times, np.arange(5001)))
        ck(name + "_finite_states", np.isfinite(state).all())
        ck(name + "_gate_bounds", np.all((state[:, 1:, :] >= 0) & (state[:, 1:, :] <= 1)))
        ck(name + "_exact_initial", np.array_equal(state[0], np.asarray(report["initialState"])))
        ck(name + "_voltage_summary", [float(state[:, 0].min()), float(state[:, 0].max())] == report["sampledVoltageRangeMv"])
        ck(name + "_gate_summary", [float(state[:, 1:].min()), float(state[:, 1:].max())] == report["sampledGateRange"])
        ck(name + "_spike_counts", [len(s) for s in spikes] == report["metrics"]["spikeCounts"])
        ck(name + "_spike_order_and_refractory", len(spikes) == 5 and all(all(b - a >= 10 - 1e-9 for a, b in zip(s, s[1:])) for s in spikes))
        ck(name + "_spike_domain_and_grid", all(0 <= t < 5000 and abs(t / case["dtMs"] - round(t / case["dtMs"])) < 1e-8 for s in spikes for t in s))
        phase_times = data["phaseTimeMs"]
        expected_times = np.arange(max(2000, max(s[0] for s in spikes)), min(5000, min(s[-1] for s in spikes)), 1.)
        ck(name + "_phase_window", np.array_equal(phase_times, expected_times))
        phase, splay, order = recompute(spikes, phase_times)
        ck(name + "_independently_interpolated_phase", np.max(abs(phase - data["phase"])) < 1e-13)
        ck(name + "_splayness", abs(splay - report["metrics"]["splayness"]) < 1e-13)
        ck(name + "_order", abs(order - report["metrics"]["meanFirstHarmonicOrder"]) < 1e-13)
        ck(name + "_metric_range", 0 <= splay <= 1 and 0 <= order <= 1 + 1e-14)
        rates = []
        for train in spikes:
            late = [x for x in train if x >= 2000]
            rates.append(1000 / statistics.median([b - a for a, b in zip(late, late[1:])]))
        ck(name + "_late_rates", np.allclose(rates, report["metrics"]["medianLateFrequenciesHz"], rtol=0, atol=1e-12))
        gap = data["gapMatrixNs"]
        ck(name + "_gap_symmetry_nonnegativity", gap.shape == (5, 5) and np.array_equal(gap, gap.T) and (gap >= 0).all() and (np.diag(gap) == 0).all())
        ck(name + "_gap_matches_record", np.array_equal(gap, np.asarray(report["gapMatrixNs"])))
        # Direct double sums, distinct from the vectorized model expression.
        residual, cancellation, maximum_work = 0., 0., -float("inf")
        for sample in np.linspace(0, 5000, 33).astype(int):
            v = state[sample, 0]
            currents = [sum(float(gap[i, j]) * (float(v[j]) - float(v[i])) for j in range(5)) for i in range(5)]
            work = sum(float(v[i]) * currents[i] for i in range(5))
            negative_square = -sum(float(gap[i, j]) * (float(v[i]) - float(v[j])) ** 2 for i in range(5) for j in range(i + 1, 5))
            residual = max(residual, abs(work - negative_square) / (1 + abs(negative_square)))
            cancellation = max(cancellation, abs(sum(currents)))
            maximum_work = max(maximum_work, work)
        ck(name + "_pairwise_current_conservation", cancellation < 1e-9)
        ck(name + "_gap_voltage_quadratic_identity", residual < 1e-12 and maximum_work <= 1e-9)
        # Test the detector with explicit in-memory corruptions; no evidence edited.
        tampered_phase = data["phase"].copy()
        tampered_phase[0, 0] += .1
        rejected = np.max(abs(phase - tampered_phase)) > 1e-13
        ck(name + "_reject_phase_mutation", rejected)
        negative.append(name + ":phase")
        rejected = abs(splay - (report["metrics"]["splayness"] + .01)) > 1e-13
        ck(name + "_reject_metric_mutation", rejected)
        negative.append(name + ":metric")
        summaries.append({"name": name, "regime": case["regime"], "gapNs": report["gapStrengthNs"], "dtMs": case["dtMs"], "splayness": splay, "meanFirstHarmonicOrder": order, "medianLateFrequenciesHz": rates, "spikeCounts": [len(s) for s in spikes], "seconds": report["seconds"], "executionSha256": sha(folder / "EXECUTION.json"), "maxGapIdentityRelativeResidual": residual, "maxCurrentSumResidualPa": cancellation})
        cases[name] = (data, spikes, report)

    coarse, cs, cr = cases["snl_weak"]
    fine, fs, fr = cases["snl_weak_halfstep"]
    splay_difference = abs(cr["metrics"]["splayness"] - fr["metrics"]["splayness"])
    max_voltage = float(np.max(abs(coarse["state"][:, 0] - fine["state"][:, 0])))
    convergence = {"statistic": "late-window splayness only", "absoluteSplaynessDifference": splay_difference,
                   "declaredTolerance": plan["measurements"]["convergenceToleranceSplayness"],
                   "withinTolerance": splay_difference <= plan["measurements"]["convergenceToleranceSplayness"],
                   "maximumSameClockVoltageDifferenceMv": max_voltage,
                   "maximumGateDifference": float(np.max(abs(coarse["state"][:, 1:] - fine["state"][:, 1:]))),
                   "spikeCountChangePerCell": [len(b) - len(a) for a, b in zip(cs, fs)],
                   "maxOrdinalSpikeShiftMsPerCell": [max(abs(a[i] - b[i]) for i in range(min(len(a), len(b)))) for a, b in zip(cs, fs)],
                   "fullTrajectoryConvergenceEstablished": False,
                   "coupledNativeAgreementEstablished": False}
    ck("declared_splay_statistic_convergence", convergence["withinTolerance"])
    result = {"status": "pass", "checkerSha256": sha(Path(__file__)), "planSha256": sha(APP / "ANALYSIS-PLAN.json"),
              "nativeAuditSha256": sha(APP / "native-audit-01/EXECUTION.json"),
              "checks": checks, "checksPassed": sum(x["passed"] for x in checks), "checksTotal": len(checks),
              "mutationDetections": negative, "cases": summaries, "convergence": convergence,
              "sameAgentRecomputation": True, "independentScientificReview": False, "seconds": time.perf_counter() - started,
              "boundary": "Checks do not independently validate every RK4 step or reproduce source Brian network scheduling; 1 ms storage does not resolve every threshold event"}
    with OUT.open("x", encoding="utf-8") as stream:
        json.dump(result, stream, indent=2, allow_nan=False)
    print(json.dumps({key: result[key] for key in ("status", "checksPassed", "checksTotal", "seconds", "convergence")}, indent=2))


if __name__ == "__main__":
    main()
