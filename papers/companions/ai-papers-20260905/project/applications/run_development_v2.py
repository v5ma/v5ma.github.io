"""Donor-closed, one-thread development protocol. Original dev-01 code is unchanged."""
from __future__ import annotations
import os
for key in ("OMP_NUM_THREADS", "OPENBLAS_NUM_THREADS", "MKL_NUM_THREADS", "NUMEXPR_NUM_THREADS"):
    os.environ[key] = "1"
import csv
import hashlib
import json
from pathlib import Path
import time
import numpy as np
from causal_lab import Network, sigmoid, worlds, ridge, predict

ROOT = Path(__file__).resolve().parent.parent


def dump(path, value):
    path.write_text(json.dumps(value, indent=2, allow_nan=False)+"\n", encoding="utf-8")


def table(path, rows):
    with path.open("w", encoding="utf-8", newline="") as handle:
        w = csv.DictWriter(handle, fieldnames=list(rows[0]))
        w.writeheader()
        w.writerows(rows)


def partition(config):
    bits, target, _ = worlds()
    keys = sorted(set(n & ~12 for n in range(256)))
    groups = {k: [k, k|4, k|8, k|12] for k in keys}
    pos = [k for k in keys if target[groups[k]].sum() > 0]
    neg = [k for k in keys if k not in pos]
    assert len(pos) == 16 and len(neg) == 48
    rng = np.random.default_rng(config["split_seed"])
    rng.shuffle(pos); rng.shuffle(neg)
    family_sets = {"train": pos[:8]+neg[:24], "validation": pos[8:12]+neg[24:36], "test": pos[12:]+neg[36:]}
    result = {name: [w for k in families for w in groups[k]] for name,families in family_sets.items()}
    for name, ids in result.items():
        members = set(ids)
        assert all((w^4) in members and (w^8) in members for w in ids)
        assert len(ids) == 4*config["partition_families"][name]
    assert len(set(result["train"]+result["validation"]+result["test"])) == 256
    return result, family_sets


def batch(net, x, ids):
    h = net.hidden(x)
    context, delta, object_context, kinds, world_ids, unit_ids = [], [], [], [], [], []
    for selected_donor in (True, False):
        xd = x.copy()
        selected = (x[:,6]>0).astype(int)
        donor_index = selected if selected_donor else 1-selected
        xd[np.arange(len(x)), donor_index+2] *= -1
        donor_h = net.hidden(xd)
        c = np.repeat(h, 24, axis=0)
        u = np.tile(np.arange(24), len(x))
        d = np.zeros_like(c)
        d[np.arange(len(c)),u] = (donor_h-h).ravel()
        context.append(c); delta.append(d)
        object_context.append(np.repeat(x[:,6],24))
        kinds.extend(["selected_grant" if selected_donor else "unselected_grant"]*len(c))
        world_ids.extend(np.repeat(ids,24).tolist()); unit_ids.extend(u.tolist())
    c = np.concatenate(context); d = np.concatenate(delta)
    object_context = np.concatenate(object_context)[:,None]
    effect = net.tail(c+d)-net.tail(c)
    feats = {"global_linear": d,
             "matched_polynomial": np.column_stack((d,d*d,d*d*d)),
             "unit_local_context": np.column_stack((d,d*c,d*object_context))}
    return c,d,effect,feats,kinds,np.array(world_ids),np.array(unit_ids)


