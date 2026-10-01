"""Finite representational-control diagnostic; not a trained agent or neural simulation.

Enumerates one declared symbolic universe, never samples human observations.
Stdlib only, one process, about 4096 states and 6 task labels.
"""
import csv,json,math,itertools
from collections import Counter,defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
FEATURES=('visual_geometry','body_state','auditory_sequence','remembered_context','conceptual_relation','chemical_identity')
ROLES={'player':(0,1),'security':(2,3),'manager':(3,4),'speaker':(4,2),'odor_response':(5,3),'food_handling':(5,1)}
STATES=tuple(itertools.product(range(4),repeat=6))
def encode(state,indices,coarse=False,gain=1):return tuple(gain*(state[i]//2 if coarse else state[i]) for i in indices)
def target(state,role):return tuple(state[i] for i in ROLES[role])
def risk(role,indices,coarse=False,gain=1):
    groups=defaultdict(Counter)
    for state in STATES:groups[encode(state,indices,coarse,gain)][target(state,role)]+=1
    correct=sum(max(counts.values()) for counts in groups.values())
    return {'accuracy':correct/len(STATES),'bayes_error':1-correct/len(STATES),'states':len(STATES),'representation_cells':len(groups)}
def main():
    out=ROOT/'applications/results';out.mkdir(exist_ok=True)
    rows=[]
    names=list(ROLES)
    for ri,role in enumerate(names):
        pair=ROLES[role]
        models=[('role_conditioned_assembly',pair,False,1,4),('ordinary_task_attention',pair,False,1,4),('fixed_fine_pair',(0,1),False,1,4),('fixed_gain_pair',(0,1),False,2,4),('fixed_coarse_four',(0,1,2,3),True,1,4),('fixed_low_pair',(0,1),True,1,2),('fixed_all_fine',tuple(range(6)),False,1,12),('stale_previous_role',ROLES[names[(ri-1)%len(names)]],False,1,4)]
        for model,indices,coarse,gain,bits in models:
            rows.append(dict(model=model,role=role,bits=bits,**risk(role,indices,coarse,gain)))
    tests={}
    tests['attention_ties_assembly']=all(r['accuracy']==1 for r in rows if r['model'] in ('role_conditioned_assembly','ordinary_task_attention'))
    tests['injective_gain_preserves_cells_and_accuracy']=all(risk(role,(0,1),gain=1)==risk(role,(0,1),gain=2) for role in ROLES)
    tests['full_representation_correct']=all(r['accuracy']==1 for r in rows if r['model']=='fixed_all_fine')
    tests['fine_refines_coarse']=all(risk(role,(0,1))['accuracy']>=risk(role,(0,1),True)['accuracy'] for role in ROLES)
    # A relation can fail while component values and count remain unchanged.
    pair=(0,1)
    tests['swapped_binding_fixed_decoder_accuracy_quarter']=sum(tuple(reversed(encode(s,pair)))==encode(s,pair) for s in STATES)/len(STATES)==.25
    tests['correct_binding_rescue']=all(tuple(s[i] for i in pair)==target(s,'player') for s in STATES)
    zero=(0,0,0,0,0,0); change_a=(1,0,0,0,0,0); change_b=(0,0,1,0,0,0)
    tests['role_partitions_incomparable']=encode(zero,(0,1))==encode(change_b,(0,1)) and encode(zero,(2,3))!=encode(change_b,(2,3)) and encode(zero,(2,3))==encode(change_a,(2,3)) and encode(zero,(0,1))!=encode(change_a,(0,1))
    tests['all_roles_balanced']=all(dict(Counter(target(s,r) for s in STATES))==dict.fromkeys(itertools.product(range(4),repeat=2),256) for r in ROLES)
    assert all(tests.values()),tests
    summary=[]
    for name in dict.fromkeys(r['model'] for r in rows):
        relevant=[r for r in rows if r['model']==name]
        summary.append({'model':name,'accuracy':sum(r['accuracy'] for r in relevant)/len(relevant),'representation_bits':relevant[0]['bits']})
    # Analytic Gaussian example: gain precedes fixed additive noise.
    gain_effect=[{'gain':g,'accuracy':.5*(1+math.erf(g/math.sqrt(2)))} for g in (1,2)]
    result={'status':'FINITE_DIAGNOSTIC_PASS_NOT_BIOLOGICAL_VALIDATION','states':len(STATES),'roles':len(ROLES),'conditions':len(rows),'scope':'Exact Bayes-optimal task readouts on balanced finite states; hand-declared role selector, no training, human data, PWD timing or neural dynamics. Bits count retained source coordinates, not instruction, route or computation overhead.','summary':summary,'tests':tests,'binding_swap_fixed_decoder_accuracy':.25,'correct_binding_rescue_accuracy':1.,'gaussian_gain_example':gain_effect}
    with (out/'conditions.csv').open('w',newline='',encoding='utf-8') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    (out/'summary.json').write_text(json.dumps(result,indent=2)+'\n','utf-8')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
