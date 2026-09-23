"""Scalar replay of saved output-only traces; no experiment-model import.

Uses the already separate scalar receiver/optics helpers, not numpy matrix
coefficients or policy methods. Same authoring agent, not independent review.
"""
import copy
import json
import math
from pathlib import Path
import time
import check_multiview_query as old
from run_phase_receiver_case import low_priority

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'application/observable-receiver-v0'
COUNT = 0


def check(value, label):
    global COUNT
    COUNT += 1
    if not value:
        raise AssertionError(label)


def close(a, b, tol=1e-10):
    if isinstance(a, dict) and isinstance(b, dict):
        return set(a) == set(b) and all(close(a[k], b[k], tol) for k in a)
    if isinstance(a, (list, tuple)) and isinstance(b, (list, tuple)):
        return len(a) == len(b) and all(close(x, y, tol) for x, y in zip(a, b))
    if type(a) in (int, float) and type(b) in (int, float):
        return math.isfinite(a) and math.isfinite(b) and abs(a - b) <= tol
    return a == b


def mv(A, x):
    return [sum(a * b for a, b in zip(row, x, strict=True)) for row in A]


def invert(A):
    n = len(A)
    M = [list(row) + [float(i == j) for j in range(n)] for i, row in enumerate(A)]
    for j in range(n):
        p = max(range(j, n), key=lambda i: abs(M[i][j]))
        check(abs(M[p][j]) > 1e-12, 'nonsingular terminal input map')
        M[j], M[p] = M[p], M[j]
        pivot = M[j][j]; M[j] = [v / pivot for v in M[j]]
        for i in range(n):
            if i != j:
                factor = M[i][j]
                M[i] = [a - factor * b for a, b in zip(M[i], M[j])]
    return [r[n:] for r in M]


def model(settings, tau_factor=1.):
    s = copy.deepcopy(settings); s['tauD'] *= tau_factor
    colsF = [old.receiver([float(i == j) for i in range(5)], [0.] * 4, s, 'intact') for j in range(5)]
    colsG = [old.receiver([0.] * 5, [float(i == j) for i in range(4)], s, 'intact') for j in range(4)]
    F = [list(v) for v in zip(*colsF)]; G = [list(v) for v in zip(*colsG)]
    Hinv = invert(G[:4]); factor = mv(Hinv, [r[4] for r in F[:4]])
    alpha = F[4][4] - sum(a * b for a, b in zip(G[4], factor))
    return dict(F=F, G=G, Hinv=Hinv, errorGain=factor, alpha=alpha)


def observer(terminal, prior, m):
    previous = prior['previousTerminal']; d = prior['latentEstimate']
    residual = [terminal[i] - sum(m['F'][i][j] * previous[j] for j in range(4)) - m['F'][i][4] * d for i in range(4)]
    q = mv(m['Hinv'], residual)
    new_d = sum(m['F'][4][j] * previous[j] for j in range(4)) + m['F'][4][4] * d + sum(a * b for a, b in zip(m['G'][4], q))
    return q, dict(previousTerminal=list(terminal), latentEstimate=new_d)


