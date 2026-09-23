"""Fixed benchmark adapter; IDs are excluded from model inputs."""
from pathlib import Path
from hashlib import sha256
import csv
import json
from net import np
ROOT = Path(__file__).resolve().parent
BENCH = ROOT.parent/'ordered-event-benchmark-v03/check-01/episodes.csv'
VARIANTS = ('intact','reset_at_switch','erase_old_values','erase_current_values',
            'coarse_focal_pair','unordered_focal_pair','reverse_retargeted')


def config():
    return json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))


def target(world,task,stage):
    current = world[stage]
    if task == 0:
        return int(current[0])
    if task == 1:
        return int(current[4])
    if task == 2:
        return int(4*(current[0]//2)+2*(current[2]//2)+current[5]//2)
    if task == 3:
        return int(4*current[1]+current[3])
    if task == 4:
        return int(4*world[0,0]+world[0,5])
    if task == 5 and stage == 1:
        return int((int(current[4])-int(world[0,4])) % 4 == 1)
    raise ValueError('Unknown task or unavailable temporal target')


def labels(worlds,tasks):
    return np.array([[target(w,int(q[s]),s) for s in range(2)] for w,q in zip(worlds,tasks)],dtype=np.int16)


def load(split):
    if split not in ('training','development','heldout'):
        raise ValueError(split)
    cfg = config()
    if sha256(BENCH.read_bytes()).hexdigest() != cfg['benchmark_sha256']:
        raise ValueError('Benchmark changed')
    worlds,tasks,blocks = [],[],[]
    first_roles = {}
    with BENCH.open(newline='',encoding='utf-8') as handle:
        for row in csv.DictReader(handle):
            if row['split'] != split:
                continue
            block = int(row['block'])
            if block not in first_roles:
                first_roles[block] = int(np.random.default_rng(cfg['initial_task_seed_offset']+block).integers(0,5))
            old = [int(row[f'old_{i}']) for i in range(6)]
            new = [int(row[f'new_{i}']) for i in range(6)]
            for final_role in range(6):
                worlds.append([old,new])
                tasks.append([first_roles[block],final_role])
                blocks.append(block)
    data = {'worlds':np.asarray(worlds,dtype=np.int16),'tasks':np.asarray(tasks,dtype=np.int16),
            'blocks':np.asarray(blocks,dtype=np.int64)}
    data['y'] = labels(data['worlds'],data['tasks'])
    return data


def inputs(data,variant='intact'):
    if variant not in VARIANTS:
        raise ValueError(variant)
    worlds = data['worlds'].copy()
    y = data['y'].copy()
    if variant == 'reverse_retargeted':
        worlds = worlds[:,::-1,:].copy()
        y = labels(worlds,data['tasks'])
    elif variant == 'unordered_focal_pair':
        worlds[:,:,4] = np.sort(worlds[:,:,4],axis=1)
    n = len(worlds)
    x = np.zeros((n,12,17))
    q = np.eye(6)[data['tasks']]
    for stage in range(2):
        for coordinate in range(6):
            step = stage*6+coordinate
            x[:,step,coordinate] = 1
            x[:,step,6:10] = np.eye(4)[worlds[:,stage,coordinate]]
            x[:,step,10] = stage
            x[:,step,11:] = q[:,stage]
    if variant == 'erase_old_values':
        x[:,:6,6:10] = 0
    elif variant == 'erase_current_values':
        x[:,6:,6:10] = 0
    elif variant == 'coarse_focal_pair':
        for step,stage in ((4,0),(10,1)):
            bins = worlds[:,stage,4]//2
            x[:,step,6:10] = (np.arange(4)[None,:]//2 == bins[:,None]).astype(float)*.5
    return x,q,y


def fingerprint(data):
    h = sha256()
    for k in sorted(data):
        h.update(k.encode())
        h.update(str(data[k].shape).encode())
        h.update(data[k].tobytes())
    return {'sha256':h.hexdigest(),'episodes':len(data['y']),'blocks':len(np.unique(data['blocks']))}
