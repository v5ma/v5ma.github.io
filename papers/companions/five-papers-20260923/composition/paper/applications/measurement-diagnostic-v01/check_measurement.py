"""Tiny rational checks, fixed constructions, no training or filesystem discovery."""
from fractions import Fraction as F
from itertools import product
from pathlib import Path
import ctypes
import hashlib
import json
import os
import sys
import time

ROOT = Path(__file__).resolve().parent


def lower_priority():
    if os.name == 'nt':
        lib = ctypes.WinDLL('kernel32', use_last_error=True)
        lib.GetCurrentProcess.restype = ctypes.c_void_p
        lib.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint32]
        if not lib.SetPriorityClass(lib.GetCurrentProcess(), 0x00004000):
            raise OSError(ctypes.get_last_error(), 'Cannot lower process priority')


def channel(rows):
    if not rows or not rows[0]:
        raise ValueError('Empty channel')
    k = tuple(tuple(F(x) for x in row) for row in rows)
    if any(len(row) != len(k[0]) or min(row) < 0 or sum(row) != 1 for row in k):
        raise ValueError('Channel is not row-stochastic')
    return k


def inputs(k, prior, losses):
    k = channel(k)
    prior = tuple(F(x) for x in prior)
    if len(prior) != len(k) or min(prior) < 0 or sum(prior) != 1:
        raise ValueError('Bad prior')
    if not losses or len(losses) != len(k) or not losses[0]:
        raise ValueError('Bad loss dimensions')
    losses = tuple(tuple(F(x) for x in row) for row in losses)
    if any(len(row) != len(losses[0]) or min(row) < 0 or max(row) > 1 for row in losses):
        raise ValueError('Loss must be rectangular and in [0,1]')
    return k, prior, losses


def compose(k, t):
    k, t = channel(k), channel(t)
    if len(k[0]) != len(t):
        raise ValueError('Composition dimensions differ')
    return channel([[sum(k[x][z] * t[z][y] for z in range(len(t)))
                     for y in range(len(t[0]))] for x in range(len(k))])


def risk(k, prior, losses):
    k, prior, losses = inputs(k, prior, losses)
    return sum(min(sum(prior[x]*k[x][z]*losses[x][a] for x in range(len(k)))
                   for a in range(len(losses[0]))) for z in range(len(k[0])))


def brute_risk(k, prior, losses):
    k, prior, losses = inputs(k, prior, losses)
    return min(sum(prior[x]*k[x][z]*losses[x][d[z]]
                   for x in range(len(k)) for z in range(len(k[0])))
               for d in product(range(len(losses[0])), repeat=len(k[0])))


def tv(a, b):
    if len(a) != len(b):
        raise ValueError('TV dimensions differ')
    return sum(abs(F(x)-F(y)) for x, y in zip(a, b)) / 2


def distance(k, other, prior):
    k, other = channel(k), channel(other)
    if len(k) != len(other) or len(prior) != len(k):
        raise ValueError('Channel distance dimensions differ')
    return sum(F(p) * tv(a, b) for p, a, b in zip(prior, k, other))


def bsc(p):
    return channel([[1-p, p], [p, 1-p]])


def encoded(states, encoder):
    codes = [encoder(s) for s in states]
    alphabet = sorted(set(codes))
    return channel([[int(c == z) for z in alphabet] for c in codes])


