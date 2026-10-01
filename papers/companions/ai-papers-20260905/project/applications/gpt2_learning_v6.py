"""A bounded active correction layer around the frozen GPT-2 decoder."""
import argparse
import hashlib
import hmac
import json
from pathlib import Path
import time
from gpt2_adapter_v5 import ROOT, Decoder, np, sha
from gpt2_receiver_v5 import write_json, write_csv, observe

KEY=b"public-gpt2-feedback-v6-fixture-not-a-production-secret"
PROTOCOL=ROOT/"applications/PROTOCOL-GPT2-LEARNING-06.json"

def digest(weights):
    return hashlib.sha256(np.asarray(weights,dtype=np.float64).tobytes()).hexdigest()

def canonical(message):
    return json.dumps({k:v for k,v in message.items() if k!="signature"},sort_keys=True,separators=(",",":"),allow_nan=False).encode()

def envelope(controller,step,coordinate,plus,minus,sign=True):
    message=dict(step=int(step),coordinate=int(coordinate),source=digest(controller.weights),plus=float(plus),minus=float(minus))
    message["signature"]=hmac.new(KEY,canonical(message),"sha256").hexdigest() if sign else "untrusted-fixture"
    return message

def constrain(weights):
    norm=float(np.linalg.norm(weights))
    return weights*min(1.0,4.0/max(norm,1e-12))

class Controller:
    def __init__(self, weights=None, nonce=-1, verify=True):
        self.weights=np.zeros((4,5),dtype=np.float64) if weights is None else np.array(weights,dtype=np.float64,copy=True)
        self.nonce=nonce
        self.verify=verify

    def receive(self,message):
        if set(message)!={"step","coordinate","source","plus","minus","signature"}:
            return False
        if type(message["step"]) is not int or type(message["coordinate"]) is not int:
            return False
        if not 0<=message["coordinate"]<20 or message["step"]<=self.nonce:
            return False
        if message["source"]!=digest(self.weights):return False
        if any(type(message[k]) not in (float,int) or not np.isfinite(message[k]) for k in ("plus","minus")):
            return False
        expected=hmac.new(KEY,canonical(message),"sha256").hexdigest()
        if self.verify and not hmac.compare_digest(message["signature"],expected):return False
        gap=message["plus"]-message["minus"]
        step=0.0 if abs(gap)<=1e-12 else 0.5*np.sign(gap)
        weights=self.weights.copy()
        weights.flat[message["coordinate"]]+=step
        self.weights=constrain(weights)
        self.nonce=message["step"]
        return True

def feature(h, basis):
    return np.append(basis["R"]@(h.reshape(768).astype(np.float64)-basis["mean"])/basis["scale"],1.0)

def edit(h,weights,basis):
    delta=basis["R"].T@(basis["scale"]*(weights@feature(h,basis)))
    raw=float(np.linalg.norm(delta))
    factor=min(1.0,float(basis["cap"])/max(raw,1e-12))
    delta=(delta*factor).astype(np.float32).reshape(1,1,768)
    return (h+delta).astype(np.float32),float(np.linalg.norm(delta)),bool(factor<1)

def training_cases(decoder):
    families=json.loads((ROOT/"results/gpt2-receiver-05/FAMILIES.json").read_text())[:4]
    cases=[]
    for family in families:
        variants=[v for v in family["variants"] if v["item"]=="book"]
        states={v["giver"]:decoder.prompt(v["ids"]) for v in variants}
        for i,v in enumerate(variants):
            target=variants[1-i]
            # The observed prompt's giver is corrupted relative to the desired correction.
            cases.append(dict(id=family["id"]+"_"+v["giver"],family=family["id"],
                              prompt=v["text"],ids=v["ids"],recipient=v["giver"],other=target["giver"],
                              corrupt=states[v["giver"]],clean=states[target["giver"]]))
    return cases