def main():
    dest = ROOT/"results"/"dev-02"
    dest.mkdir(parents=True, exist_ok=False)
    paths = [ROOT/"applications"/n for n in ("PROTOCOL-DEV-02.json", "run_development_v2.py", "causal_lab.py")]
    hashes = {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in paths}
    config = json.loads(paths[0].read_text(encoding="utf-8"))
    start = time.monotonic()
    dump(dest/"INPUT-FREEZE.json", {"protocol":config, "hashes":hashes, "numpy":np.__version__})
    try:
        split, family_sets = partition(config)
        dump(dest/"world-splits.json", {"worlds":split,"families":family_sets,"donor_closed":True})
        bits,y,grant = worlds()
        xall = np.column_stack((bits,np.zeros((256,2))))
        rows, samples, family_rows, controls, saved_models = [], [], [], [], {}
        for seed in config["seeds"]:
            rng = np.random.default_rng(seed+1)
            train = np.array(split["train"])
            xt = np.repeat(xall[train],config["training_replicates"],axis=0)
            xt[:,-2:] = rng.normal(0,.25,xt[:,-2:].shape)
            net = Network(seed)
            net.train(xt,np.repeat(y[train],config["training_replicates"]),config["epochs"],config["learning_rate"],config["resources"]["max_seconds_per_training_seed"])
            bt = batch(net,xall[train],train)
            fit = {name:ridge(f,bt[2],config["ridge"]) for name,f in bt[3].items()}
            mean_gradient = net.gradient(net.hidden(xall[train])).mean(axis=0)
            probe = ridge(net.hidden(xall[train]),grant[train],config["ridge"])
            for part in ("validation","test"):
                ids = np.array(split[part]); x = xall[ids]; truth = y[ids]
                p = sigmoid(net.tail(net.hidden(x)))
                pos,neg = truth==1,truth==0
                task_balanced = .5*((p[pos]>=.5).mean()+(p[neg]<.5).mean())
                task_loss = float((-truth*np.log(np.clip(p,1e-9,1))-(1-truth)*np.log(np.clip(1-p,1e-9,1))).mean())
                c,d,effect,feats,kinds,wids,uids = batch(net,x,ids)
                outputs = {name:predict(f,fit[name]) for name,f in feats.items()}
                outputs["local_jacobian"] = (net.gradient(c)*d).sum(axis=1)
                outputs["averaged_jacobian"] = d@mean_gradient
                # Four-world shift selects another complete receiver family within split.
                wrong_h = net.hidden(np.roll(x,4,axis=0))
                wrong_c = np.concatenate((np.repeat(wrong_h,24,axis=0),)*2)
                outputs["wrong_context_jacobian"] = (net.gradient(wrong_c)*d).sum(axis=1)
                assert tuple(outputs) == tuple(config["methods"])
                lesion = np.zeros(len(effect)); wrong = np.zeros(len(effect)); restore = np.zeros(len(effect))
                for unit in range(24):
                    mask = uids==unit
                    w = net.p["w2"].copy(); w[unit]=0
                    lesion[mask] = net.tail(c[mask]+d[mask],w)-net.tail(c[mask],w)
                    w = net.p["w2"].copy(); w[(unit+1)%24]=0
                    wrong[mask] = net.tail(c[mask]+d[mask],w)-net.tail(c[mask],w)
                    restore[mask] = net.tail(c[mask]+d[mask])-net.tail(c[mask])
                for kind in config["donors"]:
                    mask = np.array(kinds)==kind
                    controls.append({"seed":seed,"split":part,"donor":kind,"max_same_route_lesion_effect":float(np.abs(lesion[mask]).max()),"mean_wrong_route_effect":float(np.abs(wrong[mask]).mean()),"mean_intact_effect":float(np.abs(effect[mask]).mean()),"max_exact_restore_error":float(np.abs(restore[mask]-effect[mask]).max())})
                    for method, prediction in outputs.items():
                        error=prediction-effect
                        rows.append({"seed":seed,"split":part,"donor":kind,"method":method,"task_accuracy":float(((p>=.5)==truth).mean()),"task_balanced_accuracy":float(task_balanced),"task_log_loss":task_loss,"relation_probe_accuracy":float(((predict(net.hidden(x),probe)>0)==(grant[ids]>0)).mean()),"intervention_mae":float(np.abs(error[mask]).mean()),"intervention_rmse":float(np.sqrt((error[mask]**2).mean())),"independent_families":len(family_sets[part]),"worlds":len(ids),"patches":int(mask.sum())})
                        for family in family_sets[part]:
                            fm = mask & ((wids & ~12)==family)
                            family_rows.append({"seed":seed,"split":part,"donor":kind,"method":method,"family":family,"mae":float(np.abs(error[fm]).mean()),"patches":int(fm.sum())})
                for k,e in enumerate(effect):
                    samples.append({"seed":seed,"split":part,"world":int(wids[k]),"family":int(wids[k]&~12),"unit":int(uids[k]),"donor":kinds[k],"actual_logit_effect":float(e),**{name:float(pred[k]) for name,pred in outputs.items()}})
            saved_models[str(seed)]={k:v.tolist() for k,v in net.p.items()}
        table(dest/"causal-metrics.csv",rows)
        table(dest/"causal-predictions.csv",samples)
        table(dest/"family-errors.csv",family_rows)
        table(dest/"controls.csv",controls)
        dump(dest/"models.json",saved_models)
        elapsed=time.monotonic()-start
        size=sum(p.stat().st_size for p in dest.iterdir() if p.is_file())
        assert elapsed<config["resources"]["max_total_seconds"] and size<config["resources"]["max_result_bytes"]
        assert all(hashlib.sha256(p.read_bytes()).hexdigest()==hashes[p.name] for p in paths)
        summary={"execution":"PASS","scientific_promotion":"DEVELOPMENT_ONLY","donor_closed":True,"trained_models":3,"metric_rows":len(rows),"patch_rows":len(samples),"family_metric_rows":len(family_rows),"seconds":elapsed,"bytes_before_summary":size,"limits":"No external review, independent confirmatory sample, LLMs, humans, feedback-regulation or biological transfer."}
        dump(dest/"SUMMARY.json",summary)
        print(json.dumps(summary,indent=2))
    except Exception as exc:
        dump(dest/"FAILURE.json",{"type":type(exc).__name__,"message":str(exc),"elapsed_seconds":time.monotonic()-start})
        raise


if __name__=="__main__":
    main()
