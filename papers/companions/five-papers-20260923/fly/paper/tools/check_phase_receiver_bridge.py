"""Separate saved-event recomputation and causal challenges, same authoring agent.

Not independent scientific review. Scalar Euler check does not reuse the runner's
vector RHS; paired reruns do use its code and are labelled accordingly.
"""
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS"):
    os.environ[key] = "1"
import copy
import json
import math
import time
import numpy as np
from phase_receiver_bridge import (APP, ROOT, PLAN_PATH, BridgeController, digest, graph,
    inputs, relative_signal, run_episode)
from embodied_reference import controller_settings
from run_phase_receiver_case import low_priority


def near(a, b, tol=1e-10):
    if a is None or b is None:
        return a is b
    return abs(a-b) <= tol


def recompute_metrics(ep, config):
    rows = ep["events"]
    prior = [abs(r["priorState"]["target_relation"]-r["evaluatorBefore"]["target_relative"])
             for r in rows if r["priorState"]["target_relation"] is not None]
    observed = [abs(r["relation"]["relative_target"]-r["evaluatorBefore"]["target_relative"])
                for r in rows if r["relation"]["status"] == "observed"]
    return {"meanPriorRelationError": sum(prior)/len(prior) if prior else None,
        "maximumObservedRelationError": max(observed) if observed else None,
        "meanReturnPredictionError": sum(abs(r["bodyReturn"]["gain_before"]*r["action"]["command"]-r["bodyPayload"]["measured_displacement"]) for r in rows)/len(rows),
        "finalStandoffError": abs(abs(rows[-1]["evaluatorAfter"]["target_relative"])-config["desiredStandoff"]),
        "observedSteps": sum(r["relation"]["status"] == "observed" for r in rows),
        "inferredSteps": sum(r["relation"]["status"] == "inferred" for r in rows),
        "unresolvedSteps": sum(r["relation"]["status"] == "unresolved" for r in rows),
        "captures": sum(len(s["captures"]) for r in rows for s in r["observation"]["samples"]),
        "commandsWithoutUsableRelation": sum(abs(r["action"]["command"]) > 1e-12 and
            (r["relation"]["last_observed"] is None or r["step"]-r["relation"]["last_observed"] > config["maxInferredAgeForMovement"]) for r in rows),
        "finalGain": rows[-1]["stateAfterReturn"]["retained_gain"]}


def event_contract(row, config, settings):
    obs, rel, action, body = row["observation"], row["relation"], row["action"], row["bodyReturn"]
    if set(obs) != {"time", "bands", "samples"} or obs["time"] != row["step"]:
        return False
    if any(set(s) != {"signed_range", "captures"} for s in obs["samples"]):
        return False
    if action["sampling_mode"] not in ("coarse", "full") or not near(body["used_displacement"], row["bodyPayload"]["measured_displacement"]):
        return False
    expected = 0.0
    age = None if rel["last_observed"] is None else row["step"]-rel["last_observed"]
    if rel["relative_target"] is not None and age is not None and age <= config["maxInferredAgeForMovement"]:
        magnitude = min(config["maxCommand"], max(abs(rel["relative_target"])-config["desiredStandoff"], 0)/body["gain_before"])
        expected = math.copysign(magnitude, rel["relative_target"])
    if not near(action["command"], expected):
        return False
    if not near(row["bodyPayload"]["measured_displacement"], action["command"]*row["evaluatorBefore"]["actual_gain"]):
        return False
    after_target = None if rel["relative_target"] is None else rel["relative_target"]-body["used_displacement"]
    if not near(row["stateAfterReturn"]["target_relation"], after_target):
        return False
    if rel["status"] == "observed" and not any(near(rel["relative_target"], s["signed_range"]) for s in obs["samples"]):
        return False
    if "receiver" in rel:
        if len(rel["receiver"]) != len(obs["samples"]):
            return False
        for sample, evidence in zip(obs["samples"], rel["receiver"], strict=True):
            total = sum(sample["captures"])
            x = [0.0]*4
            if total > 0:
                for j, value in zip(obs["bands"], sample["captures"], strict=True):
                    x[j] = value/total-1/len(obs["bands"])
            if any(not near(a,b) for a,b in zip(x, evidence["normalizedTonicDifference"], strict=True)):
                return False
            for phi, delivered, pair in zip(evidence["relativePhase"], evidence["deliveredRelativePhase"], evidence["signal"], strict=True):
                if abs(phi) > settings["phaseBound"] or not near(pair[0], math.cos(delivered)) or not near(pair[1], math.sin(delivered)):
                    return False
    return True


