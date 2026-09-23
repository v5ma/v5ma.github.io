"""Small counterbalanced dataset and exact checks; no fitting or discovery."""
from collections import Counter, defaultdict
from fractions import Fraction
from hashlib import sha256
from itertools import product
from pathlib import Path
import csv
import ctypes
import io
import json
import os
import random
import sys
import time

ROOT = Path(__file__).resolve().parent
SEED = 20260908
SPLITS = (('training', 64), ('development', 16), ('heldout', 32))
FOCAL = 4


def lower_priority():
    if os.name == 'nt':
        lib = ctypes.WinDLL('kernel32', use_last_error=True)
        lib.GetCurrentProcess.restype = ctypes.c_void_p
        lib.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
        if not lib.SetPriorityClass(lib.GetCurrentProcess(), 0x00004000):
            raise OSError(ctypes.get_last_error(), 'Cannot lower priority')


def digest(blob):
    return sha256(blob).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':')).encode('utf-8')


def model_view(row):
    return (tuple(row['old']), tuple(row['new']))


def generate():
    rng = random.Random(SEED)
    block_ids, used = [], set()
    for _ in range(2000):
        n = rng.randrange(4**10)
        if n not in used:
            used.add(n)
            block_ids.append(n)
        if len(block_ids) == 112:
            break
    if len(block_ids) != 112:
        raise RuntimeError('Bounded unique-background sampling failed')
    rows, offset = [], 0
    for split, count in SPLITS:
        for block in block_ids[offset:offset+count]:
            digits = tuple((block >> (2*i)) & 3 for i in range(10))
            for a, d in product(range(4), (1, 3)):
                old, new = list(digits[:5]), list(digits[5:])
                old.insert(FOCAL, a)
                new.insert(FOCAL, (a+d) % 4)
                rows.append({'split':split, 'block':block, 'old':old,
                             'new':new, 'target':int(d == 1)})
        offset += count
    return rows


def key(row, mode):
    a, b = row['old'][FOCAL], row['new'][FOCAL]
    if mode == 'old_only':
        return a
    if mode == 'new_only':
        return b
    if mode == 'unordered_pair':
        return tuple(sorted((a, b)))
    if mode == 'coarse_pair':
        return a//2, b//2
    if mode == 'ordered_pair':
        return a, b
    if mode == 'background_only':
        return ()
    raise ValueError(mode)


def optimum(rows, mode):
    buckets = defaultdict(Counter)
    for row in rows:
        # Supplying block identity makes the restricted decoder more informed.
        buckets[(row['block'], key(row, mode))][row['target']] += 1
    correct = sum(max(counts.values()) for counts in buckets.values())
    return Fraction(correct, len(rows))


def table_optimum(rows, mode):
    views = sorted({key(r, mode) for r in rows})
    ix = {value:i for i, value in enumerate(views)}
    best = max(sum(table[ix[key(r, mode)]] == r['target'] for r in rows)
               for table in product((0, 1), repeat=len(views)))
    return Fraction(best, len(rows))


def csv_blob(rows):
    handle = io.StringIO(newline='')
    names = ['split', 'block'] + [f'old_{i}' for i in range(6)] + [f'new_{i}' for i in range(6)] + ['target']
    writer = csv.writer(handle, lineterminator='\n')
    writer.writerow(names)
    for r in rows:
        writer.writerow([r['split'], r['block'], *r['old'], *r['new'], r['target']])
    return handle.getvalue().encode('utf-8')


def roundtrip(blob):
    rows = []
    for r in csv.DictReader(io.StringIO(blob.decode('utf-8'))):
        rows.append({'split':r['split'], 'block':int(r['block']),
                     'old':[int(r[f'old_{i}']) for i in range(6)],
                     'new':[int(r[f'new_{i}']) for i in range(6)],
                     'target':int(r['target'])})
    return rows