def relation_action_return(e, base, prototypes):
    post = e['stateAfterObservation']; prior = e['priorState']; step = e['step']
    options = []
    for key, t in post['tracks'].items():
        age = None if t['last_identity'] is None else step - t['last_identity']
        if {i % 2 for i in t['candidates']} == {e['observation']['goal_key']} and age is not None and age <= base['world']['maxEvidenceAge'] and t['range'] is not None:
            options.append((abs(t['range']), int(key)))
    selected = min(options)[1] if options else None
    rel = e['reconstruction']['relation']
    expected = dict(status='unresolved', retinal_bin=None, relative_target=None)
    command = 0.
    if selected is not None:
        t = post['tracks'][str(selected)]
        expected = dict(status=t['status'], retinal_bin=selected, relative_target=t['range'])
        command = math.copysign(min(base['world']['maxCommand'], max(abs(t['range']) - base['world']['standoff'], 0.) / prior['gain']), t['range'])
    check(close(rel, expected), 'relation status and selected target from updated tracks')
    scores = []
    for b in (-1, 1):
        t = post['tracks'][str(b)]
        if t['range'] is None:
            continue
        for view in (0, 1, 2):
            gain, groups = old.risks(t['candidates'], view, prototypes, base['learning']['matchingTolerance'])
            scores.append(dict(retinal_bin=b, view=view, gain=gain, score=gain / (1 + abs(t['range'])), groups=groups))
    check(close(scores, e['queryScores']), 'query partitions and scores')
    query = None
    if selected is None and scores:
        best = sorted(scores, key=lambda x: (-x['score'], x['retinal_bin'], x['view']))[0]
        if best['gain'] > 1e-12:
            query = dict(retinal_bin=best['retinal_bin'], view=best['view'])
    check(close(e['action'], dict(command=command, query=query)), 'selected movement and information query')
    body = e['bodyReturn']; update = e['returnUpdate']; after = e['stateAfterReturn']
    measured = command * e['evaluatorBefore']['gain']
    check(close(body, dict(command=command, measured_displacement=measured, applied_query=query)), 'actual body return')
    gain = prior['gain']
    if abs(command) > 1e-12:
        rate = base['world']['calibrationRate']
        gain = min(2., max(.1, (1 - rate) * gain + rate * measured / command))
    check(close(update, dict(predicted_displacement=prior['gain'] * command, used_displacement=measured,
                             gain_before=prior['gain'], gain_after=gain)), 'actual return and gain calibration')
    expected_after = copy.deepcopy(post)
    expected_after['odometry'] = prior['odometry'] + measured; expected_after['gain'] = gain
    for t in expected_after['tracks'].values():
        if t['range'] is not None:
            t['range'] -= measured
    check(close(after, expected_after), 'only declared return updates occur')


