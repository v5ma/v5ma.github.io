"""Output-only decision interface for the frozen synthetic receiving model.

The physical frontend is owned by the episode runner, never by the controller.
The exact observer is a known-model construction, not learned fly physiology.
"""
import os
for key in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[key] = '1'
import copy
import json
import math
import numpy as np
from multiview_query import (
    ROOT, ReceivingBank, QueryController, QueryWorld, normalized, state_digest,
    episode as reference_episode,
)

APP = ROOT / 'application/observable-receiver-v0'
PLAN = APP / 'ANALYSIS-PLAN.json'


def coefficients(settings, tau_factor=1.):
    """Known engineered Euler model; derive the finite-step map explicitly."""
    s = settings
    A = np.zeros((5, 5))
    A[:4, :4] = -np.eye(4)
    for i, j in enumerate((2, 3, 0, 1)):
        A[i, j] -= s['his']
    A[:4, 4] = s['c']
    tau = s['tauD'] * tau_factor
    A[4, :4] = -s['h'] / (4 * tau)
    A[4, :2] += s['e'] / (2 * tau)
    A[4, 4] = -1 / tau
    T = np.eye(5) + s['step'] * A
    B = np.zeros((5, 4)); B[:4, :] = np.eye(4)
    F = np.eye(5); G = np.zeros((5, 4))
    for _ in range(s['substeps']):
        F = T @ F
        G = T @ G + s['step'] * B
    Hinv = np.linalg.inv(G[:4])
    alpha = float(F[4, 4] - G[4] @ Hinv @ F[:4, 4])
    return dict(F=F.tolist(), G=G.tolist(), Hinv=Hinv.tolist(), alpha=alpha,
                tauFactor=tau_factor, model='engineered four-substep map')


class OutputObserver:
    def __init__(self, model):
        self.F = np.array(model['F']); self.G = np.array(model['G'])
        self.Hinv = np.array(model['Hinv'])
        self.previous = np.zeros(4)
        self.latent = 0.

    def state(self):
        return dict(previousTerminal=self.previous.tolist(), latentEstimate=self.latent)

    def receive(self, terminal):
        p = np.asarray(terminal, float)
        before = self.state()
        q = self.Hinv @ (p - self.F[:4, :4] @ self.previous - self.F[:4, 4] * self.latent)
        d = float(self.F[4, :4] @ self.previous + self.F[4, 4] * self.latent + self.G[4] @ q)
        self.previous = p.copy(); self.latent = d
        return q, dict(before=before, after=self.state())


def prepare(base, source_lesson):
    """Train only from the pinned public calibration and teaching records."""
    X = np.array(source_lesson['calibrationFeatures'])
    Y = np.array(source_lesson['calibrationInputs'])
    current = np.column_stack((X[:, :4], np.ones(len(X))))
    W = np.linalg.solve(current.T @ current + base['learning']['ridge'] * np.eye(5), current.T @ Y)
    model = coefficients(base['receiver'])
    physical = ReceivingBank(base['receiver'])
    observer = OutputObserver(model)
    prototypes = {k: np.zeros((4, 3, 4)) for k in ('current-only', 'observer')}
    records = []
    divisor = len(base['learning']['teacherIntensities'])
    for source in source_lesson['teachingRecords']:
        q = np.array(source['captures'])
        features, actual = physical.receive(q)
        p = features[:4]
        estimates = {'current-only': np.r_[p, 1.] @ W}
        estimates['observer'], history = observer.receive(p)
        kind, view = source['public_type'], source['view']
        for decoder, decoded in estimates.items():
            prototypes[decoder][kind, view] += normalized(decoded) / divisor
        records.append(dict(public_type=kind, public_key=source['public_key'], view=view,
                            captures=q.tolist(), terminal=p.tolist(), physical=actual, observer=history,
                            decoded={k: v.tolist() for k, v in estimates.items()}))
    return dict(currentOnlyReadout=W.tolist(), observerModel=model,
                prototypes={k: v.tolist() for k, v in prototypes.items()},
                teachingRecords=records,
                currentOnlyCalibrationMaxError=float(np.max(np.abs(current @ W - Y))),
                currentOnlyCalibrationRMSE=float(np.sqrt(np.mean((current @ W - Y) ** 2))),
                training='Same pinned public inputs; matched zero initial state; no evaluation worlds')


