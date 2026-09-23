"""Bounded API controls and public-packet-only replay of the output controller."""
import copy
import json
from pathlib import Path
import time
import numpy as np
from multiview_query import digest, state_digest, QueryController, ReceivingBank, QueryWorld
from observable_receiver import ROOT, APP, OutputController
from run_phase_receiver_case import low_priority


def read(p):
    assert p.stat().st_size < 5_000_000
    return json.loads(p.read_text('utf-8'))


def main():
    start = time.perf_counter(); priority = low_priority(); checks = []
    out = APP / 'controls-01'; out.mkdir(exist_ok=False)
    plan = read(APP / 'ANALYSIS-PLAN.json'); base = read(ROOT / plan['basePlan'])
    lesson = read(APP / 'familiarization-01/LESSON.json')

    def check(value, label):
        assert value, label
        checks.append(label)

    check(OutputController.act is QueryController.act and OutputController.query_gain is QueryController.query_gain and
          OutputController.relation is QueryController.relation and OutputController.receive_return is QueryController.receive_return,
          'Original relation, query, action and actual-return methods reused by identity')
    prototype_hash = state_digest(lesson['prototypes']); public_replay_events = 0; sample = None
    for case in plan['conditions']:
        if case['decoder'] not in ('current-only', 'observer'):
            continue
        data = read(APP / 'run-01' / case['id'] / 'EPISODES.json')
        all_actions = True; all_states = True; unchanged = True
        # Reconstruct every output-controller action from saved permitted packets
        # and actual body returns. No world or physical frontend is instantiated.
        for ep in data['episodes']:
            if time.perf_counter() - start > 30:
                raise TimeoutError('Interface replay cap')
            agent = OutputController(base, lesson, case)
            before = state_digest(agent.learned_state())
            check(before == ep['learnedSha256'], 'Frozen decision parameters: ' + case['id'] + '/' + str(ep['metrics']['seed']) + '/' + ep['metrics']['scenario'])
            check(not any(isinstance(v, (ReceivingBank, QueryWorld)) for v in vars(agent).values()),
                  'No direct physical/world owner: ' + case['id'] + '/' + str(ep['metrics']['seed']) + '/' + ep['metrics']['scenario'])
            for e in ep['events']:
                packet = copy.deepcopy(e['observation'])
                packet['samples'].reverse()  # Instrument order is not an identity cue.
                agent.observe(json.dumps(packet, allow_nan=False))
                all_actions &= agent.act() == e['action']
                all_states &= json.loads(json.dumps(agent.state())) == e['stateAfterObservation']
                agent.receive_return(json.dumps(e['bodyReturn'], allow_nan=False))
                all_states &= json.loads(json.dumps(agent.state())) == e['stateAfterReturn']
                public_replay_events += 1
            unchanged &= before == state_digest(agent.learned_state())
            if sample is None:
                sample = (copy.deepcopy(ep['events'][0]['observation']), case)
        check(all_actions and all_states, 'Exact public-packet replay including reversed sample order: ' + case['id'])
        check(unchanged, 'Every learned decoder/model/prototype stayed frozen: ' + case['id'])
    check(state_digest(lesson['prototypes']) == prototype_hash, 'Preparation prototypes were not mutated')
    packet, case = sample; rejected = []
    bad_packets = []
    for field in ('true_pooled_state', 'true_previous_receiver_state', 'captures', 'object_kind', 'private_id', 'future_world_state'):
        bad = copy.deepcopy(packet); bad['samples'][0][field] = 1
        bad_packets.append((field, bad))
    bad = copy.deepcopy(packet); bad['world'] = {}; bad_packets.append(('top-level-world', bad))
    bad = copy.deepcopy(packet); bad['samples'].pop(); bad_packets.append(('missing-terminal-bank', bad))
    bad = copy.deepcopy(packet); bad['samples'][0]['terminal'][0] = float('nan'); bad_packets.append(('nonfinite-terminal', bad))
    bad = copy.deepcopy(packet); bad['samples'][0]['present'] = False; bad_packets.append(('absent-but-range-present', bad))
    bad = copy.deepcopy(packet); bad['samples'][0]['terminal'].append(0.); bad_packets.append(('fifth-latent-output', bad))
    for label, bad in bad_packets:
        try:
            OutputController.decode(json.dumps(bad))
        except ValueError as exc:
            rejected.append(dict(input=label, message=str(exc)))
        else:
            raise AssertionError('Accepted forbidden interface: ' + label)
    check(len(rejected) == 11, 'Eleven forbidden or malformed packets rejected')
    agent = OutputController(base, lesson, case); agent.observe(json.dumps(packet))
    try:
        agent.observe(json.dumps(packet))
    except ValueError:
        check(True, 'Repeated clock rejected')
    else:
        raise AssertionError('Clock replay accepted')
    m = lesson['observerModel']; F = np.array(m['F']); G = np.array(m['G']); Hinv = np.array(m['Hinv'])
    alpha = F[4, 4] - G[4] @ Hinv @ F[:4, 4]
    latent_noise_now = G[4] @ Hinv
    latent_noise_previous = F[4, :4] - G[4] @ Hinv @ F[:4, :4]
    input_latent_gain = Hinv @ F[:4, 4]
    # Numerical verification of the algebraic perturbation identity, not a new
    # simulated performance condition or animal-noise analysis.
    rng = np.random.default_rng(7301); largest = 0.
    for _ in range(32):
        true_old = rng.uniform(-.3, .3, 5); q = rng.uniform(0., .5, 4)
        eta_old = rng.uniform(-.01, .01, 4); eta_now = rng.uniform(-.01, .01, 4)
        eps_old = float(rng.uniform(-.2, .2)); true_new = F @ true_old + G @ q
        measured_old = true_old[:4] + eta_old; measured_now = true_new[:4] + eta_now
        estimated_old = true_old[4] + eps_old
        qhat = Hinv @ (measured_now - F[:4, :4] @ measured_old - F[:4, 4] * estimated_old)
        dhat = F[4, :4] @ measured_old + F[4, 4] * estimated_old + G[4] @ qhat
        predicted_q_error = Hinv @ (eta_now - F[:4, :4] @ eta_old - F[:4, 4] * eps_old)
        predicted_d_error = alpha * eps_old + latent_noise_now @ eta_now + latent_noise_previous @ eta_old
        largest = max(largest, float(np.max(np.abs(qhat - q - predicted_q_error))), abs(float(dhat - true_new[4] - predicted_d_error)))
    check(largest < 1e-12, 'Output-noise error identity agrees in 32 algebra checks')
    values = dict(alpha=float(alpha), inputMapRank=int(np.linalg.matrix_rank(G[:4])),
                  inputMapSingularValues=np.linalg.svd(G[:4], compute_uv=False).tolist(),
                  inputMapConditionNumber=float(np.linalg.cond(G[:4])),
                  inverseInfinityNorm=float(np.linalg.norm(Hinv, ord=np.inf)),
                  inputErrorPerLatentError=input_latent_gain.tolist(),
                  latentNoiseCurrentCoefficients=latent_noise_now.tolist(),
                  latentNoisePreviousCoefficients=latent_noise_previous.tolist(),
                  latentNoiseOneStepInfinityBound=float(np.abs(latent_noise_now).sum() + np.abs(latent_noise_previous).sum()),
                  errorIdentityMaximumResidual=largest,
                  noiseBoundary='Algebraic sensitivity only; no noisy closed-loop run, physiological noise model, or held-out evaluation')
    receipt = dict(status='passed', checks=checks, assertionGroups=len(checks), rejectedPackets=rejected,
                   publicOnlyReplayEvents=public_replay_events, replayEpisodes=96, newMainEpisodes=0,
                   observer=values, codeSha256=digest(Path(__file__)),
                   implementationSha256=digest(ROOT / 'tools/observable_receiver.py'),
                   planSha256=digest(APP / 'ANALYSIS-PLAN.json'),
                   lessonSha256=digest(APP / 'familiarization-01/LESSON.json'),
                   scalarChecksSha256=digest(APP / 'checks-01/CHECKS.json'),
                   seconds=time.perf_counter() - start, priority=priority, sameAgent=True, independentReview=False)
    with (out / 'CONTROLS.json').open('x', encoding='utf-8') as f:
        json.dump(receipt, f, indent=2, allow_nan=False); f.write('\n')
    print(json.dumps({k: v for k, v in receipt.items() if k not in ('checks', 'rejectedPackets')}))


if __name__ == '__main__':
    main()
