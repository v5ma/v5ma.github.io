"""Post-result internal recheck of frozen arrays; does not fit or amend results."""
from net import np
from world import config,load,inputs
from support import ROOT,lower_priority,sha,save,metrics
from evaluate import freeze_check,restricted_ceilings,probe_read
import json
import time


def read(path):
    return json.loads(path.read_text(encoding='utf-8'))


def main():
    priority=lower_priority(); started=time.perf_counter(); checks={}
    def ck(name,value):
        checks[name]=bool(value)
        if not value:
            raise AssertionError(name)
    out=ROOT/'AUDIT-01.json'
    if out.exists():
        raise FileExistsError(out)
    cfg=config(); ev=ROOT/'evaluation-01'; replay=ROOT/'evaluation-replay-01'
    r,rr=read(ev/'RESULT.json'),read(replay/'RESULT.json')
    ck('two_completed_evaluations',r['complete'] and rr['complete'])
    models=freeze_check(cfg)
    ck('six_exact_frozen_models',len(models)==6)
    ck('85_prefit_checks',read(ROOT/'TESTS-01.json')['checks_completed']==85 and read(ROOT/'TESTS-01.json')['passed'])
    for name in ('predictions.npz','probes.npz','probe-coefficients.npz'):
        ck(name+'_byte_replay',sha(ev/name)==sha(replay/name)==r['files'][name]['sha256']==rr['files'][name]['sha256'])
    ck('result_numeric_replay',all(r[k]==rr[k] for k in ('data','prior','results','probes','temporal_ceilings','paired_contrast','intact_replays','future_causality','model_receipts','source_hashes')))
    test=load('heldout'); train=load('training')
    ck('complete_background_blocks',len(np.unique(test['blocks']))==32 and all((test['blocks']==b).sum()==48 for b in np.unique(test['blocks'])))
    ck('five_exact_half_ceilings',r['temporal_ceilings']==restricted_ceilings(test) and all(v['accuracy_max']==.5 for v in r['temporal_ceilings'].values()))
    with np.load(ev/'predictions.npz',allow_pickle=False) as predictions, np.load(ev/'probes.npz',allow_pickle=False) as probes, np.load(ev/'probe-coefficients.npz',allow_pickle=False) as weights:
        ck('all_stored_data_exact',all(np.array_equal(predictions['data__'+k],v) for k,v in test.items()))
        summaries=[]; task_matrices={}
        for condition in cfg['conditions']:
            rows=[a for a in r['results'] if a['condition']==condition and a['variant']=='intact']
            prs=[a for a in r['probes'] if a['condition']==condition]
            summaries.append({'condition':condition,'final_accuracy':float(np.mean([a['final_balanced_accuracy'] for a in rows])),
                'final_nll':float(np.mean([a['final_nll'] for a in rows])),
                'first_accuracy':float(np.mean([a['first_accuracy'] for a in rows])),
                'probe_diagonal':float(np.mean([a['diagonal_accuracy'] for a in prs])),
                'probe_transfer':float(np.mean([a['off_diagonal_accuracy'] for a in prs])),
                'probe_old':float(np.mean([a['diagonal_old_accuracy'] for a in prs])),
                'probe_current':float(np.mean([a['diagonal_current_accuracy'] for a in prs])),
                'probe_matrix':np.mean([a['source_by_destination_accuracy'] for a in prs],axis=0).tolist()})
            task_matrices[condition]={variant:[float(np.mean([c['accuracy'] for a in r['results']
                if a['condition']==condition and a['variant']==variant for c in a['cells'] if c['stage']==1 and c['task']==task]))
                for task in range(6)] for variant in ('intact','reset_at_switch','erase_old_values','erase_current_values','coarse_focal_pair','unordered_focal_pair','reverse_retargeted')}
        for row in r['results']:
            prefix=f"s{row['seed']}__{row['condition']}"
            prob=predictions[prefix+'__'+row['variant']+'__probabilities']
            _,_,y=inputs(test,row['variant'])
            ck(prefix+'__'+row['variant']+'_probability_and_label_integrity',
                prob.shape==(1536,2,16) and np.isfinite(prob).all() and np.allclose(prob.sum(axis=-1),1)
                and np.array_equal(y,predictions['targets__'+row['variant']]))
            measured=metrics(prob,y,test['tasks'])
            ck(prefix+'__'+row['variant']+'_all_metrics_exact',all(measured[k]==row[k] for k in measured))
        for row in r['probes']:
            prefix=f"s{row['seed']}__{row['condition']}"
            coef=weights[prefix+'__weights']
            state=predictions[prefix+'__intact__states'][:,1]
            pred,metric=probe_read(coef,state,test)
            ck(prefix+'_probe_coefficients_recreate_all_predictions',np.array_equal(pred,probes[prefix+'__predictions']))
            ck(prefix+'_probe_all_metrics_exact',all(metric[k]==row[k] for k in metric))
            ck(prefix+'_probe_development_selection',all(max(c['grid'],key=lambda a:a['development_coordinate_accuracy'])['penalty']==c['penalty'] for c in row['choices']))
        ids=predictions['block_ids']; stored=predictions['block_scores']
        manual=np.empty_like(stored)
        for si,seed in enumerate(cfg['fit_seeds']):
            for ci,condition in enumerate(cfg['conditions']):
                prob=predictions[f's{seed}__{condition}__intact__probabilities']
                correct=prob[:,1].argmax(axis=-1)==test['y'][:,1]
                manual[si,ci]=[correct[test['blocks']==b].mean() for b in ids]
        ck('paired_background_scores_exact',np.array_equal(manual,stored))
        diff=manual[:,1]-manual[:,0]
        rng=np.random.default_rng(cfg['bootstrap_seed'])
        bootstrap=diff.mean(axis=0)[rng.integers(0,32,(1000,32))].mean(axis=1)
        ck('bootstrap_recreated',np.array_equal(bootstrap,predictions['bootstrap_contrasts']))
        ck('bootstrap_interval_recreated',np.array_equal(np.quantile(bootstrap,[.025,.975]),r['paired_contrast']['percentile_interval_95']))
        ck('paired_seed_differences_recreated',np.array_equal(diff.mean(axis=1),r['paired_contrast']['paired_seed_differences']))
        ck('discordant_seed_retained',np.any(diff.mean(axis=1)<0) and np.any(diff.mean(axis=1)>0))
    ck('intact_replays_and_future_checks',all(v['exact'] for v in r['intact_replays']+r['future_causality']))
    fits=[read(ROOT/m[3]['folder']/'FROZEN.json') for m in models]
    ck('six_fits_below_deadline',all(a['fit_seconds']<cfg['maximum_seconds_per_fit'] for a in fits))
    old=ROOT.parent/'recurrent-episode-v02'
    old_result=read(old/'evaluation-01/summary.json')
    ck('previous_recurrent_outputs_unchanged',all(sha(old/'evaluation-01'/n)==v['sha256'] for n,v in old_result['files'].items()))
    ck('previous_six_models_unchanged',all(sha(old/m['folder']/'selected.npz')==m['selected_sha256'] and sha(old/m['folder']/'FROZEN.json')==m['frozen_receipt_sha256'] for m in old_result['models']))
    summary={'conditions':summaries,'task_accuracy_by_variant':task_matrices,
        'contrast':r['paired_contrast'],'prior_final_accuracy':r['prior']['final_balanced_accuracy'],
        'prior_probe_accuracy':r['prior_probe_coordinate_accuracy'],
        'total_fit_seconds':sum(a['fit_seconds'] for a in fits),'evaluation_seconds':r['seconds'],
        'query_condition_rows':6*7*1536*2,'heldout_base_episodes':256,
        'result_sha256':sha(ev/'RESULT.json'),'prediction_sha256':sha(ev/'predictions.npz'),
        'probe_sha256':sha(ev/'probes.npz'),'coefficient_sha256':sha(ev/'probe-coefficients.npz')}
    save(ROOT/'SUMMARY-01.json',summary)
    receipt={'passed':sum(checks.values()),'total':len(checks),'checks':checks,
        'priority':priority,'seconds':time.perf_counter()-started,
        'audit_source_sha256':sha(ROOT/'audit.py'),'summary_sha256':sha(ROOT/'SUMMARY-01.json'),
        'interpretation':'Internal array and rule checks by the implementing assistant; not independent scientific review.'}
    save(out,receipt)
    print(json.dumps({'passed':receipt['passed'],'total':receipt['total'],'seconds':receipt['seconds'],
        'total_fit_seconds':summary['total_fit_seconds'],'query_condition_rows':summary['query_condition_rows']}))


if __name__=='__main__':
    main()
