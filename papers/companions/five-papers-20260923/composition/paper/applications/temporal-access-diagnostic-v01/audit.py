"""Recompute recorded development diagnostics, not their external validity."""
from probes import ROOT,DONOR,np,standardize,forward,ridge_predict,relation,component_metrics,binary_metrics
from run_diagnostic import get_config,allowed_data,earlier_ceiling
from support import lower_priority,sha,save,metrics
from evaluate import freeze_check
from world import config as donor_config
import json


def read(p):
    return json.loads(p.read_text(encoding='utf-8'))


def main():
    lower_priority(); r=read(ROOT/'run-01/RESULT.json'); rr=read(ROOT/'run-replay-01/RESULT.json')
    checks={}
    def ck(name,value):
        checks[name]=bool(value)
        if not value:
            raise AssertionError(name)
    cfg=get_config()
    ck('27_current_pre_run_checks',read(ROOT/'TESTS-02.json')['passed'] and read(ROOT/'TESTS-02.json')['total']==27)
    ck('both_runs_complete',r['complete'] and rr['complete'])
    ck('training_development_only',r['splits']==['training','development'] and not r['heldout_inference'])
    ck('50_small_readout_fits',r['mlp_fits']==50)
    ck('resource_caps',r['max_fit_seconds']<5 and r['seconds']<60)
    ck('source_identities',all(sha(ROOT/n)==v for n,v in r['source_hashes'].items()))
    ck('numeric_result_replay',all(r[k]==rr[k] for k in ('rows','original','earlier_ceilings','source_hashes','models','data','splits')))
    for name in ('predictions.npz','readout-parameters.npz'):
        ck(name+'_exact_replay',sha(ROOT/'run-01'/name)==sha(ROOT/'run-replay-01'/name)==r['files'][name]['sha256']==rr['files'][name]['sha256'])
    freeze_check(donor_config())
    ck('six_original_models_unchanged',len(r['models'])==6)
    summary=[]
    with np.load(ROOT/'run-01/predictions.npz',allow_pickle=False) as ar,np.load(ROOT/'run-01/readout-parameters.npz',allow_pickle=False) as pa:
        normalized={}
        for row in r['rows']:
            name=row['view']; family=row['family']
            if name not in normalized:
                tx,dx,mean,std=standardize(ar[name+'__training_features'],ar[name+'__development_features'])
                ck(name+'_training_only_transform',np.array_equal(mean,ar[name+'__mean']) and np.array_equal(std,ar[name+'__std']))
                normalized[name]={'training':tx,'development':dx}
            if family in ('direct_tanh','random_label_tanh'):
                prefix=name+'__mlp'+str(row['seed'])
                best={k:pa[prefix+'__selected__'+k] for k in ('W1','b1','W2','b2')}
                last={k:pa[prefix+'__final__'+k] for k in ('W1','b1','W2','b2')}
                chosen=max(row['logs'],key=lambda q:(q['development']['accuracy'],-q['development']['nll']))
                ck(prefix+'_160_epochs_and_selection',len(row['logs'])==row['epochs']==160 and chosen['epoch']==row['selected_epoch'])
                for split in ('training','development'):
                    prob=forward(best,normalized[name][split])[0]
                    y=ar[split+('__noise_label' if family=='random_label_tanh' else '__label')]
                    expected=row['selected_train'] if split=='training' else row['selected_development']
                    final_expected=row['final_train'] if split=='training' else row['final_development']
                    ck(prefix+'_'+split+'_probabilities_and_metrics',np.array_equal(prob,ar[prefix+'__'+split+'_probabilities']) and binary_metrics(prob,y)==expected and binary_metrics(forward(last,normalized[name][split])[0],y)==final_expected)
            else:
                is_component=family=='component_ridge_supplied_relation'
                prefix=name+('__component_ridge' if is_component else '__direct_ridge')
                ck(prefix+'_development_penalty',max(row['selection']['grid'],key=lambda q:q['development_accuracy'])['penalty']==row['selection']['penalty'])
                for split in ('training','development'):
                    pred=ridge_predict(pa[prefix],normalized[name][split],2 if is_component else 1,4 if is_component else 2)
                    if not is_component:
                        pred=pred[:,0]
                        measured={'accuracy':float((pred==ar[split+'__label']).mean())}
                    else:
                        measured=component_metrics(pred,ar[split+'__pair'])
                    ck(prefix+'_'+split+'_predictions_and_metrics',np.array_equal(pred,ar[prefix+'__'+split]) and measured==row[split])
        for row in r['original']:
            data=allowed_data(row['split'])
            prob=ar[row['encoder']+'__'+row['split']+'__original_probabilities']
            measured=metrics(prob,data['y'],data['tasks'])
            ck(row['encoder']+'_'+row['split']+'_original_metrics',all(measured[k]==row[k] for k in measured))
        ck('twelve_earlier_state_half_ceilings',len(r['earlier_ceilings'])==12 and all(q['maximum_accuracy']==.5 and q['all_balanced'] for q in r['earlier_ceilings']))
    for c in ('additive','multiplicative'):
        for view in ('earlier','final','both','final_noise'):
            for family in ('direct_affine','direct_tanh','component_ridge_supplied_relation','random_label_tanh'):
                rows=[q for q in r['rows'] if q['view'].endswith('__'+c+'__'+view) and q['family']==family]
                if not rows:
                    continue
                a={'condition':c,'view':view,'family':family,'readouts':len(rows)}
                for split in ('training','development'):
                    if family in ('direct_tanh','random_label_tanh'):
                        key='selected_train' if split=='training' else 'selected_development'
                        final='final_train' if split=='training' else 'final_development'
                        scores=[q[key]['accuracy'] for q in rows]
                        a[split]={'accuracy':float(np.mean(scores)),'minimum':min(scores),'maximum':max(scores),
                            'nll':float(np.mean([q[key]['nll'] for q in rows])),
                            'epoch_160_accuracy':float(np.mean([q[final]['accuracy'] for q in rows])),
                            'epoch_160_nll':float(np.mean([q[final]['nll'] for q in rows]))}
                    elif family=='direct_affine':
                        a[split]={'accuracy':float(np.mean([q[split]['accuracy'] for q in rows]))}
                    else:
                        a[split]={k:float(np.mean([q[split][k] for q in rows])) for k in ('old_accuracy','current_accuracy','pair_accuracy','relation_accuracy','abstention_rate','relation_error','sum_component_errors')}
                summary.append(a)
    # Exact relative-code example is a separate post-result construction. It is
    # not an assertion about the trained GRU's internal representation.
    pairs=[(a,(a+d)%4) for a in range(4) for d in (1,3)]
    fibers={d:[p for p in pairs if (p[1]-p[0])%4==d] for d in (1,3)}
    ck('relative_code_fibers_size_four',all(len(p)==4 for p in fibers.values()))
    ck('relative_code_preserves_order',all(len({int((b-a)%4==1) for a,b in p})==1 for p in fibers.values()))
    ck('relative_code_absolute_values_uniform',all(len({p[j] for p in values})==4 for values in fibers.values() for j in (0,1)))
    original_summary={s:{'order_accuracy':float(np.mean([c['accuracy'] for q in r['original'] if q['split']==s for c in q['cells'] if c['stage']==1 and c['task']==5])),
                         'order_nll':float(np.mean([c['nll'] for q in r['original'] if q['split']==s for c in q['cells'] if c['stage']==1 and c['task']==5]))} for s in cfg['splits']}
    save(ROOT/'SUMMARY-01.json',{'groups':summary,'original':original_summary,
        'raw_rows':[q for q in r['rows'] if q['view']=='raw_pair'],
        'relative_code_example':{'states':8,'code_values':2,'fiber_sizes':[4,4],'order_optimum':1.0,'old_value_optimum':.25,'new_value_optimum':.25},
        'source_result_sha256':sha(ROOT/'run-01/RESULT.json'),'interpretation':'Post-hoc development-only observations, not held-out performance.'})
    save(ROOT/'AUDIT-01.json',{'passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'source_sha256':sha(ROOT/'audit.py'),'summary_sha256':sha(ROOT/'SUMMARY-01.json'),
        'heldout_inference':False,'scope':'Internal arithmetic, source and replay check, not independent review.'})
    print(json.dumps({'passed':sum(checks.values()),'total':len(checks),'heldout_inference':False}))


if __name__=='__main__':
    main()