def verify_event(e, base, case, lesson, matrix, scenario, m):
    packet = e['observation']; prior = e['priorState']; post = e['stateAfterObservation']; step = e['step']
    check(set(packet) == {'time', 'goal_key', 'samples'} and packet['time'] == step, 'public packet and clock')
    check(packet['goal_key'] == e['evaluatorBefore']['goal_key'], 'public task')
    check(len(packet['samples']) == 2 and {r['retinal_bin'] for r in packet['samples']} == {-1, 1}, 'two unique terminal banks')
    samples = {r['retinal_bin']: r for r in packet['samples']}
    physical = {r['retinal_bin']: r for r in e['evaluatorFrontend']}
    recs = {r['retinal_bin']: r for r in e['reconstruction']['receiving']}
    check(set(physical) == set(recs) == {-1, 1}, 'complete independent audit traces')
    hidden = scenario in ('occlusion', 'binding_swap') and step in base['world']['occlusionSteps']
    illumination = base['world']['adverseIlluminant'] if scenario == 'adverse_illumination' and step >= base['world']['switchStep'] else [1.] * 4
    expected_tracks = copy.deepcopy(prior['tracks']); predicted_observers = copy.deepcopy(prior['observer'])
    errors, latent_errors = [], []
    for b in (-1, 1):
        s = samples[b]; actual = physical[b]; rec = recs[b]; key = str(b)
        check(set(s) == {'retinal_bin', 'present', 'view', 'signed_range', 'terminal'}, 'terminal sample allowlist')
        check(s['present'] == (not hidden) and rec['present'] == s['present'], 'actual presence')
        check(len(s['terminal']) == 4 and all(math.isfinite(v) for v in s['terminal']), 'finite terminal outputs')
        if hidden:
            q = [0.] * 4
            check(s['signed_range'] is None and s['view'] == 0, 'absence contains no false range or acquired view')
        else:
            truth = e['evaluatorBefore']
            matches = [o for o in truth['objects'] if (-1 if o['position'] - truth['body_position'] < 0 else 1) == b]
            check(len(matches) == 1, 'one surface in instrument address')
            obj = matches[0]
            check(close(s['signed_range'], obj['position'] - truth['body_position']), 'measured signed range')
            check(s['view'] == truth['views'][key], 'view actually acquired, not prediction')
            q = old.optics(obj['kind'], s['view'], illumination, matrix)
        check(close(actual['captures'], q), 'evaluator-only source input')
        expected_state = old.receiver(actual['receiver']['before'], q, base['receiver'], 'intact')
        check(close(expected_state, actual['receiver']['after']), 'scalar physical receiving recurrence')
        check(close(s['terminal'], expected_state[:4]), 'physical output crosses interface')
        if case['decoder'] == 'observer':
            before = prior['observer'][key]
            check(close(rec['observer']['before'], before), 'observer prior continuity')
            decoded, next_state = observer(s['terminal'], before, m)
            check(close(rec['observer']['after'], next_state), 'independent scalar output observer')
            predicted_observers[key] = next_state
            eps_before = before['latentEstimate'] - actual['receiver']['before'][4]
            eps_after = next_state['latentEstimate'] - expected_state[4]
            latent_errors.append(eps_after)
            if case['observerTauFactor'] == 1.:
                check(close(eps_after, m['alpha'] * eps_before), 'conditional latent error contraction')
                check(close([decoded[i] - q[i] for i in range(4)], [-v * eps_before for v in m['errorGain']]), 'conditional decoded-input error identity')
        else:
            check(not prior['observer'] and rec['observer'] is None, 'current-only readout has no output history')
            decoded = old.multiply(s['terminal'] + [1.], lesson['currentOnlyReadout'])
        check(close(rec['decoded'], decoded), 'decoded values, including zero-drive absence')
        errors.extend(decoded[i] - q[i] for i in range(4))
        t = expected_tracks[key]
        if not s['present']:
            t['status'] = 'inferred' if t['last_identity'] is not None else 'unresolved'
            continue
        ds = [old.distance(old.norm(decoded), p[s['view']]) for p in lesson['prototypes'][case['decoder']]]
        match = [] if min(ds) > base['learning']['maximumDistance'] else [i for i, d in enumerate(ds) if d <= min(ds) + base['learning']['matchingTolerance']]
        previous = list(t['candidates']); common = sorted(set(previous) & set(match))
        t['candidates'] = common or match or [0, 1, 2, 3]
        t['range'] = s['signed_range']; t['last_seen'] = step
        t['status'] = 'observed' if len({i % 2 for i in t['candidates']}) == 1 and match else 'unresolved'
        t['last_identity'] = step if t['status'] == 'observed' else None
        check(close(ds, rec['distances']) and match == rec['matchedCandidates'], 'acquired evidence and prototype distance')
        check(previous == rec['priorCandidates'] and t['candidates'] == rec['candidates'] and rec['view'] == s['view'], 'retained-memory intersection')
        check(rec['revised'] == (bool(match) and not common), 'revision flag')
    expected_post = dict(time=step, goal_key=packet['goal_key'], tracks=expected_tracks, observer=predicted_observers,
                         odometry=prior['odometry'], gain=prior['gain'], query_enabled=True, query_step=prior['query_step'] + 1)
    check(close(expected_post, post), 'complete reconstructed decision state')
    relation_action_return(e, base, lesson['prototypes'][case['decoder']])
    return errors, latent_errors


