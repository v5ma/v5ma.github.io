"""Bind the learned proposer to the actual reference monitor; only virtual actions."""
import os
for key in ("OMP_NUM_THREADS","OPENBLAS_NUM_THREADS","MKL_NUM_THREADS","NUMEXPR_NUM_THREADS"):
    os.environ[key]="1"
import csv
import hashlib
import json
from pathlib import Path
import time
import numpy as np
from causal_lab import Network, sigmoid, worlds
from commitment_lab import CommitmentStore, Proposal, sign_update

ROOT=Path(__file__).resolve().parent.parent


def main():
    dest=ROOT/"results"/"ca-learned-01"
    dest.mkdir(parents=True,exist_ok=False)
    config_path=ROOT/"applications"/"PROTOCOL-CA-LEARNED-01.json"
    config=json.loads(config_path.read_text(encoding="utf-8"))
    source_paths=[config_path,Path(__file__),ROOT/"applications"/"commitment_lab.py",ROOT/"applications"/"causal_lab.py",ROOT/"results"/"dev-02"/"models.json",ROOT/"results"/"dev-02"/"world-splits.json"]
    hashes={str(p.relative_to(ROOT)):hashlib.sha256(p.read_bytes()).hexdigest() for p in source_paths}
    (dest/"INPUT-FREEZE.json").write_text(json.dumps({"protocol":config,"hashes":hashes},indent=2)+"\n",encoding="utf-8")
    start=time.monotonic()
    models=json.loads((ROOT/"results"/"dev-02"/"models.json").read_text(encoding="utf-8"))
    ids=json.loads((ROOT/"results"/"dev-02"/"world-splits.json").read_text(encoding="utf-8"))["worlds"]["test"]
    bits,target,_=worlds()
    events,metrics=[],[]
    for seed in config["seeds"]:
        net=Network(seed);net.p={k:np.array(v) for k,v in models[str(seed)].items()}
        for scenario in config["scenarios"]:
            for policy in config["policies"]:
                violations=useful=eligible=rejected=proposals=0
                for world in ids:
                    x=np.concatenate((bits[world],np.zeros(2)))
                    selected=int(x[6]>0)
                    a=("B" if selected else "A","export")
                    stale=x.copy()
                    if scenario=="selected_grant_stale":stale[selected+2]*=-1
                    if scenario=="unselected_grant_stale":stale[1-selected+2]*=-1
                    available=x if policy=="refreshed_input_and_gate" else stale
                    p=float(sigmoid(net.tail(net.hidden(available[None,:])))[0])
                    candidate=p>=config["candidate_threshold"] and policy!="deny_all"
                    store=CommitmentStore()
                    truth=bool(target[world])
                    scope=frozenset({a}) if truth else frozenset()
                    assert store.accept(sign_update(1,scope))
                    passed=store.commit(Proposal(1,a,frozenset({a})))
                    execute=candidate if policy=="network_only" else candidate and passed
                    deny=candidate and not execute
                    violations+=int(execute and not truth);useful+=int(execute and truth)
                    eligible+=int(truth);rejected+=int(deny);proposals+=int(candidate)
                    events.append({"seed":seed,"scenario":scenario,"policy":policy,"world":world,"family":world&~12,"object":a[0],"truth_allowed":truth,"current_revision":1,"proposal_probability":p,"candidate":candidate,"executed":execute,"rejected":deny})
                metrics.append({"seed":seed,"scenario":scenario,"policy":policy,"worlds":len(ids),"families":len(set(w&~12 for w in ids)),"unauthorized_executions":violations,"useful_executions":useful,"eligible_requests":eligible,"useful_completion":useful/eligible,"rejected_proposals":rejected,"proposal_rate":proposals/len(ids)})
    for filename,rows in (("metrics.csv",metrics),("events.csv",events)):
        with (dest/filename).open("w",encoding="utf-8",newline="") as handle:
            writer=csv.DictWriter(handle,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    elapsed=time.monotonic()-start
    size=sum(p.stat().st_size for p in dest.iterdir() if p.is_file())
    assert elapsed<config["resources"]["max_seconds"] and size<config["resources"]["max_bytes"]
    assert all(hashlib.sha256((ROOT/k).read_bytes()).hexdigest()==v for k,v in hashes.items())
    summary={"execution":"PASS","scientific_promotion":"DEVELOPMENT_ONLY","conditions":len(metrics),"events":len(events),"seconds":elapsed,"bytes_before_summary":size,"shared_models_and_test_worlds":"dev-02; do not count as independent replication"}
    (dest/"SUMMARY.json").write_text(json.dumps(summary,indent=2)+"\n",encoding="utf-8")
    print(json.dumps(summary,indent=2))


if __name__=="__main__":
    main()
