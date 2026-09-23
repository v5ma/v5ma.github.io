"""Post-result correction of a logical work counter; never change frozen results."""
from pathlib import Path
import hashlib
import json

ROOT = Path(__file__).resolve().parent
source = ROOT/'evaluation/RESULT.json'
result = json.loads(source.read_text(encoding='utf-8'))
rows = []
for summary in result['summaries']:
    work = summary['work']
    # h0=c Wc; drive=x Wx computed ONCE; K recurrent products; K+1 readouts.
    exact_forward_mac_per_example = 8*20 + 8*4 + 4*8*8 + 5*8
    assert exact_forward_mac_per_example == 488
    assert work['forward_multiply_accumulates'] == work['forward_examples']*584
    rows.append({'seed': summary['seed'], 'family': summary['family'], 'arm': summary['arm'],
                 'historical_forward_mac_counter': work['forward_multiply_accumulates'],
                 'corrected_receiver_forward_mac': work['forward_examples']*488,
                 'gate_forward_mac': work['gate_calls']*(465*24+24),
                 'backward_examples': work['backward_examples'],
                 'receiver_parameters': 273, 'gate_parameters': summary['gate_parameters'],
                 'gate_standardization_floats': 930 if work['gate_calls'] else 0})
out = {'scope': 'Post-result accounting-only correction; all fits, observations, predictions and performance unchanged',
       'cause': 'Original counter charged the once-computed input projection at all four recurrent steps',
       'per_example_counter_before': 584, 'per_example_counter_after': 488,
       'exclusions': ['backward-operation MACs', 'bias/nonlinearity/normalization operations',
                      'data movement', 'Python overhead', 'gate training', 'independent evaluator probes'],
       'not_a_total_flop_or_wallclock_claim': True, 'rows': rows,
       'result_sha256': hashlib.sha256(source.read_bytes()).hexdigest(),
       'script_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest()}
path = ROOT/'COST-ACCOUNTING-CORRECTION.json'
if path.exists():
    raise FileExistsError(path)
path.write_text(json.dumps(out, indent=2, sort_keys=True)+'\n', encoding='utf-8')
print('64 accounting rows corrected; frozen experiment and result unchanged.')