def main():
    if len(sys.argv) != 2:
        raise SystemExit('Pass a fresh output JSON basename')
    name = sys.argv[1]
    if Path(name).name != name or not name.endswith('.json'):
        raise SystemExit('Output must be one local JSON basename')
    out = ROOT / name
    if out.exists():
        raise FileExistsError(out)
    lower_priority()
    start = time.perf_counter()
    checks = {}

    def check(label, value):
        if time.perf_counter() - start > 5:
            raise TimeoutError('Five-second diagnostic budget')
        checks[label] = bool(value)
        if not value:
            raise AssertionError(label)

    def rejects(label, fn):
        try:
            fn()
        except ValueError:
            check(label, True)
        else:
            check(label, False)

    rejects('negative_probability_rejected', lambda: channel([[2, -1]]))
    rejects('bad_row_sum_rejected', lambda: channel([[0, 0]]))
    rejects('ragged_channel_rejected', lambda: channel([[1, 0], [1]]))
    rejects('bad_composition_rejected', lambda: compose(bsc(F(0)), [[1]]))
    rejects('bad_prior_rejected', lambda: risk(bsc(F(0)), [1, 1], [[0, 1], [1, 0]]))
    rejects('unbounded_loss_rejected', lambda: risk(bsc(F(0)), [F(1,2)]*2, [[0, 2], [1, 0]]))
    grid = [F(i, 8) for i in range(5)]
    priors = [(F(1,2), F(1,2)), (F(1,4), F(3,4)), (F(1), F(0))]
    loss_tables = [((0,1),(1,0)), ((0,F(1,3)),(1,0)), ((0,F(1,2),1),(1,F(1,4),0))]
    cases = []
    errors = []
    all_formula, all_order, all_distance = True, True, True
    for p, q, prior, loss in product(grid, grid, priors, loss_tables):
        fine, coarse = bsc(p), compose(bsc(p), bsc(q))
        r1, r2 = risk(fine, prior, loss), risk(coarse, prior, loss)
        all_formula &= r1 == brute_risk(fine, prior, loss) and r2 == brute_risk(coarse, prior, loss)
        all_order &= r1 <= r2
        other = bsc(q)
        err = distance(fine, other, prior)
        gap = abs(r1 - risk(other, prior, loss))
        all_distance &= gap <= err
        cases.append({'flip':str(p),'post_flip':str(q),'prior':list(map(str,prior)),
                      'loss':[[str(x) for x in row] for row in loss],
                      'fine_risk':str(r1),'post_risk':str(r2)})
        errors.append({'flip_a':str(p),'flip_b':str(q),'weighted_tv':str(err),'risk_gap':str(gap)})
    check('225_declared_channel_cases', len(cases) == 225)
    check('risk_formula_matches_every_decoder', all_formula)
    check('postprocessing_cannot_improve_unrestricted_risk', all_order)
    check('bounded_risk_changes_at_most_weighted_tv', all_distance)
    equal, zero_one = priors[0], loss_tables[0]
    accuracy = []
    for p in grid:
        k = bsc(p)
        optimal = 1-risk(k, equal, zero_one)
        expected = (1+tv(k[0],k[1]))/2
        accuracy.append({'flip':str(p),'accuracy':str(optimal),'row_tv':str(tv(k[0],k[1]))})
        check('binary_accuracy_identity_'+str(p), optimal == expected)
    fine, approx, target = bsc(F(0)), bsc(F(1,4)), bsc(F(1,8))
    epsilon = distance(approx, target, equal)
    check('approximation_bound_tight', epsilon == F(1,8) and
          abs(risk(approx,equal,zero_one)-risk(target,equal,zero_one)) == epsilon)
    check('approximate_postprocessing_forward_bound',
          risk(fine,equal,zero_one) <= risk(target,equal,zero_one)+epsilon)

    states = list(product((-1,1), repeat=2))
    identity = encoded(states, lambda s:s)
    recode = encoded(states, lambda s:(s[0], s[0]*s[1]))
    drop = encoded(states, lambda s:(s[0],))
    uniform = [F(1,4)]*4
    losses = [[int(a != v) for a in (-1,1)] for u,v in states]
    check('lossless_encoders_have_full_access', risk(identity,uniform,losses) == risk(recode,uniform,losses) == 0)
    check('dropped_coordinate_has_half_accuracy', 1-risk(drop,uniform,losses) == F(1,2))
    check('recode_has_explicit_inverse', all((u,(u*v)*u) == (u,v) for u,v in states))
    check('product_readout_rescues_all_states', all(u*(u*v) == v for u,v in states))
    coeffs = list(product(range(-2,3),repeat=3))
    def best(encoder):
        return max(sum((1 if a*encoder(s)[0]+b*encoder(s)[1]+c >= 0 else -1) == s[1]
                       for s in states) for a,b,c in coeffs)
    check('affine_grid_identity_four_recoded_three', best(lambda s:s) == 4 and best(lambda s:(s[0],s[0]*s[1])) == 3)
    plus = [(u,u*v) for u,v in states if v==1]
    minus = [(u,u*v) for u,v in states if v==-1]
    check('opposite_classes_have_same_convex_midpoint',
          tuple(sum(z[i] for z in plus) for i in range(2)) ==
          tuple(sum(z[i] for z in minus) for i in range(2)) == (0,0))
    check('measurement_alone_changes_accuracy',
          1-risk(compose(fine,bsc(F(1,8))),equal,zero_one) == F(7,8) and
          1-risk(compose(fine,bsc(F(3,8))),equal,zero_one) == F(5,8))
    evidence = {'channel_cases':cases, 'risk_distances':errors, 'binary_discrimination':accuracy,
        'invertible_recoding':{'unrestricted_identity':'1','unrestricted_recoded':'1',
        'affine_identity_witness':'1','affine_recoded_witness':'3/4','dropped_coordinate_optimum':'1/2',
        'universal_affine_upper_bound':'Hand proof from equal convex midpoints; grid is only a witness.'},
        'measurement_only':{'lower_flip_accuracy':'7/8','higher_flip_accuracy':'5/8'},
        'approximation_epsilon':'1/8'}
    encoded_evidence = json.dumps(evidence,sort_keys=True,separators=(',',':')).encode()
    record = {'status':'PASS_FINITE_MEASUREMENT_DIAGNOSTIC','passed':sum(checks.values()),
        'total':len(checks),'checks':checks,'seconds':time.perf_counter()-start,
        'evidence':evidence,'evidence_sha256':hashlib.sha256(encoded_evidence).hexdigest(),
        'source_sha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'protocol_sha256':hashlib.sha256((ROOT/'PROTOCOL.md').read_bytes()).hexdigest(),
        'limits':'Rational supplied examples, not neural training, held-out data, general automated proof or independent review.'}
    with out.open('x',encoding='utf-8') as handle:
        json.dump(record,handle,indent=2)
        handle.write('\n')
    print(json.dumps({k:record[k] for k in ('status','passed','total','seconds','evidence_sha256')}))


if __name__ == '__main__':
    main()