class PhysicalFrontend:
    """Runner-owned physical apparatus. Audit trace is never in its output packet."""
    def __init__(self, settings, initial_offset):
        self.banks = {b: ReceivingBank(settings) for b in (-1, 1)}
        for bank in self.banks.values():
            bank.x[4] = initial_offset

    def sample(self, raw_payload):
        raw = QueryController.decode(raw_payload)
        rows = {r['retinal_bin']: r for r in raw['samples']}
        samples, audit = [], []
        for b in (-1, 1):
            row = rows.get(b)
            q = np.zeros(4) if row is None else np.array(row['captures'])
            _, trace = self.banks[b].receive(q)
            samples.append(dict(retinal_bin=b, present=row is not None,
                                view=0 if row is None else row['view'],
                                signed_range=None if row is None else row['signed_range'],
                                terminal=trace['after'][:4]))
            audit.append(dict(retinal_bin=b, captures=q.tolist(), receiver=trace))
        packet = dict(time=raw['time'], goal_key=raw['goal_key'], samples=samples)
        return json.dumps(packet, allow_nan=False), audit


class OutputController:
    # The existing relation/query/action/actual-return methods are reused unchanged.
    relation = QueryController.relation
    query_gain = QueryController.query_gain
    act = QueryController.act
    receive_return = QueryController.receive_return

    def __init__(self, base, lesson, case):
        public = ('initialGain', 'maxCommand', 'standoff', 'maxEvidenceAge', 'calibrationRate')
        self.cfg = {k: copy.deepcopy(base['world'][k]) for k in public}
        self.lc = copy.deepcopy(base['learning'])
        self.decoder = case['decoder']
        if self.decoder not in ('current-only', 'observer'):
            raise ValueError('References use their separately declared privileged interface')
        self.W = np.array(lesson['currentOnlyReadout']) if self.decoder == 'current-only' else None
        self.model = coefficients(base['receiver'], case['observerTauFactor']) if self.decoder == 'observer' else None
        self.observers = {b: OutputObserver(self.model) for b in (-1, 1)} if self.model else {}
        self.prototypes = np.array(lesson['prototypes'][self.decoder])
        self.key_labels = np.array([0, 1, 0, 1])
        self.query_policy = 'active'; self.return_policy = 'measured'
        self.gain = self.cfg['initialGain']; self.odometry = 0.
        self.tracks = {b: dict(candidates=[0, 1, 2, 3], range=None, last_seen=None,
                               last_identity=None, status='unresolved') for b in (-1, 1)}
        self.time = -1; self.goal_key = 1; self.query_enabled = True
        self.query_step = 0; self.last_query_scores = []; self.last_relation = None

    def learned_state(self):
        return dict(readout=None if self.W is None else self.W.tolist(), model=self.model,
                    prototypes=self.prototypes.tolist(), keys=self.key_labels.tolist())

    @staticmethod
    def decode(payload):
        obs = json.loads(payload)
        if set(obs) != {'time', 'goal_key', 'samples'} or type(obs['time']) is not int or type(obs['goal_key']) is not int or obs['goal_key'] not in (0, 1):
            raise ValueError('Output observation interface')
        if not isinstance(obs['samples'], list) or len(obs['samples']) != 2:
            raise ValueError('Both continuously sampled terminal banks required')
        seen = set()
        for row in obs['samples']:
            if set(row) != {'retinal_bin', 'present', 'view', 'signed_range', 'terminal'}:
                raise ValueError('Terminal sample interface')
            if type(row['retinal_bin']) is not int or row['retinal_bin'] not in (-1, 1) or row['retinal_bin'] in seen:
                raise ValueError('Terminal address')
            if type(row['view']) is not int or row['view'] not in (0, 1, 2) or type(row['present']) is not bool:
                raise ValueError('View/presence interface')
            seen.add(row['retinal_bin'])
            p = row['terminal']
            if not isinstance(p, list) or len(p) != 4 or any(type(v) not in (int, float) or not math.isfinite(v) for v in p):
                raise ValueError('Terminal values')
            r = row['signed_range']
            if row['present']:
                if type(r) not in (int, float) or not math.isfinite(r):
                    raise ValueError('Present range')
            elif r is not None:
                raise ValueError('Absent sample carries no range')
        return obs

    def observe(self, payload):
        obs = self.decode(payload)
        if obs['time'] <= self.time:
            raise ValueError('Clock must advance')
        self.time = obs['time']; self.goal_key = obs['goal_key']
        rows = {r['retinal_bin']: r for r in obs['samples']}
        audit = []
        for b in (-1, 1):
            row = rows[b]; track = self.tracks[b]
            if self.decoder == 'observer':
                decoded, history = self.observers[b].receive(row['terminal'])
            else:
                decoded = np.r_[row['terminal'], 1.] @ self.W
                history = None
            record = dict(retinal_bin=b, present=row['present'], decoded=decoded.tolist(), observer=history)
            if not row['present']:
                track['status'] = 'inferred' if track['last_identity'] is not None else 'unresolved'
                audit.append(record); continue
            vector = normalized(decoded)
            distances = np.linalg.norm(self.prototypes[:, row['view']] - vector, axis=1)
            match = [] if float(distances.min()) > self.lc['maximumDistance'] else [int(i) for i, d in enumerate(distances) if d <= distances.min() + self.lc['matchingTolerance']]
            prior = list(track['candidates']); common = sorted(set(prior) & set(match))
            revised = bool(match) and not common
            track['candidates'] = common if common else (match if match else [0, 1, 2, 3])
            track['range'] = row['signed_range']; track['last_seen'] = self.time
            keys = {int(self.key_labels[i]) for i in track['candidates']}
            if len(keys) == 1 and match:
                track['status'] = 'observed'; track['last_identity'] = self.time
            else:
                track['status'] = 'unresolved'; track['last_identity'] = None
            record.update(distances=distances.tolist(), priorCandidates=prior, matchedCandidates=match,
                          candidates=list(track['candidates']), view=row['view'], revised=revised)
            audit.append(record)
        self.last_relation = self.relation()
        return dict(relation=copy.deepcopy(self.last_relation), receiving=audit)

    def state(self):
        return dict(time=self.time, goal_key=self.goal_key, tracks=copy.deepcopy(self.tracks),
                    observer={str(b): ob.state() for b, ob in self.observers.items()},
                    odometry=self.odometry, gain=self.gain, query_enabled=self.query_enabled, query_step=self.query_step)