def verify_world(ep, base):
    scenario = ep['metrics']['scenario']; seed = ep['metrics']['seed']; cfg = base['world']
    family, key = seed % 2, (seed // 2) % 2
    objects = [dict(private_id='x', kind=family * 2 + key, position=-3.0 - .15 * seed),
               dict(private_id='y', kind=(1 - family) * 2 + 1 - key, position=3.1 + .1 * seed)]
    views = {'-1': 0, '1': 0}; position = 0.

    def truth(step):
        goal = 0 if scenario == 'task_switch' and step >= cfg['switchStep'] else 1
        gain = cfg['changedGain'] if scenario in ('gain_change', 'occlusion', 'binding_swap') and step >= cfg['gainChangeStep'] else 1.
        target = next(o for o in objects if o['kind'] % 2 == goal)
        r = target['position'] - position
        return dict(time=step, body_position=position, target_relative=r, target_bin=-1 if r < 0 else 1,
                    goal_key=goal, gain=gain, objects=copy.deepcopy(objects), views=copy.deepcopy(views))

    for step, e in enumerate(ep['events']):
        before = truth(step); check(close(before, e['evaluatorBefore']), 'world before action')
        query = e['action']['query']
        if query is not None:
            views[str(query['retinal_bin'])] = query['view']
        position += before['gain'] * e['action']['command']
        if scenario == 'binding_swap' and step + 1 == 6:
            objects[0]['position'], objects[1]['position'] = objects[1]['position'], objects[0]['position']
        check(close(truth(step + 1), e['evaluatorAfter']), 'world changes only through frozen schedule and actual actions')


def save(path, value):
    with path.open('x', encoding='utf-8') as f:
        json.dump(value, f, indent=2, allow_nan=False); f.write('\n')


def main():
    start = time.perf_counter(); priority = low_priority()
    out = APP / 'checks-01'; out.mkdir(exist_ok=False)
    plan = old.read(APP / 'ANALYSIS-PLAN.json'); base = old.read(ROOT / plan['basePlan'])
    lesson = old.read(APP / 'familiarization-01/LESSON.json'); source = old.read(ROOT / plan['baseLesson'])
    training = old.read(APP / 'familiarization-01/EXECUTION.json')
    matrix = old.read(ROOT / base['sourceModel'])['matrix']; pins = {}; rows = []; actions = {}; sample_mutation = None
    for field in ('basePlan', 'baseCode', 'baseLesson'):
        check(old.sha(ROOT / plan[field]) == plan[field + 'Sha256'], 'base identity ' + field)
    check(training['lessonSha256'] == old.sha(APP / 'familiarization-01/LESSON.json'), 'training identity')
    for n, h in training['codeSha256'].items():
        check(old.sha(ROOT / 'tools' / n) == h, 'frozen implementation')
    matched = model(base['receiver'])
    for k in ('F', 'G', 'Hinv', 'alpha'):
        check(close(matched[k], lesson['observerModel'][k]), 'scalar derivation of observer ' + k)
    # Scalar checking of the saved matched teacher run and prototype accumulation.
    prototypes = {name: [[[0.] * 4 for _ in range(3)] for _ in range(4)] for name in ('observer', 'current-only')}
    x = [0.] * 5; state = dict(previousTerminal=[0.] * 4, latentEstimate=0.)
    for teacher, inherited in zip(lesson['teachingRecords'], source['teachingRecords'], strict=True):
        for field in ('public_type', 'public_key', 'view', 'captures'):
            check(teacher[field] == inherited[field], 'same public teaching input/label')
        check(close(teacher['physical']['before'], x), 'continuous teacher receiving')
        x = old.receiver(x, teacher['captures'], base['receiver'], 'intact')
        check(close(x, teacher['physical']['after']) and close(x[:4], teacher['terminal']), 'scalar teacher dynamics')
        decoded, newstate = observer(x[:4], state, matched)
        check(close(state, teacher['observer']['before']) and close(newstate, teacher['observer']['after']), 'teacher observer')
        state = newstate
        estimates = {'observer': decoded, 'current-only': old.multiply(x[:4] + [1.], lesson['currentOnlyReadout'])}
        for name, values in estimates.items():
            check(close(values, teacher['decoded'][name]), 'teacher output decoding')
            for j, v in enumerate(old.norm(values)):
                prototypes[name][teacher['public_type']][teacher['view']][j] += v / len(base['learning']['teacherIntensities'])
    check(close(prototypes, lesson['prototypes']), 'frozen prototypes derive from actual cued outputs')
    # Verify the small ridge normal equation without importing the fitter.
    W = lesson['currentOnlyReadout']; residual = [[base['learning']['ridge'] * v for v in r] for r in W]
    square_errors = []
    for features, target in zip(source['calibrationFeatures'], source['calibrationInputs'], strict=True):
        features = features[:4] + [1.]; fitted = old.multiply(features, W)
        for j in range(4):
            error = fitted[j] - target[j]; square_errors.append(error * error)
            for i in range(5): residual[i][j] += features[i] * error
    check(max(abs(v) for r in residual for v in r) < 1e-9, 'same-calibration ridge normal equation')
    check(close(math.sqrt(sum(square_errors) / len(square_errors)), lesson['currentOnlyCalibrationRMSE']), 'calibration RMSE')
    for case in plan['conditions']:
        folder = APP / 'run-01' / case['id']; receipt = old.read(folder / 'EXECUTION.json')
        summary = old.read(folder / 'SUMMARY.json'); data = old.read(folder / 'EPISODES.json')
        check(receipt['planSha256'] == old.sha(APP / 'ANALYSIS-PLAN.json'), 'frozen plan')
        check(receipt['episodeSha256'] == old.sha(folder / 'EPISODES.json') and receipt['summarySha256'] == old.sha(folder / 'SUMMARY.json'), 'saved case identities')
        check(receipt['codeSha256'] == training['codeSha256'] and receipt['lessonSha256'] == training['lessonSha256'], 'same frozen learner and implementation')
        check(receipt['seconds'] < 40 and receipt['bytes'] < 5_000_000 and receipt['numericalThreads'] == 1 and 'verified' in receipt['priority'], 'resource bound')
        check(data['case'] == case and len(data['episodes']) == 24, 'complete declared case')
        pins[case['id']] = old.sha(folder / 'EXECUTION.json')
        m = model(base['receiver'], case['observerTauFactor'])
        counts = dict(observed=0, inferred=0, unresolved=0); wrong = dict(observed=0, inferred=0)
        errors = []; latents = []; queries = 0; final = []; actionsets = []; remaining_latent = []
        reference = case['decoder'] in ('prior-state', 'direct')
        if reference:
            original_id = 'persistent-query' if case['decoder'] == 'prior-state' else 'direct-learned-query'
            original = old.read(ROOT / 'application/multiview-query-v0/run-01' / original_id / 'EPISODES.json')
        expected_grid = [(s, seed) for s in base['scenarios'] for seed in base['seeds']]
        for number, ep in enumerate(data['episodes']):
            if time.perf_counter() - start > 40:
                raise TimeoutError('Scalar check cap')
            check((ep['metrics']['scenario'], ep['metrics']['seed']) == expected_grid[number] and len(ep['events']) == 24, 'episode grid and length')
            verify_world(ep, base)
            if reference:
                check(ep['events'] == original['episodes'][number]['events'], 'entire preserved reference event replay')
                check(ep['learnedSha256'] == original['episodes'][number]['learnedSha256'], 'preserved reference knowledge')
            else:
                check(not {'banks', 'physical', 'frontend', 'world', 'source_lesson', 'case'} & set(ep['controllerFields']), 'controller object field boundary')
            ep_errors = []; ep_latents = []
            for step, e in enumerate(ep['events']):
                if not reference:
                    prior = e['priorState']
                    if step:
                        check(close(prior, ep['events'][step - 1]['stateAfterReturn']), 'all controller state persists')
                        previous = {r['retinal_bin']: r for r in ep['events'][step - 1]['evaluatorFrontend']}
                        for r in e['evaluatorFrontend']:
                            check(close(r['receiver']['before'], previous[r['retinal_bin']]['receiver']['after']), 'physical frontend persists')
                    else:
                        for r in e['evaluatorFrontend']:
                            check(close(r['receiver']['before'], [0.] * 4 + [case['initialLatentOffset']]), 'declared physical initialization')
                        if case['decoder'] == 'observer':
                            check(all(v == dict(previousTerminal=[0.] * 4, latentEstimate=0.) for v in prior['observer'].values()), 'observer not given unknown initial latent')
                    er, le = verify_event(e, base, case, lesson, matrix, ep['metrics']['scenario'], m)
                    ep_errors.extend(er); ep_latents.extend(le)
                    if case['id'] == 'output-history-observer' and number == 0 and step == 1:
                        sample_mutation = (copy.deepcopy(e), case, m, ep['metrics']['scenario'])
                rel = e['reconstruction']['relation']; counts[rel['status']] += 1
                if rel['retinal_bin'] is not None and rel['retinal_bin'] != e['evaluatorBefore']['target_bin']:
                    wrong[rel['status']] += 1
                queries += e['action']['query'] is not None
            value = abs(abs(ep['events'][-1]['evaluatorAfter']['target_relative']) - base['world']['standoff'])
            check(close(value, ep['metrics']['finalStandoffError']), 'final error from actual world')
            final.append(value); actionsets.append([e['action'] for e in ep['events']])
            check(ep['metrics']['learnedUnchanged'], 'retained lesson flag')
            if not reference:
                check(close(max(map(abs, ep_errors)), ep['metrics']['decodedInputMaxError']), 'episode decoding maximum')
                check(close(math.sqrt(sum(v * v for v in ep_errors) / len(ep_errors)), ep['metrics']['decodedInputRMSE']), 'episode decoding RMSE')
                errors.extend(ep_errors); latents.extend(ep_latents)
                if ep_latents: remaining_latent.extend(ep_latents[-2:])
        row = dict(case=case['id'], episodes=24, events=576, **counts, queries=queries,
                   bindingErrors=sum(wrong.values()), statusBindingErrors=wrong, meanFinalStandoffError=sum(final) / len(final))
        for k in ('episodes', 'events', 'observed', 'inferred', 'unresolved', 'queries', 'bindingErrors', 'meanFinalStandoffError'):
            check(close(row[k], summary[k]), 'recomputed summary ' + k)
        if errors:
            row.update(decodedInputMaxError=max(map(abs, errors)), decodedInputRMSE=math.sqrt(sum(v * v for v in errors) / len(errors)),
                       latentMaxError=max(map(abs, latents), default=None), finalLatentMaxError=max(map(abs, remaining_latent), default=None))
            check(close(row['decodedInputMaxError'], summary['decodedInputMaxError']) and close(row['decodedInputRMSE'], summary['decodedInputRMSE']), 'recomputed all-input error summary')
            check(row['statusBindingErrors'] == summary['statusBindingErrors'], 'recomputed status-specific errors')
        actions[case['id']] = actionsets; rows.append(row)
    reference_actions = actions['prior-state-reference']
    for row in rows:
        paired = zip([a for ep in reference_actions for a in ep], [a for ep in actions[row['case']] for a in ep], strict=True)
        row['actionsDifferingFromPriorStateReference'] = sum(a != b for a, b in paired)
    check(actions['direct-learned-reference'] == reference_actions == actions['output-history-observer'], '576 exact reference/direct/matched observer actions')
    event, case, m, scenario = sample_mutation
    mutations = [
        ('hidden-latent-field', lambda e: e['observation']['samples'][0].__setitem__('true_pooled_state', 0.)),
        ('false-terminal', lambda e: e['observation']['samples'][0]['terminal'].__setitem__(0, .99)),
        ('silent-observer-reset', lambda e: e['reconstruction']['receiving'][0]['observer']['before'].__setitem__('latentEstimate', .1)),
        ('false-estimated-state', lambda e: e['stateAfterObservation']['observer']['-1'].__setitem__('latentEstimate', .99)),
        ('unobserved-view', lambda e: e['observation']['samples'][0].__setitem__('view', 2)),
        ('invented-decoding', lambda e: e['reconstruction']['receiving'][0]['decoded'].__setitem__(0, .99)),
        ('false-query', lambda e: e['action'].__setitem__('query', dict(retinal_bin=-1, view=0))),
        ('false-body-return', lambda e: e['bodyReturn'].__setitem__('measured_displacement', .99)),
    ]
    detected = []
    for label, mutate in mutations:
        changed = copy.deepcopy(event); mutate(changed)
        try:
            verify_event(changed, base, case, lesson, matrix, scenario, m)
        except AssertionError as exc:
            detected.append(dict(mutation=label, rejectedBy=str(exc)))
        else:
            raise AssertionError('Mutation escaped: ' + label)
    result = dict(summary=rows, observer=matched, mainEpisodes=144, mainEvents=3456,
                  statusMeaning='observed includes current evidence and retained history, not independent truth or necessarily a freshly revealing view',
                  sameAgent=True, biologicalData=False, heldOut=False)
    save(out / 'RESULTS.json', result)
    receipt = dict(status='passed', assertionCallsIncludingExpectedMutationFailures=COUNT + old.ASSERTIONS,
                   mainEpisodes=144, mainEvents=3456, scalarOutputOnlyEvents=2304, exactPreservedReferenceEvents=1152,
                   detectedMutations=detected, caseReceipts=pins, checkerSha256=old.sha(Path(__file__)),
                   scalarHelperSha256=old.sha(ROOT / 'tools/check_multiview_query.py'),
                   resultsSha256=old.sha(out / 'RESULTS.json'), seconds=time.perf_counter() - start,
                   priority=priority, independentReview=False)
    save(out / 'CHECKS.json', receipt)
    print(json.dumps({k: v for k, v in receipt.items() if k not in ('caseReceipts', 'detectedMutations')}))
    print(json.dumps(rows))


if __name__ == '__main__':
    main()