def internal_score(result,case):
    target=case["clean"]["hooks"]["a9"].astype(np.float64)
    original=case["corrupt"]["hooks"]["a9"].astype(np.float64)
    error=result["hooks"]["a9"].astype(np.float64)-target
    return -float(np.sum(error*error))/max(float(np.sum((target-original)**2)),1e-8)

def log_probability(logits,token):
    z=logits.astype(np.float64)
    m=float(np.max(z))
    return float(z[token]-m-np.log(np.exp(z-m).sum()))

def fit_basis(cases):
    H=np.stack([c["corrupt"]["hooks"]["r8"].reshape(768) for c in cases]).astype(np.float64)
    Y=np.stack([c["clean"]["hooks"]["r8"].reshape(768) for c in cases]).astype(np.float64)
    delta=Y-H
    _,singular,R=np.linalg.svd(delta,full_matrices=False)
    R=R[:4]
    assert np.max(np.abs(R@R.T-np.eye(4)))<1e-10
    mean=H.mean(axis=0)
    scale=np.maximum(np.std((H-mean)@R.T,axis=0),1e-6)
    basis=dict(R=R,mean=mean,scale=scale,cap=np.array(2*np.median(np.linalg.norm(delta,axis=1))))
    X=np.stack([feature(c["corrupt"]["hooks"]["r8"],basis) for c in cases])
    target=delta@R.T/scale
    ridge=np.linalg.solve(X.T@X+0.01*np.eye(5),X.T@target).T
    ridge=constrain(ridge)
    basis["mean_delta"]=delta.mean(axis=0).astype(np.float32)
    return basis,singular,ridge

