"""Separate reconstruction of parameter updates and actual decoder measurements."""
import argparse
import csv
import hashlib
import hmac
import json
from pathlib import Path
import subprocess
import sys
import time
from gpt2_adapter_v5 import ROOT,Decoder,np,sha

TRAIN=ROOT/"results/gpt2-learning-06"
EVAL=ROOT/"results/gpt2-learning-eval-06"
OUT=ROOT/"reviews/gpt2-learning-06"

def read_csv(path):
    with path.open(newline="",encoding="utf-8") as f:return list(csv.DictReader(f))

def load_npz(path):
    with np.load(path,allow_pickle=False) as f:return {key:f[key] for key in f.files}

def key(weights):return hashlib.sha256(np.asarray(weights,dtype=np.float64).tobytes()).hexdigest()

def cap(weights):
    return weights*min(1.,4./max(float(np.linalg.norm(weights)),1e-12))

def update(weights,nonce,message,verify=True):
    body=json.dumps({k:v for k,v in message.items() if k!="signature"},sort_keys=True,separators=(",",":"),allow_nan=False).encode()
    signed=hmac.new(b"public-gpt2-feedback-v6-fixture-not-a-production-secret",body,"sha256").hexdigest()
    okay=message["step"]>nonce and message["source"]==key(weights) and (not verify or hmac.compare_digest(signed,message["signature"]))
    if not okay:return weights,nonce,False
    delta=message["plus"]-message["minus"]
    changed=weights.copy();changed.flat[message["coordinate"]]+=0 if abs(delta)<=1e-12 else (0.5 if delta>0 else -0.5)
    return cap(changed),message["step"],True

def patch(h,weights,basis):
    x=np.concatenate((basis["R"]@(h.reshape(768).astype(np.float64)-basis["mean"])/basis["scale"],[1.]))
    delta=basis["R"].T@(basis["scale"]*(weights@x))
    ratio=min(1.,float(basis["cap"])/max(float(np.linalg.norm(delta)),1e-12))
    return h+(ratio*delta).astype(np.float32).reshape(1,1,768)

def frozen():
    for directory in (TRAIN,EVAL):
        for name,expected in json.loads((directory/"INPUT-FREEZE.json").read_text()).items():assert sha(ROOT/name)==expected