def learned_contract(ep):
    history = ep["familiarization"]
    if len(history) != 12:
        return False
    for mask in ("012", "0123"):
        for cue in ("target", "other"):
            rows = [h for h in history if "".join(map(str,h["bands"])) == mask and h["cue"] == cue]
            if [h["count"] for h in rows] != [1,2,3] or ep["learned"][mask][cue]["count"] != 3:
                return False
            mean = np.mean(np.asarray([h["signal"] for h in rows]), axis=0)
            if float(np.max(np.abs(mean-np.asarray(ep["learned"][mask][cue]["weight"])))) > 1e-12:
                return False
    return True


def main():
    start = time.perf_counter()
    priority = low_priority()
    plan, seeds, routes, env = inputs()
    deadline = start + plan["resourceLimits"]["maximumCheckSeconds"]
    out = APP/"checks-01"
    out.mkdir(exist_ok=False)
    checks, results, mutations = [], {}, []
    def ck(name, condition):
        checks.append({"name": name, "passed": bool(condition)})
        if not condition:
            raise AssertionError(name)
        if time.perf_counter() > deadline:
            raise TimeoutError("Checker budget reached")
    try:
        loaded = {}
        registered = set(s["identifier"] for s in seeds)
        within = [r for r in routes if r["sourceId"] in registered and r["targetId"] in registered]
        ck("ten sampled cells and fifteen directed routes", len(registered) == 10 and len(within) == 15)
        ck("two disagreement intervals", sum(len(r["countVariants"]) > 1 for r in within) == 2)
        for case in plan["cases"]:
            folder = APP/"run-01"/case["id"]
            receipt = json.loads((folder/"EXECUTION.json").read_text("utf-8"))
            data = json.loads((folder/"EPISODES.json").read_text("utf-8"))
            loaded[case["id"]] = data
            ck(case["id"]+" output hash", digest(folder/"EPISODES.json") == receipt["episodesSha256"])
            ck(case["id"]+" fixed plan", digest(PLAN_PATH) == receipt["planSha256"])
            for name, expected in receipt["codeSha256"].items():
                ck(case["id"]+" code "+name, digest(ROOT/"tools"/name) == expected)
            ck(case["id"]+" complete episode grid", [(e["metrics"]["scenario"],e["metrics"]["seed"]) for e in data["episodes"]] == [(s,t) for s in env["scenarios"] for t in env["seeds"]])
            ck(case["id"]+" resource bound", receipt["elapsedSeconds"] < 40 and receipt["numericalThreads"] == 1 and "verified" in receipt["priority"])
            if data["graph"] is not None:
                g = data["graph"]
                manual = np.zeros((10,10))
                index = {v:i for i,v in enumerate(g["identifiers"])}
                source_types = {s["identifier"]:s["type"] for s in seeds}
                for r in within:
                    sign = case["unknownSign"]
                    pair = (source_types[r["sourceId"]],source_types[r["targetId"]])
                    if pair == ("pDm8","Tm5b"):
                        sign = 1
                    elif pair == ("yDm8","Tm5a"):
                        sign = -1
                    count = sorted(r["countVariants"])[0 if case["counts"] == "lower" else -1]
                    manual[index[r["targetId"]],index[r["sourceId"]]] = count*sign
                for i in range(10):
                    total = sum(abs(float(v)) for v in manual[i])
                    if total:
                        manual[i] /= total
                ck(case["id"]+" independently reconstructed directed matrix", np.array_equal(manual,np.asarray(g["matrix"])))
                ck(case["id"]+" reduction not all anatomy", g["excludedReportedRoutes"] == len(routes)-15)
            for index, ep in enumerate(data["episodes"]):
                prefix = case["id"]+" episode "+str(index)
                ck(prefix+" event count", len(ep["events"]) == 24)
                for name, actual in recompute_metrics(ep,env["configuration"]).items():
                    ck(prefix+" metric "+name, near(actual,ep["metrics"][name]))
                for row in ep["events"]:
                    ck(prefix+" event "+str(row["step"]), event_contract(row,env["configuration"],data["settings"]))
                if "learned" in ep:
                    ck(prefix+" actual familiarization average", learned_contract(ep))
                    ck(prefix+" no raw template bypass", "target_template" not in ep["controllerFields"] and "other_template" not in ep["controllerFields"])
                    ck(prefix+" aliased start", ep["events"][0]["relation"]["status"] == "unresolved" and ep["events"][0]["action"]["command"] == 0)
                    ck(prefix+" bounded phase", ep["testCounters"]["maximumPhase"] <= 1)
        base = loaded["phase-low-positive"]
        twin = loaded["coordinate-twin"]
        half = loaded["phase-half-step"]
        max_twin_signal, max_half_phase, max_action = 0.0,0.0,0.0
        for left, right, fine in zip(base["episodes"],twin["episodes"],half["episodes"],strict=True):
            for a,b,c in zip(left["events"],right["events"],fine["events"],strict=True):
                max_action = max(max_action,abs(a["action"]["command"]-b["action"]["command"]))
                ck("coordinate paired status/mask "+str(len(checks)), a["relation"]["status"] == b["relation"]["status"] and a["action"]["sampling_mode"] == b["action"]["sampling_mode"])
                for ra,rb,rc in zip(a["relation"]["receiver"],b["relation"]["receiver"],c["relation"]["receiver"],strict=True):
                    max_twin_signal = max(max_twin_signal,float(np.max(np.abs(np.asarray(ra["signal"])-np.asarray(rb["signal"])))))
                    max_half_phase = max(max_half_phase,float(np.max(np.abs(np.asarray(ra["relativePhase"])-np.asarray(rc["relativePhase"])))))
        ck("coordinate paired actions",max_action <= plan["tolerances"]["coordinateAction"])
        ck("half step relative phase",max_half_phase <= plan["tolerances"]["halfStepPhase"])
        results["coordinateTwin"] = {"maximumActionDifference":max_action,"maximumSignalDifference":max_twin_signal,"pairedEvents":576}
        results["halfStep"] = {"maximumEndpointPhaseDifference":max_half_phase,"tolerance":plan["tolerances"]["halfStepPhase"]}
        settings, case = base["settings"], base["case"]
        matrix = np.asarray(base["graph"]["matrix"])
        example = base["episodes"][0]["events"][1]["relation"]["receiver"]
        euler_diffs = []
        for ex in example:
            p = [0.0]*10
            dt = 0.0005
            drive = ex["drive"]
            for _ in range(8000):
                f = [-math.sin(p[i])+drive[i]+settings["coupling"]*sum(float(matrix[i,j])*math.sin(p[j]-p[i]) for j in range(10)) for i in range(10)]
                p = [a+dt*b for a,b in zip(p,f,strict=True)]
            euler_diffs.append(max(abs(a-b) for a,b in zip(p,ex["relativePhase"],strict=True)))
        ck("independent scalar Euler RHS", max(euler_diffs) < plan["tolerances"]["independentEulerPhase"])
        results["independentEuler"]={"dt":0.0005,"samples":len(example),"maximumEndpointDifference":max(euler_diffs)}
        rotations=[]
        for angle in (0.0,0.7,12.0,71.0):
            phi=np.asarray(example[0]["relativePhase"])
            rotations.append(float(np.max(np.abs(relative_signal(phi,angle,"phase")-relative_signal(phi,0,"coordinate")))))
        ck("common carrier rotation",max(rotations)<1e-12)
        results["commonCarrierRotationMaximumDifference"]=max(rotations)
        results["analyticBounds"]={"inwardMargin":math.sin(1)-0.8*0.75-0.12,"contractionRateLowerBound":math.cos(1)-2*0.12}
        ck("positive inward and contraction margins", min(results["analyticBounds"].values())>0)

        def new_agent():
            return BridgeController(controller_settings(env["configuration"]),matrix,settings,"phase",deadline)
        obs={"time":0,"bands":[0,1,2,3],"samples":[
            {"signed_range":3.5,"captures":env["configuration"]["targetReflectance"]},
            {"signed_range":-3.7,"captures":env["configuration"]["otherReflectance"]}]}
        causal={}
        for name in ("intact","erased","swapped","restored","flattened"):
            a=new_agent()
            if name == "erased":
                for values in a.learned.values():
                    for value in values.values():
                        value["weight"]=[[0.0,0.0] for _ in range(10)]
                        value["count"]=0
            if name in ("swapped","restored"):
                saved=copy.deepcopy(a.learned)
                for values in a.learned.values():
                    values["target"],values["other"]=values["other"],values["target"]
                if name == "restored":
                    a.learned=saved
            if name == "flattened":
                a.intervention="flatten"
            causal[name]={"relation":a.observe(json.dumps(obs)),"action":a.act(),"learned":a.learned}
        ck("readout weight content changes action",causal["intact"]["action"]["command"]>0 and causal["swapped"]["action"]["command"]<0)
        ck("erase learned readout removes usable relation",causal["erased"]["action"]["command"]==0 and causal["erased"]["relation"]["status"]=="unresolved")
        ck("restore actual learned weights rescues action",causal["restored"]["action"]==causal["intact"]["action"])
        ck("differential flatten removes this recognition",causal["flattened"]["action"]["command"]==0)
        a=new_agent()
        a.observe(json.dumps(obs))
        for _ in range(2):
            a.receive_body_return(json.dumps({"command":0.4,"measured_displacement":0.2}))
        retained, gain=copy.deepcopy(a.learned),a.gain
        a.clear_transient()
        ck("scoped reset retains readout and learned calibration",a.learned==retained and a.gain==gain==0.625 and a.relative_target is None and not a.receiver.cache)
        a.observe(json.dumps(obs))
        ck("readout still operates after temporary reset",a.act()["command"]>0)
        expected_fields={"alpha","max_command","standoff","spectral_tolerance","motion_tolerance","max_age","prior_gain","gain","policy","relative_target","last_observed","last_time","body_odometry","status","mode","last_observation","receiver","receiver_settings","learned","familiarization","intervention","training_counters"}
        ck("complete controller state allowlist",set(vars(a))==expected_fields)
        ck("complete receiver state allowlist",set(vars(a.receiver))=={"matrix","settings","projection","implementation","deadline","cache","counters"})
        for payload in (dict(obs,hidden_identity="target"),dict(obs,samples=[dict(obs["samples"][0],is_target=True)])):
            try:
                new_agent().observe(json.dumps(payload))
                rejected=False
            except ValueError:
                rejected=True
            ck("reject hidden observation fields "+str(len(checks)),rejected)
        permuted=run_episode(env["configuration"],"visible",19,case,matrix,settings,deadline,permuted=True)
        ck("hidden labels and sample order do not set action",[r["action"] for r in permuted["events"]]==[r["action"] for r in base["episodes"][0]["events"]])
        flat=run_episode(env["configuration"],"visible",19,case,matrix,settings,deadline,intervention="flatten")
        ck("flattened full episode contains no recognized target",flat["metrics"]["observedSteps"]==0)
        results["causalReadoutActions"]={k:v["action"]["command"] for k,v in causal.items()}
        results["extraEpisodeControls"]={"count":2,"flatMetrics":flat["metrics"],"permutedMetrics":permuted["metrics"]}
        results["scopedResetGain"]=gain

        # In-memory deliberate corruption tests; original files are never edited.
        original=base["episodes"][0]["events"][1]
        for name, change in (
            ("hidden observation field",lambda r:r["observation"].update(hidden_identity="target")),
            ("incorrect body return",lambda r:r["bodyReturn"].update(used_displacement=99)),
            ("invented internal relation",lambda r:r["relation"].update(relative_target=99)),
            ("incorrect carrier readout",lambda r:r["relation"]["receiver"][0]["signal"][0].__setitem__(0,99)),
            ("incorrect permitted action",lambda r:r["action"].update(command=-0.123)),
            ("invented tonic difference",lambda r:r["relation"]["receiver"][0]["normalizedTonicDifference"].__setitem__(0,99))):
            damaged=copy.deepcopy(original)
            change(damaged)
            caught=not event_contract(damaged,env["configuration"],settings)
            mutations.append({"name":name,"detected":caught})
            ck("corruption detection "+name,caught)
        ep=copy.deepcopy(base["episodes"][0]);ep["learned"]["0123"]["target"]["count"]=2
        mutations.append({"name":"corrupt familiarization count","detected":not learned_contract(ep)})
        ck("corrupt familiarization count",mutations[-1]["detected"])
        ep=copy.deepcopy(base["episodes"][0]);ep["metrics"]["captures"]+=1
        caught=recompute_metrics(ep,env["configuration"])["captures"]!=ep["metrics"]["captures"]
        mutations.append({"name":"corrupt saved metric","detected":caught});ck("corrupt metric",caught)

        results["caseSummary"]={key:{"episodes":len(data["episodes"]),"maximumBindingError":max(e["metrics"]["maximumObservedRelationError"] or 0 for e in data["episodes"]),
            "maximumStandoffError":max(e["metrics"]["finalStandoffError"] for e in data["episodes"]),
            "freshObservations":sum(e["metrics"]["observedSteps"] for e in data["episodes"]),
            "captures":sum(e["metrics"]["captures"] for e in data["episodes"]),
            "maximumPhase":max((e.get("testCounters",{}).get("maximumPhase",0) for e in data["episodes"])),
            "encoderSolves":sum(e.get("testCounters",{}).get("solves",0) for e in data["episodes"]),
            "meanAdverseObservedSteps":sum(e["metrics"]["observedSteps"] for e in data["episodes"] if e["metrics"]["scenario"]=="adverse_colour_shift")/4}
            for key,data in loaded.items()}
        for name,value in (("CAUSAL-READOUT.json",causal),("EXTRA-EPISODES.json",[permuted,flat])):
            (out/name).write_text(json.dumps(value,separators=(",",":"),allow_nan=False)+"\n",encoding="utf-8")
        report={"status":"passed","checksPassed":len(checks),"checksTotal":len(checks),"checks":checks,
            "results":results,"mutationTests":mutations,"elapsedSeconds":time.perf_counter()-start,"priority":priority,
            "reviewRole":"Separate computation by the same authoring agent, not independent review",
            "planSha256":digest(PLAN_PATH),"checkerSha256":digest(__file__),
            "inputReceipts":{c["id"]:digest(APP/"run-01"/c["id"]/"EXECUTION.json") for c in plan["cases"]},
            "outputs":{n:digest(out/n) for n in ("CAUSAL-READOUT.json","EXTRA-EPISODES.json")}}
        (out/"CHECKS.json").write_text(json.dumps(report,indent=2,allow_nan=False)+"\n",encoding="utf-8")
        print(json.dumps({k:v for k,v in report.items() if k not in ("checks","inputReceipts")},indent=2))
    except Exception as error:
        (out/"FAILURE.json").write_text(json.dumps({"errorType":type(error).__name__,"error":str(error),"checks":checks,"elapsedSeconds":time.perf_counter()-start},indent=2)+"\n",encoding="utf-8")
        raise


if __name__ == "__main__":
    main()
