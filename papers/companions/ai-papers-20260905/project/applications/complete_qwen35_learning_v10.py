"""Close a bounded research tranche from exact receipts; never publish or edit drafts."""
from pathlib import Path
import json
from qwen35_adapter_v9 import ROOT, sha, write

OUT=ROOT/'reviews/qwen35-learning-10'
def read(p): return json.loads(p.read_text(encoding='utf-8'))

protocol=read(ROOT/'results/qwen35-learning-10-prepared/INPUT-FREEZE.json')
for p,h in protocol.items(): assert sha(ROOT/p)==h
cases=read(ROOT/'results/qwen35-learning-10-prepared/TEST-CASES.json')
receipts=[]; native=[]; inputs={}; answers=[]; training_answers=[]; controls=[]; predictions=[]
for split,count in [('test',16),('train',6)]:
    for index in range(count):
        folder=ROOT/f'results/qwen35-learning-10-{split}-{index}'
        receipt=read(folder/'RECEIPT.json')
        for name,digest in receipt['files'].items(): assert sha(folder/name)==digest
        check=OUT/f'native-{split}-{index}'/'RECEIPT.json'
        n=read(check)
        assert n['source_receipt_sha256']==sha(folder/'RECEIPT.json')
        assert n['auditor_sha256']==sha(ROOT/'applications/audit_qwen35_learning_v10.py')
        assert n['native_calls']==receipt['native_calls']
        assert n['status']=='PASS_NATIVE_EXACT_RECONSTRUCTION_SAME_AUTHOR_SHARED_ADAPTER'
        receipts.append(receipt); native.append(n)
        inputs[(folder/'RECEIPT.json').relative_to(ROOT).as_posix()]=sha(folder/'RECEIPT.json')
        inputs[check.relative_to(ROOT).as_posix()]=sha(check)
        if split=='test':
            answers.extend(read(folder/'ANSWERS.json'))
            controls.append(read(folder/'ORACLE-CONTROLS.json'))
            predictions.append(read(folder/'POLICY-COMMITMENT.json')['learned_predictions'])
        else: training_answers.extend(read(folder/'ANSWERS.json'))
arms=read(ROOT/'applications/PROTOCOL-QWEN35-LEARNING-10.json')['arms']
joint=[]
for arm in arms:
    for case in cases:
        selected={r['query']:r for r in answers if r['case']==case['id'] and r['arm']==arm}
        assert len(selected)==3
        joint.append({'arm':arm,'case':case['id'],
            'both_reversed_roles':all(selected[q]['swapped_score']['correct'] for q in ('giver','recipient')),
            'all_three_swapped':all(r['swapped_score']['correct'] for r in selected.values()),
            'same_name_in_both_roles':selected['giver']['answer']==selected['recipient']['answer']})
summary=[{'arm':arm,'both_reversed_roles':sum(r['both_reversed_roles'] for r in joint if r['arm']==arm),
    'complete_stories':sum(r['all_three_swapped'] for r in joint if r['arm']==arm),
    'same_name_stories':sum(r['same_name_in_both_roles'] for r in joint if r['arm']==arm),'n':16} for arm in arms]
window_stats={arm:sum(c['window_rmse_to_donor'][arm] for c in controls)/16
    for arm in ('original','linear_ridge','rbf_ridge','yoked_ridge','slot_swap','oracle_kv')}
cap_stats={arm:sum(c[arm]['cap_multiplier']<1 for c in predictions)
    for arm in ('linear_ridge','rbf_ridge','yoked_ridge')}
assert len(training_answers)==72 and all(r['original_score']['correct'] for r in training_answers)
assert sum(n['exact_generated_answers_and_first_logits'] for n in native)==465
assert sum(r['native_calls'] for r in receipts)==sum(n['native_calls'] for n in native)==1096
assert read(OUT/'TEST-RECEIPT.json')['tests']==84
assert read(OUT/'TRACE-AUDIT.json')['prospective_baseline_gate_passed']
figure=ROOT/'figures/qwen35-learning-10'
image_receipt=read(figure/'GENERATION-RECEIPT.json')
assert sha(figure/'learned-repair-results.png')==image_receipt['image_sha256']
assert 'PASS_SCREEN_IMAGE_ONLY' in (figure/'VISUAL-REVIEW.md').read_text()
write(OUT/'INDIVIDUAL-STORY-DETAIL.json',joint)
write(OUT/'ADDITIONAL-DESCRIPTIVE-SUMMARY.json',{'individual_story_summary':summary,
    'mean_window_rmse_to_donor':window_stats,'capped_test_edits':cap_stats,
    'note':'Individual-story endpoint was predeclared. These RMSE and cap aggregates are descriptive, not newly selected acceptance gates.'})
write(OUT/'NATIVE-AUDIT-INDEX.json',inputs)
completion={'status':'COMPLETE_BOUNDED_RESEARCH_TRANCHE_NOT_FINAL_PAPERS',
    'training_prefixes':24,'heldout_prefixes':16,'training_answers':72,
    'training_correct':72,'unedited_test_answers':48,'unedited_test_correct':48,
    'primary_test_answers':384,'fresh_workflow_answers':9,'authority_events':5,
    'all_reconstructed_answers':465,'exact_reconstructed_training_windows':24,
    'native_audit_batches':22,'original_native_calls':1096,'reconstruction_native_calls':1096,
    'original_training_calls':176,'original_test_and_workflow_calls':920,
    'test_state_support_rows':6144,'application_tests':84,
    'new_model_editor_fits':3,'base_weights_changed':False,'new_models_downloaded':False,
    'existing_lean_statements':31,'new_lean_statements':0,'new_prose_math_obligations':True,
    'new_figures_screen_reviewed':1,'total_screen_reviewed_figures':16,
    'max_original_model_process_commit':max(r['resource']['peak_commit_bytes'] for r in receipts),
    'all_original_model_process_seconds':sum(r['resource']['elapsed_seconds'] for r in receipts),
    'all_native_reconstruction_process_seconds':sum(r['resource']['elapsed_seconds'] for r in native),
    'all_numerical_threads':1,'stored_model_bytes':(ROOT/'results/qwen35-learning-10-fit/MODEL.npz').stat().st_size,
    'same_agent_separate_code_not_independent':True,'full_pipeline_replay':False,
    'arbitrary_message_signature_audit':False,'independent_review':False,
    'manuscript_versions':[9,9],'tenth_manuscripts_complete':False,
    'pdf_created':False,'browser_ui_acceptance':False,'publication':False,
    'individual_story_summary':summary,'completion_script_sha256':sha(__file__)}
write(OUT/'COMPLETION.json',completion)
print(json.dumps(completion,indent=2))