def train(out):
    start=time.monotonic();out=Path(out).resolve()
    assert out.is_relative_to(ROOT/"results")
    out.mkdir(parents=True,exist_ok=False)
    p=json.loads(PROTOCOL.read_text())
    paths=["applications/PROTOCOL-GPT2-LEARNING-06.json","applications/gpt2_learning_v6.py",
           "applications/gpt2_adapter_v5.py","applications/gpt2_receiver_v5.py",
           "results/gpt2-receiver-05/FAMILIES.json"]
    write_json(out/"INPUT-FREEZE.json",{path:sha(ROOT/path) for path in paths})
    decoder=Decoder(max_seconds=p["resource_limits"]["train_seconds"])
    cases=training_cases(decoder)
    basis,singular,ridge=fit_basis(cases)
    np.savez(out/"basis.npz",**basis)
    write_json(out/"TRAINING-CASES.json",[{k:c[k] for k in ("id","family","prompt","ids","recipient","other")} for c in cases])
    rng=np.random.default_rng(p["schedule_seed"])
    schedule=[]
    for _ in range(p["steps"]//8):schedule.extend(int(i) for i in rng.permutation(8))
    write_json(out/"SCHEDULE.json",schedule)
    controllers={name:Controller() for name in p["policies"]}
    measurements=[];updates=[];states={};internal_pairs={};last_messages={}
    for policy in ("internal","task","yoked","constant"):
        learner=controllers[policy]
        for t,index in enumerate(schedule):
            case=cases[index];coordinate=t%20;observed=[]
            before=learner.weights.copy()
            for sign in (1,-1):
                candidate=before.copy();candidate.flat[coordinate]+=sign*0.25
                candidate=constrain(candidate)
                patched,norm,capped=edit(case["corrupt"]["hooks"]["r8"],candidate,basis)
                result=decoder.step(case["ids"][-1],case["corrupt"]["before"],{"r8":patched})
                token=decoder.ids(" "+case["recipient"])
                assert len(token)==1
                internal=internal_score(result,case)
                task=log_probability(result["logits"],token[0])
                observed.append((internal,task))
                measurements.append(dict(policy=policy,step=t,case=case["id"],coordinate=coordinate,sign=sign,
                                         source=digest(before),candidate=digest(candidate),internal_score=internal,
                                         task_score=task,edit_norm=norm,capped=int(capped)))
            donor=-1
            if policy=="internal":
                rewards=[r[0] for r in observed];internal_pairs[t]=rewards
            elif policy=="task":rewards=[r[1] for r in observed]
            elif policy=="constant":rewards=[0.0,0.0]
            else:
                epoch=t//8;opposite=index^1
                donor=epoch*8+schedule[epoch*8:epoch*8+8].index(opposite)
                rewards=internal_pairs[donor]
            message=envelope(learner,t,coordinate,*rewards)
            accepted=learner.receive(message)
            assert accepted
            last_messages[policy]=message
            updates.append(dict(policy=policy,step=t,case=case["id"],donor_step=donor,message=json.dumps(message,sort_keys=True),
                                accepted=int(accepted),before=digest(before),after=digest(learner.weights)))
            states[f"{policy}_{t:03d}"]=learner.weights.copy()
            if policy=="internal":
                external=controllers["external_matched"]
                assert external is not learner and not np.shares_memory(external.weights,learner.weights)
                external_message=envelope(external,t,coordinate,*rewards)
                assert external.receive(external_message)
                np.testing.assert_array_equal(external.weights,learner.weights)
                updates.append(dict(policy="external_matched",step=t,case=case["id"],donor_step=t,
                                    message=json.dumps(external_message,sort_keys=True),accepted=1,
                                    before=digest(before),after=digest(external.weights)))
                states[f"external_matched_{t:03d}"]=external.weights.copy()
        print("Training completed",policy,"calls",decoder.calls,flush=True)
    states["supervised_ridge"]=ridge
    states["zero_parameter_reset"]=np.zeros((4,5))
    final={name:controller.weights.copy() for name,controller in controllers.items()}
    final.update(supervised_ridge=ridge,zero_parameter_reset=np.zeros((4,5)))
    attack=[]
    for label,verify in (("guarded",True),("unverified",False)):
        target=Controller(controllers["internal"].weights,controllers["internal"].nonce,verify)
        replay=last_messages["internal"]
        before=digest(target.weights);accepted=target.receive(replay)
        attack.append(dict(receiver=label,attempt="replay",message=json.dumps(replay,sort_keys=True),before=before,
                           accepted=int(accepted),after=digest(target.weights)))
        assert not accepted
        for i in range(40):
            message=envelope(target,80+i,i%20,0.0,-1.0,sign=False)
            before=digest(target.weights);accepted=target.receive(message)
            attack.append(dict(receiver=label,attempt="forged",message=json.dumps(message,sort_keys=True),before=before,
                               accepted=int(accepted),after=digest(target.weights)))
            assert accepted is (not verify)
        final["post_attack_"+label]=target.weights.copy()
    np.testing.assert_array_equal(final["post_attack_guarded"],final["internal"])
    np.savez(out/"parameter-history.npz",**states)
    np.savez(out/"learned-parameters.npz",**final)
    write_csv(out/"measurement-events.csv",measurements);write_csv(out/"update-events.csv",updates)
    write_csv(out/"attack-events.csv",attack)
    record=dict(status="EXECUTED_NOT_INDEPENDENTLY_REVIEWED",step_calls=decoder.calls,measurement_rows=len(measurements),
                update_rows=len(updates),attack_rows=len(attack),elapsed_seconds=time.monotonic()-start,
                adaptive_parameters_per_learner=20,subspace_singular_values=singular.tolist(),
                final_parameter_hashes={k:digest(v) for k,v in final.items()},
                model_sha256=sha(ROOT/"model-dependencies/gpt2-xenova-bf2c7f02/onnx/decoder_with_past_model_quantized.onnx"),
                exact_external_match=True,heldout_inference_performed=False)
    write_json(out/"TRAINING-RECEIPT.json",record)
    assert decoder.calls<1500 and sum(f.stat().st_size for f in out.iterdir() if f.is_file())<8_000_000
    print(json.dumps(record,indent=2))

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--output",required=True)
    train(parser.parse_args().output)
