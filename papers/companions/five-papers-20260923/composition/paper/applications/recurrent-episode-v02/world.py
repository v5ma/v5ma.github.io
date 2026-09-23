"""Small symbolic episodes; target rules belong to the dataset, not the model."""
from net import np
import hashlib

DATA_SEEDS={'train':17001,'dev':17002,'test':17003,'challenge':17004}
CONDITIONS=('cue_in_recurrence','cue_at_readout')


def scene_values(ids):
    ids=np.asarray(ids,dtype=np.int64)
    return ((ids[...,None]//(4**np.arange(6)))%4).astype(np.int64)


def scene_ids(values):
    return (np.asarray(values)*(4**np.arange(6))).sum(axis=-1)


def split_pools(config):
    order=np.random.default_rng(config['split_seed']).permutation(4096)
    first=config['train_world_count']
    second=first+config['dev_world_count']
    return {'train':order[:first], 'dev':order[first:second], 'test':order[second:]}


def labels(worlds,tasks):
    result=np.zeros(tasks.shape,dtype=np.int64)
    for stage in range(2):
        current=worlds[:,stage]
        old=worlds[:,0]
        candidates=np.stack((current[:,0],current[:,5],
            4*(current[:,2]//2)+2*(current[:,3]//2)+current[:,4]//2,
            4*current[:,1]+current[:,3],4*old[:,0]+old[:,5],
            np.sign(current[:,4]-old[:,4])+1),axis=1)
        result[:,stage]=candidates[np.arange(len(worlds)),tasks[:,stage]]
    return result


def task_order(rng,n):
    pairs=np.array([(a,b) for a in range(4) for b in range(6) if a!=b])
    result=pairs[np.arange(n)%len(pairs)].copy()
    rng.shuffle(result)
    return result


def observation_order(rng,n):
    return np.argsort(rng.random((n,2,6)),axis=2)


def make_id(config,split,allow_heldout=False):
    if split=='test' and not allow_heldout:
        raise ValueError('Held-out episodes require the post-freeze evaluation path.')
    rng=np.random.default_rng(DATA_SEEDS[split])
    pools=split_pools(config)
    n=config[split+'_episodes']
    ids=rng.choice(pools[split],size=(n,2))
    worlds=scene_values(ids)
    tasks=task_order(rng,n)
    orders=observation_order(rng,n)
    return {'scene_ids':ids,'worlds':worlds,'tasks':tasks,'orders':orders,
            'y':labels(worlds,tasks)}


def make_challenge(config,allow_heldout=False):
    """Distinct transition generator; does not call make_id or sample new scenes."""
    if not allow_heldout:
        raise ValueError('Challenge episodes require frozen models.')
    rng=np.random.default_rng(DATA_SEEDS['challenge'])
    n=config['challenge_episodes']
    old_ids=rng.choice(split_pools(config)['test'],size=n)
    old=scene_values(old_ids)
    new=old.copy()
    entities=rng.integers(0,3,size=n)
    for channel in range(2):
        coord=2*entities+channel
        new[np.arange(n),coord]=(new[np.arange(n),coord]+rng.integers(1,4,size=n))%4
    worlds=np.stack((old,new),axis=1)
    tasks=task_order(rng,n)
    orders=observation_order(rng,n)
    return {'scene_ids':scene_ids(worlds),'worlds':worlds,'tasks':tasks,
            'orders':orders,'y':labels(worlds,tasks),'edited_entity':entities}


def inputs(worlds,tasks,orders,condition):
    if condition not in CONDITIONS:
        raise ValueError(condition)
    n=len(worlds)
    x=np.zeros((n,12,17),dtype=np.float64)
    q=np.eye(6)[tasks]
    rows=np.arange(n)
    for stage in range(2):
        for local in range(6):
            coord=orders[:,stage,local]
            pos=6*stage+local
            x[rows,pos,coord//2]=1
            x[rows,pos,3+coord%2]=1
            x[rows,pos,5+stage]=1
            x[rows,pos,7+worlds[rows,stage,coord]]=1
            if condition=='cue_in_recurrence':
                x[:,pos,11:]=q[:,stage]
    return x,q


def fingerprint(data):
    digest=hashlib.sha256()
    fields={}
    for key in sorted(data):
        value=np.ascontiguousarray(data[key])
        raw=value.tobytes()
        tag=(key+str(value.shape)+str(value.dtype)).encode()
        digest.update(tag)
        digest.update(raw)
        fields[key]={'shape':list(value.shape),'dtype':str(value.dtype),
                     'sha256':hashlib.sha256(raw).hexdigest()}
    return {'sha256':digest.hexdigest(),'arrays':fields}