def main():
    lower_priority()
    started = time.monotonic()
    if len(sys.argv) != 2 or not sys.argv[1] or not all(c.isalnum() or c in '-_' for c in sys.argv[1]):
        raise ValueError('Supply one new alphanumeric output folder name')
    out = ROOT/sys.argv[1]
    if out.exists():
        raise FileExistsError(out)
    checks = {}
    def ck(name, value):
        checks[name] = bool(value)
        if not value:
            raise AssertionError(name)
        if time.monotonic()-started > 10:
            raise TimeoutError('Ten-second budget exceeded')
    rows = generate()
    blob = csv_blob(rows)
    ck('repeated_generation_identical', rows == generate())
    ck('csv_roundtrip_identical', rows == roundtrip(blob))
    ck('896_episodes', len(rows) == 896)
    ck('112_distinct_backgrounds', len({r['block'] for r in rows}) == 112)
    ck('valid_model_input_only', all(len(model_view(r)) == 2 and all(len(o)==6 and all(0 <= v < 4 for v in o) for o in model_view(r)) for r in rows))
    ck('target_matches_ordered_relation', all(r['target'] == int((r['new'][FOCAL]-r['old'][FOCAL]) % 4 == 1) for r in rows))
    ck('reversal_flips_target', all(int((r['old'][FOCAL]-r['new'][FOCAL]) % 4 == 1) == 1-r['target'] for r in rows))
    byblock = defaultdict(list)
    for row in rows:
        byblock[row['block']].append(row)
    ck('complete_blocks_stay_in_one_split', all(len(v)==8 and len({r['split'] for r in v})==1 for v in byblock.values()))
    ck('background_constant_within_block', all(len({tuple(r['old'][:FOCAL]+r['old'][FOCAL+1:]+r['new'][:FOCAL]+r['new'][FOCAL+1:]) for r in v})==1 for v in byblock.values()))
    restricted = ('background_only','old_only','new_only','unordered_pair','coarse_pair')
    for mode in restricted:
        ck('per_block_half_'+mode, all(optimum(v, mode)==Fraction(1,2) for v in byblock.values()))
    ck('per_block_ordered_pair_one', all(optimum(v,'ordered_pair')==1 for v in byblock.values()))
    witness = next(iter(byblock.values()))
    for mode in (*restricted, 'ordered_pair'):
        ck('all_readout_tables_'+mode, table_optimum(witness, mode)==optimum(witness, mode))
    split_evidence = {}
    for split, count in SPLITS:
        part = [r for r in rows if r['split'] == split]
        ck(split+'_count', len(part) == count*8)
        ck(split+'_labels_balanced', Counter(r['target'] for r in part) == {0:count*4, 1:count*4})
        scores = {mode:str(optimum(part, mode)) for mode in (*restricted, 'ordered_pair')}
        ck(split+'_shortcut_ceilings', all(scores[m]=='1/2' for m in restricted) and scores['ordered_pair']=='1')
        split_evidence[split] = {'blocks':count,'episodes':len(part),'oracle_accuracy_by_view':scores}
    ck('below_200_kib_csv', len(blob) < 200*1024)
    evidence = {'seed':SEED,'focal_coordinate':FOCAL,'blocks':112,'episodes':896,
                'dataset_sha256':digest(blob),'dataset_bytes':len(blob),'splits':split_evidence,
                'learned_models':0,'neural_data':False,'heldout_backgrounds_not_novel_rule':True}
    out.mkdir()
    (out/'episodes.csv').write_bytes(blob)
    report = {'status':'PASS_CONSTRUCTION_ONLY','passed':sum(checks.values()),'total':len(checks),
              'checks':checks,'evidence':evidence,'evidence_sha256':digest(canonical(evidence)),
              'source_sha256':digest(Path(__file__).read_bytes()),
              'protocol_sha256':digest((ROOT/'PROTOCOL.md').read_bytes()),
              'elapsed_seconds':time.monotonic()-started,
              'limits':'Exact finite construction and internal checks, not trained performance, external replication, new Lean proof or full episode model.'}
    with (out/'CHECK.json').open('x',encoding='utf-8') as handle:
        json.dump(report,handle,indent=2)
        handle.write('\n')
    print(json.dumps({k:report[k] for k in ('status','passed','total','evidence','evidence_sha256','elapsed_seconds')},indent=2))


if __name__ == '__main__':
    main()