def episode(base, matrix, source_lesson, lesson, case, scenario, seed):
    if case['decoder'] in ('prior-state', 'direct'):
        old_case = dict(id=case['id'], perception='direct' if case['decoder'] == 'direct' else 'learned-receiver', query='active', receiver='intact')
        return reference_episode(base, matrix, source_lesson, old_case, scenario, seed)
    world = QueryWorld(base, matrix, scenario, seed)
    physical = PhysicalFrontend(base['receiver'], case['initialLatentOffset'])
    agent = OutputController(base, lesson, case)
    initial = state_digest(agent.learned_state()); events = []; input_errors = []; latent_errors = []
    for step in range(base['world']['steps']):
        truth = world.truth(); prior = agent.state()
        payload, trace = physical.sample(world.observation())
        result = agent.observe(payload)
        for actual, rec in zip(trace, result['receiving'], strict=True):
            input_errors.extend((np.array(rec['decoded']) - actual['captures']).tolist())
            if rec['observer'] is not None:
                latent_errors.append(rec['observer']['after']['latentEstimate'] - actual['receiver']['after'][4])
        action = agent.act(); after_obs = agent.state()
        returned = world.execute(action); after_return = agent.receive_return(returned)
        events.append(dict(step=step, observation=json.loads(payload), priorState=prior, reconstruction=result,
                           stateAfterObservation=after_obs, queryScores=copy.deepcopy(agent.last_query_scores),
                           action=action, bodyReturn=json.loads(returned), returnUpdate=after_return,
                           stateAfterReturn=agent.state(), evaluatorBefore=truth, evaluatorAfter=world.truth(),
                           evaluatorFrontend=trace))
    counts = {s: sum(e['reconstruction']['relation']['status'] == s for e in events) for s in ('observed', 'inferred', 'unresolved')}
    errors = [abs(e['reconstruction']['relation']['relative_target'] - e['evaluatorBefore']['target_relative']) for e in events if e['reconstruction']['relation']['relative_target'] is not None]
    wrong = {s: sum(e['reconstruction']['relation']['status'] == s and e['reconstruction']['relation']['retinal_bin'] != e['evaluatorBefore']['target_bin'] for e in events) for s in ('observed', 'inferred')}
    last = world.truth()
    metrics = dict(scenario=scenario, seed=seed, case=case['id'], **counts,
                   queries=sum(e['action']['query'] is not None for e in events), bindingErrors=sum(wrong.values()),
                   statusBindingErrors=wrong, maxRelationError=max(errors, default=None),
                   finalStandoffError=abs(abs(last['target_relative']) - base['world']['standoff']),
                   movementPredictionError=sum(abs(e['returnUpdate']['predicted_displacement'] - e['bodyReturn']['measured_displacement']) for e in events),
                   decodedInputMaxError=float(np.max(np.abs(input_errors))),
                   decodedInputRMSE=float(np.sqrt(np.mean(np.square(input_errors)))),
                   latentMaxError=max(map(abs, latent_errors), default=None),
                   learnedUnchanged=state_digest(agent.learned_state()) == initial)
    return dict(metrics=metrics, learnedSha256=initial, events=events, controllerFields=sorted(vars(agent)))