def trace_audit():
    frozen();OUT.mkdir(parents=True,exist_ok=True)
    measurements=read_csv(TRAIN/"measurement-events.csv")
    observed={(r["policy"],int(r["step"]),int(r["sign"])):r for r in measurements}
    history=load_npz(TRAIN/"parameter-history.npz");final=load_npz(TRAIN/"learned-parameters.npz")
    updates=read_csv(TRAIN/"update-events.csv");schedule=json.loads((TRAIN/"SCHEDULE.json").read_text())
    states={};nonces={}
    for row in updates:
        policy=row["policy"];step=int(row["step"])
        current=states.get(policy,np.zeros((4,5)));nonce=nonces.get(policy,-1)
        message=json.loads(row["message"]);assert key(current)==row["before"]
        source=policy;donor=step;field="internal_score"
        if policy=="task":field="task_score"
        if policy in ("external_matched","yoked"):source="internal"
        if policy=="yoked":
            donor=(step//8)*8+schedule[(step//8)*8:(step//8)*8+8].index(schedule[step]^1)
            assert donor==int(row["donor_step"])
        pair=[0.,0.] if policy=="constant" else [float(observed[(source,donor,sign)][field]) for sign in (1,-1)]
        assert [message["plus"],message["minus"]]==pair
        current,nonce,accepted=update(current,nonce,message)
        assert accepted and key(current)==row["after"]
        np.testing.assert_array_equal(current,history[f"{policy}_{step:03d}"])
        states[policy]=current;nonces[policy]=nonce
    for policy,value in states.items():np.testing.assert_array_equal(value,final[policy])
    attacks=read_csv(TRAIN/"attack-events.csv");attack_states={};attack_nonces={}
    for row in attacks:
        receiver=row["receiver"];current=attack_states.get(receiver,states["internal"].copy());nonce=attack_nonces.get(receiver,79)
        assert key(current)==row["before"]
        current,nonce,accepted=update(current,nonce,json.loads(row["message"]),receiver=="guarded")
        assert int(accepted)==int(row["accepted"]) and key(current)==row["after"]
        attack_states[receiver]=current;attack_nonces[receiver]=nonce
    for name,value in attack_states.items():np.testing.assert_array_equal(value,final["post_attack_"+name])
    commands=[sys.executable,"-m","unittest","-v","test_labs","test_protocol_v2","test_context_provenance_v3",
              "test_active_receiver_v4","test_gpt2_v5","test_gpt2_learning_v6"]
    tests=subprocess.run(commands,cwd=ROOT/"applications",capture_output=True,text=True,timeout=35)
    (OUT/"APPLICATION-TESTS.log").write_text(tests.stdout+tests.stderr)
    assert tests.returncode==0,tests.stdout+tests.stderr
    receipt=dict(status="PASS",updates_reconstructed=len(updates),attacks_reconstructed=len(attacks),tests=42,
                 independent_review=False,auditor_sha256=sha(Path(__file__)))
    (OUT/"TRACE-AUDIT.json").write_text(json.dumps(receipt,indent=2)+"\n")
    print(json.dumps(receipt,indent=2))

def native_training_audit():
    start=time.monotonic();frozen();decoder=Decoder(max_seconds=75)
    metadata=json.loads((TRAIN/"TRAINING-CASES.json").read_text())
    base={case["id"]:decoder.prompt(case["ids"]) for case in metadata}
    meta={case["id"]:case for case in metadata};history=load_npz(TRAIN/"parameter-history.npz")
    basis=load_npz(TRAIN/"basis.npz");max_error=0.;checked=0
    for row in read_csv(TRAIN/"measurement-events.csv"):
        case=meta[row["case"]];corrupt=base[case["id"]]
        clean=base[case["family"]+"_"+case["other"]]
        step=int(row["step"])
        weights=np.zeros((4,5)) if step==0 else history[f"{row['policy']}_{step-1:03d}"].copy()
        assert key(weights)==row["source"]
        weights.flat[int(row["coordinate"])]+=int(row["sign"])*.25;weights=cap(weights)
        assert key(weights)==row["candidate"]
        value=patch(corrupt["hooks"]["r8"],weights,basis)
        result=decoder.step(case["ids"][-1],corrupt["before"],{"r8":value})
        target=clean["hooks"]["a9"].astype(np.float64);original=corrupt["hooks"]["a9"].astype(np.float64)
        internal=-float(np.sum((result["hooks"]["a9"].astype(np.float64)-target)**2))/max(float(np.sum((target-original)**2)),1e-8)
        logits=result["logits"].astype(np.float64);m=float(np.max(logits));token=decoder.ids(" "+case["recipient"])[0]
        task=float(logits[token]-m-np.log(np.exp(logits-m).sum()))
        error=max(abs(internal-float(row["internal_score"])),abs(task-float(row["task_score"])))
        max_error=max(max_error,error);assert error<1e-8
        checked+=1
    receipt=dict(status="PASS",actual_original_model_measurements_recomputed=checked,max_score_error=max_error,
                 step_calls=decoder.calls,elapsed_seconds=time.monotonic()-start,
                 auditor_sha256=sha(Path(__file__)),independent_review=False)
    (OUT/"NATIVE-TRAINING-AUDIT.json").write_text(json.dumps(receipt,indent=2)+"\n")
    print(json.dumps(receipt,indent=2))

def native_evaluation_audit():
    start=time.monotonic();frozen();decoder=Decoder(max_seconds=75)
    metadata=json.loads((EVAL/"CASES.json").read_text());final=load_npz(TRAIN/"learned-parameters.npz")
    final["internal_reload"]=final["internal"].copy();basis=load_npz(TRAIN/"basis.npz")
    rows=read_csv(EVAL/"evaluation-events.csv");saved=load_npz(EVAL/"evaluation-states.npz")
    indexed={(r["family"],r["expected"],r["arm"]):r for r in rows}
    max_error=0.;checked=0
    # At most two prefix states are retained for each bounded family.
    for offset in range(0,len(metadata),2):
        group=metadata[offset:offset+2];base={c["recipient"]:decoder.prompt(c["ids"]) for c in group}
        for case in group:
            corrupt=base[case["recipient"]];clean=base[case["other"]]
            for name in sorted({r["arm"] for r in rows}):
                if name=="clean_text":result=clean
                elif name in ("corrupted_no_edit","revoked_edit"):result=corrupt
                else:
                    h=corrupt["hooks"]["r8"]
                    if name=="oracle_current_donor":value=clean["hooks"]["r8"]
                    elif name=="mean_training_delta":value=h+basis["mean_delta"].reshape(1,1,768)
                    else:value=patch(h,final[name],basis)
                    result=decoder.step(case["ids"][-1],corrupt["before"],{"r8":value})
                row=indexed[(case["family"],case["recipient"],name)]
                z=result["logits"].astype(np.float64);m=float(np.max(z));probs=np.exp(z-m);probs/=probs.sum()
                target=decoder.ids(" "+case["recipient"])[0];other=decoder.ids(" "+case["other"])[0]
                assert int(np.argmax(z))==int(row["top_id"])
                error=max(abs(float(z[target]-z[other])-float(row["contrast"])),abs(float(probs[target])-float(row["target_probability"])))
                actual=result["hooks"]["a9"].astype(np.float64);desired=clean["hooks"]["a9"].astype(np.float64)
                denominator=max(float(np.sum((desired-corrupt["hooks"]["a9"].astype(np.float64))**2)),1e-8)
                score=float(np.sum((actual-desired)**2))/denominator
                error=max(error,abs(score-float(row["downstream_internal_error"])))
                np.testing.assert_array_equal(result["hooks"]["a9"],saved[case["id"]+"_"+name])
                max_error=max(max_error,error);assert error<0.00002
                checked+=1
        print("Audited family",group[0]["family"],flush=True)
    events=read_csv(EVAL/"authority-events.csv");stores={}
    for event in events:
        k=(event["family"],event["giver"],event["arm"])
        revision,scope=stores.get(k,(-1,[]))
        r=int(event["update_revision"]);s=json.loads(event["update_scope"])
        body=json.dumps([r,sorted(s)],separators=(",",":")).encode()
        signature=hmac.new(b"public-development-fixture-not-a-production-secret",body,"sha256").hexdigest()
        accepted=signature==event["signature"] and r>revision
        if accepted:revision,scope=r,s
        stores[k]=(revision,scope)
        assert accepted==bool(int(event["update_accepted"]))
        assert revision==int(event["store_revision"]) and scope==json.loads(event["store_scope"])
        allowed=[event["proposal"],"send"] in scope
        assert allowed==bool(int(event["executed"])) and int(event["unauthorized_execution"])==0
    for metric in read_csv(EVAL/"metrics.csv"):
        selected=[r for r in rows if r["split"]==metric["split"] and r["arm"]==metric["arm"]]
        assert len(selected)==int(metric["cases"])
        for key,out in (("contrast","mean_contrast"),("target_probability","mean_target_probability"),("downstream_internal_error","mean_downstream_error")):
            assert abs(sum(float(r[key]) for r in selected)/len(selected)-float(metric[out]))<1e-10
        for field in ("target_top1","invalid_top1"):
            assert sum(int(r[field]) for r in selected)==int(metric[field])
    receipt=dict(status="PASS",original_model_readouts_recomputed=checked,max_readout_error=max_error,
                 authority_events_recomputed=len(events),metric_rows_recomputed=30,step_calls=decoder.calls,
                 elapsed_seconds=time.monotonic()-start,auditor_sha256=sha(Path(__file__)),independent_review=False)
    (OUT/"NATIVE-EVALUATION-AUDIT.json").write_text(json.dumps(receipt,indent=2)+"\n")
    print(json.dumps(receipt,indent=2))

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("phase",choices=("trace","training","evaluation"));args=parser.parse_args()
    {"trace":trace_audit,"training":native_training_audit,"evaluation":native_evaluation_audit}[args.phase]()
