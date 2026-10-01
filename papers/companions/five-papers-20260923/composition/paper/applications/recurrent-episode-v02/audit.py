"""Independent stored-output arithmetic and exact replay audit, not expert review."""
from net import np
from support import ROOT,sha,save_json,lower_priority
import json


def run():
    lower_priority()
    folder=ROOT/'evaluation-01'
    replay=ROOT/'evaluation-replay-01'
    s=json.loads((folder/'summary.json').read_text(encoding='utf-8'))
    r=json.loads((replay/'summary.json').read_text(encoding='utf-8'))
    checks=[]
    def check(name,passed,detail=None):
        checks.append({'name':name,'passed':bool(passed),'detail':detail})
    check('all_declared_evaluation_files_hash_verified',all(sha(folder/n)==v['sha256'] for n,v in s['files'].items()))
    check('all_recorded_numeric_results_replay_exactly',all(s[k]==r[k] for k in
        ('datasets','scene_overlap','corruption','prior','results','probes','models','main_query_rows')))
    check('prediction_archive_byte_identical_on_replay',sha(folder/'predictions.npz')==sha(replay/'predictions.npz'))
    check('probe_parameter_archive_byte_identical_on_replay',sha(folder/'probe-parameters.npz')==sha(replay/'probe-parameters.npz'))
    with np.load(folder/'predictions.npz',allow_pickle=False) as a:
        labels_pass=True
        scene_pass=True
        for dataset in ('id','single_entity_edit'):
            worlds=a[dataset+'__data__worlds']
            ids=a[dataset+'__data__scene_ids']
            tasks=a[dataset+'__data__tasks']
            targets=a[dataset+'__data__y']
            for i in range(len(worlds)):
                for stage in range(2):
                    number=int(ids[i,stage])
                    digits=[]
                    for _ in range(6):
                        number,remainder=divmod(number,4)
                        digits.append(remainder)
                    scene_pass=scene_pass and digits==worlds[i,stage].tolist()
                    g=int(tasks[i,stage])
                    old=worlds[i,0].tolist()
                    if g==0: answer=digits[0]
                    elif g==1: answer=digits[5]
                    elif g==2: answer=int(''.join('1' if digits[j]>=2 else '0' for j in (2,3,4)),2)
                    elif g==3: answer=digits[1]*4+digits[3]
                    elif g==4: answer=old[0]*4+old[5]
                    else: answer=0 if digits[4]<old[4] else 2 if digits[4]>old[4] else 1
                    labels_pass=labels_pass and answer==int(targets[i,stage])
        check('heldout_scene_ids_independently_decoded',scene_pass)
        check('all_4096_heldout_query_targets_independently_recomputed',labels_pass)
        edited=a['single_entity_edit__data__worlds']
        entities=a['single_entity_edit__data__edited_entity']
        check('challenge_changes_exactly_both_channels_of_one_entity',all(
            np.flatnonzero(edited[i,0]!=edited[i,1]).tolist()==[2*int(e),2*int(e)+1]
            for i,e in enumerate(entities)))
        check('id_scenes_never_in_training_pool',s['scene_overlap']['id']['old_scene_rows_in_training_pool']==0 and
              s['scene_overlap']['id']['current_scene_rows_in_training_pool']==0)
        check('challenge_old_scenes_never_in_training_pool',s['scene_overlap']['single_entity_edit']['old_scene_rows_in_training_pool']==0)
        result_pass=True
        cell_pass=True
        total=0
        for row in s['results']:
            dataset=row['dataset']
            prefix=dataset+'__'+str(row['seed'])+'__'+row['condition']+'__'+row['variant']
            pred=a[prefix+'__prediction']
            target_prob=a[prefix+'__target_probability']
            truth=a[dataset+'__data__y']
            tasks=a[dataset+'__data__tasks']
            correct=pred==truth
            loss=-np.log(np.maximum(target_prob,1e-300))
            total+=truth.size
            result_pass=result_pass and abs(float(correct.mean())-row['accuracy'])<1e-12
            result_pass=result_pass and abs(float(loss.mean())-row['nll'])<1e-12
            for cell in row['cells']:
                stage=cell['stage']
                mask=tasks[:,stage]==cell['task']
                cell_pass=cell_pass and int(mask.sum())==cell['n'] and int(correct[mask,stage].sum())==cell['correct']
                cell_pass=cell_pass and abs(float(loss[mask,stage].mean())-cell['nll'])<1e-12
            cell_pass=cell_pass and abs(sum(c['correct']/c['n'] for c in row['cells'])/10-row['balanced_accuracy'])<1e-12
        check('all_main_output_accuracy_and_log_losses_recomputed',result_pass)
        check('all_480_task_stage_cells_recomputed',cell_pass)
        check('98304_query_condition_rows_accounted',total==98304==s['main_query_rows'])
        unchanged=True
        for dataset in ('id','single_entity_edit'):
            for seed in (1729,3253,7919):
                for condition in ('cue_in_recurrence','cue_at_readout'):
                    prefix=dataset+'__'+str(seed)+'__'+condition+'__'
                    base=a[prefix+'intact__target_probability'][:,0]
                    for variant in ('reset_at_switch','corrupt_current_values'):
                        unchanged=unchanged and np.array_equal(base,a[prefix+variant+'__target_probability'][:,0])
        check('future_scene_and_switch_interventions_do_not_change_first_query',unchanged)
        probe_pass=True
        for row in s['probes']:
            dataset=row['dataset']
            prefix=dataset+'__'+str(row['seed'])+'__'+row['condition']+'__probe'
            pred=a[prefix+'__prediction']
            baseline=a[prefix+'__prior_prediction']
            truth=a[dataset+'__data__worlds'].reshape(-1,12)
            tasks=a[dataset+'__data__tasks'][:,1]
            probe_pass=probe_pass and abs(float((pred==truth).mean())-row['accuracy'])<1e-12
            probe_pass=probe_pass and abs(float((baseline==truth).mean())-row['prior_accuracy'])<1e-12
            for cell in row['cells']:
                mask=tasks==cell['task']
                probe_pass=probe_pass and np.array_equal((pred[mask]==truth[mask]).mean(axis=0),cell['coordinate_accuracy'])
            probe_pass=probe_pass and all(selected['penalty']==max(selected['grid'],key=lambda v:v['development_accuracy'])['penalty']
                for selected in row['selection'])
        check('all_probe_accuracy_cells_and_selection_recomputed',probe_pass)
        check('all_six_frozen_models_unchanged_after_inference',all(
            sha(ROOT/model['folder']/'selected.npz')==model['selected_sha256'] and
            sha(ROOT/model['folder']/'FROZEN.json')==model['frozen_receipt_sha256'] for model in s['models']))
    aggregates={}
    for dataset in ('id','single_entity_edit'):
        aggregates[dataset]={'conditions':{},'prior_balanced_accuracy':s['prior'][dataset]['balanced_accuracy']}
        for condition in ('cue_in_recurrence','cue_at_readout'):
            rows=[v for v in s['results'] if v['dataset']==dataset and v['condition']==condition and v['variant']=='intact']
            probes=[v for v in s['probes'] if v['dataset']==dataset and v['condition']==condition]
            aggregates[dataset]['conditions'][condition]={
                'main_balanced_accuracy_mean':float(np.mean([v['balanced_accuracy'] for v in rows])),
                'main_balanced_accuracy_range':[min(v['balanced_accuracy'] for v in rows),max(v['balanced_accuracy'] for v in rows)],
                'main_nll_mean':float(np.mean([v['nll'] for v in rows])),
                'probe_balanced_accuracy_mean':float(np.mean([v['balanced_accuracy'] for v in probes])),
                'probe_old_accuracy_mean':float(np.mean([v['old_accuracy'] for v in probes])),
                'probe_current_accuracy_mean':float(np.mean([v['current_accuracy'] for v in probes])),
                'probe_balanced_prior_mean':float(np.mean([v['balanced_prior_accuracy'] for v in probes])),
                'task_stage_cells':[{'stage':c['stage'],'task':c['task'],'n':c['n'],
                    'accuracy_mean':float(np.mean([v['cells'][j]['accuracy'] for v in rows])),
                    'nll_mean':float(np.mean([v['cells'][j]['nll'] for v in rows]))} for j,c in enumerate(rows[0]['cells'])],
                'variant_balanced_accuracy':{variant:float(np.mean([v['balanced_accuracy'] for v in s['results']
                    if v['dataset']==dataset and v['condition']==condition and v['variant']==variant]))
                    for variant in ('intact','reset_at_switch','corrupt_old_values','corrupt_current_values')}}
    save_json(folder/'AGGREGATES.json',aggregates)
    receipt={'passed':all(c['passed'] for c in checks),'checks':checks,'count':len(checks),
        'passed_count':sum(c['passed'] for c in checks),'evidence_boundary':'assistant-authored internal audit, not independent review',
        'summary_sha256':sha(folder/'summary.json'),'audit_source_sha256':sha(ROOT/'audit.py')}
    save_json(folder/'AUDIT.json',receipt)
    print(json.dumps({'passed':receipt['passed'],'checks':len(checks),'aggregates':aggregates}))
    if not receipt['passed']:
        raise SystemExit(1)


if __name__=='__main__':
    run()
