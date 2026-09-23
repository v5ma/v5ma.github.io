"""Run one create-only, resource-capped output-interface development case."""
import os
for key in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[key] = '1'
import argparse
import json
import time
import numpy as np
from multiview_query import ROOT, digest
from observable_receiver import APP, PLAN, prepare, episode
from run_phase_receiver_case import low_priority


def save(path, value):
    with path.open('x', encoding='utf-8') as f:
        json.dump(value, f, separators=(',', ':'), allow_nan=False)
        f.write('\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('case'); parser.add_argument('--run', default='run-01')
    args = parser.parse_args()
    allowed = 'abcdefghijklmnopqrstuvwxyz0123456789-_'
    if not 1 <= len(args.run) <= 64 or not all(c in allowed for c in args.run):
        raise ValueError('Simple run label required')
    start = time.perf_counter(); priority = low_priority()
    plan = json.loads(PLAN.read_text('utf-8'))
    for field in ('basePlan', 'baseCode', 'baseLesson'):
        assert digest(ROOT / plan[field]) == plan[field + 'Sha256']
    base = json.loads((ROOT / plan['basePlan']).read_text('utf-8'))
    assert digest(ROOT / base['sourceModel']) == base['sourceModelSha256']
    matrix = np.array(json.loads((ROOT / base['sourceModel']).read_text('utf-8'))['matrix'])
    source = json.loads((ROOT / plan['baseLesson']).read_text('utf-8'))
    code = {n: digest(ROOT / 'tools' / n) for n in ('observable_receiver.py', 'run_observable_receiver.py')}
    training = APP / 'familiarization-01'
    if args.case == 'prepare':
        training.mkdir(exist_ok=False)
        lesson = prepare(base, source)
        save(training / 'LESSON.json', lesson)
        receipt = dict(planSha256=digest(PLAN), baseLessonSha256=plan['baseLessonSha256'],
                       codeSha256=code, lessonSha256=digest(training / 'LESSON.json'),
                       seconds=time.perf_counter() - start, priority=priority, numericalThreads=1,
                       currentOnlyCalibrationMaxError=lesson['currentOnlyCalibrationMaxError'],
                       currentOnlyCalibrationRMSE=lesson['currentOnlyCalibrationRMSE'],
                       observerAlpha=lesson['observerModel']['alpha'])
        save(training / 'EXECUTION.json', receipt); print(json.dumps(receipt)); return
    case = next(c for c in plan['conditions'] if c['id'] == args.case)
    receipt = json.loads((training / 'EXECUTION.json').read_text('utf-8'))
    assert receipt['planSha256'] == digest(PLAN) and receipt['codeSha256'] == code
    assert digest(training / 'LESSON.json') == receipt['lessonSha256']
    lesson = json.loads((training / 'LESSON.json').read_text('utf-8'))
    out = APP / args.run / args.case
    assert out.resolve().parent.parent == APP.resolve()
    out.mkdir(parents=True, exist_ok=False)
    try:
        rows = []
        for scenario in base['scenarios']:
            for seed in base['seeds']:
                if time.perf_counter() - start > plan['resources']['maximumCaseSeconds']:
                    raise TimeoutError('Case resource cap')
                rows.append(episode(base, matrix, source, lesson, case, scenario, seed))
        save(out / 'EPISODES.json', dict(case=case, episodes=rows))
        total = dict(case=case['id'], episodes=len(rows), events=sum(len(e['events']) for e in rows),
                     **{m: sum(e['metrics'][m] for e in rows) for m in ('observed', 'inferred', 'unresolved', 'queries', 'bindingErrors')},
                     meanFinalStandoffError=sum(e['metrics']['finalStandoffError'] for e in rows) / len(rows),
                     learnedUnchanged=all(e['metrics']['learnedUnchanged'] for e in rows))
        if case['decoder'] in ('current-only', 'observer'):
            total.update(decodedInputMaxError=max(e['metrics']['decodedInputMaxError'] for e in rows),
                         decodedInputRMSE=float(np.sqrt(np.mean([e['metrics']['decodedInputRMSE'] ** 2 for e in rows]))),
                         statusBindingErrors={s: sum(e['metrics']['statusBindingErrors'][s] for e in rows) for s in ('observed', 'inferred')})
        save(out / 'SUMMARY.json', total)
        elapsed = time.perf_counter() - start; size = (out / 'EPISODES.json').stat().st_size
        assert elapsed < plan['resources']['maximumCaseSeconds'] and size < plan['resources']['maximumCaseBytes']
        done = dict(planSha256=digest(PLAN), basePlanSha256=plan['basePlanSha256'],
                    baseCodeSha256=plan['baseCodeSha256'], baseLessonSha256=plan['baseLessonSha256'],
                    sourceModelSha256=base['sourceModelSha256'], codeSha256=code, lessonSha256=receipt['lessonSha256'],
                    episodeSha256=digest(out / 'EPISODES.json'), summarySha256=digest(out / 'SUMMARY.json'),
                    seconds=elapsed, bytes=size, priority=priority, numericalThreads=1, **total)
        save(out / 'EXECUTION.json', done); print(json.dumps(done))
    except Exception as exc:
        save(out / 'FAILURE.json', dict(error=repr(exc), seconds=time.perf_counter() - start,
                                        codeSha256=code, planSha256=digest(PLAN)))
        raise


if __name__ == '__main__':
    main()
