"""Fixed-parameter evaluation; clean teacher is withheld from adapter decisions."""
import argparse
import json
from pathlib import Path
import time
from gpt2_adapter_v5 import ROOT,Decoder,np,sha
from gpt2_learning_v6 import PROTOCOL,digest,edit,internal_score,training_cases
from gpt2_receiver_v5 import write_json,write_csv,observe,mediated
from commitment_lab import CommitmentStore,Proposal,sign_update

def heldout(decoder,protocol):
    for t,template in enumerate(protocol["heldout_templates"]):
        for pair,(a,b) in enumerate(protocol["heldout_name_pairs"]):
            texts={s:template.format(a=a,b=b,s=s) for s in (a,b)}
            ids={s:decoder.ids(texts[s]) for s in (a,b)}
            assert len(ids[a])==len(ids[b]) and all(len(decoder.ids(" "+s))==1 for s in (a,b))
            results={s:decoder.prompt(ids[s]) for s in (a,b)}
            for s,other in ((a,b),(b,a)):
                yield dict(id=f"H{2*t+pair:02d}_{s}",family=f"H{2*t+pair:02d}",
                           prompt=texts[s],ids=ids[s],recipient=s,other=other,
                           corrupt=results[s],clean=results[other])

def evaluate(training,out):
    start=time.monotonic();training=Path(training).resolve();out=Path(out).resolve()
    assert training.is_relative_to(ROOT/"results") and out.is_relative_to(ROOT/"results")
    out.mkdir(parents=True,exist_ok=False)
    protocol=json.loads(PROTOCOL.read_text())
    trained=json.loads((training/"TRAINING-RECEIPT.json").read_text())
    original_freeze=json.loads((training/"INPUT-FREEZE.json").read_text())
    assert all(sha(ROOT/name)==expected for name,expected in original_freeze.items())
    with np.load(training/"basis.npz",allow_pickle=False) as data:basis={k:data[k] for k in data.files}
    with np.load(training/"learned-parameters.npz",allow_pickle=False) as data:weights={k:data[k] for k in data.files}
    assert all(digest(weights[k])==v for k,v in trained["final_parameter_hashes"].items())
    with np.load(training/"parameter-history.npz",allow_pickle=False) as history:
        np.testing.assert_array_equal(history["internal_079"],weights["internal"])
    weights["internal_reload"]=weights["internal"].copy()
    before={k:digest(v) for k,v in weights.items()}
    inputs={str((training/name).relative_to(ROOT)):sha(training/name) for name in
            ("INPUT-FREEZE.json","TRAINING-RECEIPT.json","basis.npz","learned-parameters.npz","parameter-history.npz")}
    inputs["applications/evaluate_gpt2_learning_v6.py"]=sha(Path(__file__))
    inputs["applications/commitment_lab.py"]=sha(ROOT/"applications/commitment_lab.py")
    write_json(out/"INPUT-FREEZE.json",inputs)
    decoder=Decoder(max_seconds=protocol["resource_limits"]["evaluate_seconds"])
    rows=[];actions=[];cases_manifest=[];arrays={}
    live=CommitmentStore();scope=frozenset({("residual","edit")})
    assert live.accept(sign_update(0,scope))
    revoked=CommitmentStore();assert revoked.accept(sign_update(0,scope))
    assert revoked.accept(sign_update(1,frozenset()))
    for split,stream in (("training",iter(training_cases(decoder))),("heldout",heldout(decoder,protocol))):
        for case in stream:
            cases_manifest.append({"split":split,**{k:case[k] for k in ("id","family","prompt","ids","recipient","other")}})
            h=case["corrupt"]["hooks"]["r8"]
            token=case["ids"][-1];cache=case["corrupt"]["before"]
            results={"clean_text":(case["clean"],0.0,False,False),
                     "corrupted_no_edit":(case["corrupt"],0.0,False,False)}
            # Only the named oracle can use this case's clean residual to choose its edit.
            donor=case["clean"]["hooks"]["r8"]
            results["oracle_current_donor"]=(decoder.step(token,cache,{"r8":donor}),float(np.linalg.norm(donor-h)),False,True)
            average=basis["mean_delta"].reshape(1,1,768)
            results["mean_training_delta"]=(decoder.step(token,cache,{"r8":h+average}),float(np.linalg.norm(average)),False,True)
            for name,parameters in weights.items():
                authorized=live.commit(Proposal(live.revision,("residual","edit"),scope))
                assert authorized
                value,norm,capped=edit(h,parameters,basis)
                results[name]=(decoder.step(token,cache,{"r8":value}),norm,capped,authorized)
            allowed=revoked.commit(Proposal(revoked.revision,("residual","edit"),scope))
            assert not allowed
            # Revocation removes the actual graph edit, not merely a logged permission label.
            result=decoder.step(token,cache,{"r8":edit(h,weights["internal"],basis)[0]} if allowed else None)
            results["revoked_edit"]=(result,0.0,False,allowed)
            for a,b in (("internal","external_matched"),("internal","internal_reload"),("internal","post_attack_guarded"),
                        ("corrupted_no_edit","zero_parameter_reset"),("corrupted_no_edit","revoked_edit")):
                np.testing.assert_array_equal(results[a][0]["logits"],results[b][0]["logits"])
            for name,(result,norm,capped,allowed) in results.items():
                row=dict(family=case["family"],split=split,giver=case["other"],expected=case["recipient"],
                         other=case["other"],arm=name,edit_norm=norm,capped=int(capped),edit_authorized=int(allowed),
                         **observe(decoder,result,case["recipient"],case["other"]),
                         downstream_internal_error=-internal_score(result,case))
                rows.append(row);actions.extend(mediated(row))
                arrays[case["id"]+"_"+name]=result["hooks"]["a9"].copy()
            arrays[case["id"]+"_corrupt_r8"]=h.copy()
            arrays[case["id"]+"_clean_r8"]=donor.copy()
            assert decoder.calls<1500
        print("Evaluation completed",split,"calls",decoder.calls,flush=True)
    assert before=={k:digest(v) for k,v in weights.items()}
    write_json(out/"CASES.json",cases_manifest)
    write_csv(out/"evaluation-events.csv",rows);write_csv(out/"authority-events.csv",actions)
    np.savez(out/"evaluation-states.npz",**arrays)
    metrics=[]
    for split in ("training","heldout"):
        for name in sorted({r["arm"] for r in rows}):
            selected=[r for r in rows if r["split"]==split and r["arm"]==name]
            narrow=[r for r in actions if r["split"]==split and r["arm"]==name and r["stage"]=="narrow"]
            metrics.append(dict(split=split,arm=name,cases=len(selected),
                                target_top1=sum(r["target_top1"] for r in selected),
                                invalid_top1=sum(r["invalid_top1"] for r in selected),
                                mean_target_probability=sum(r["target_probability"] for r in selected)/len(selected),
                                mean_contrast=sum(r["contrast"] for r in selected)/len(selected),
                                mean_downstream_error=sum(r["downstream_internal_error"] for r in selected)/len(selected),
                                edits_capped=sum(r["capped"] for r in selected),
                                useful=sum(r["useful"] for r in narrow),
                                raw_unauthorized=sum(r["raw_unauthorized"] for r in narrow),
                                unauthorized_executions=sum(r["unauthorized_execution"] for r in narrow)))
    write_csv(out/"metrics.csv",metrics)
    record=dict(status="EXECUTED_NOT_INDEPENDENTLY_REVIEWED",step_calls=decoder.calls,
                cases=len(cases_manifest),evaluation_rows=len(rows),authority_rows=len(actions),
                elapsed_seconds=time.monotonic()-start,parameter_hashes_unchanged=True,
                exact_reload_external_guarded_and_reset_relations=True,heldout_clean_states_used_by_learners=False,
                novel_task_domain=False,base_weights_changed=False)
    write_json(out/"EVALUATION-RECEIPT.json",record)
    assert sum(p.stat().st_size for p in out.iterdir() if p.is_file())<8_000_000
    print(json.dumps(record,indent=2))

if __name__=="__main__":
    parser=argparse.ArgumentParser();parser.add_argument("--training",required=True);parser.add_argument("--output",required=True)
    args=parser.parse_args();evaluate(args.training,args.output)
