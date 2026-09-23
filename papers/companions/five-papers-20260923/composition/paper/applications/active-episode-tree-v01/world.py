"""Oracle-owned episode generation and labels; never imported by agent.py."""
from common import np,CLASSES


def generate(seed,split,nblocks,excluded=()):
    offsets={'training':0,'development':100000,'heldout':200000,'test':300000}
    rng=np.random.default_rng(seed+offsets[split]); used=set(int(v) for v in excluded)
    codes=[];rows=[];block_ids=[]
    for block in range(nblocks):
        for attempt in range(10000):
            code=int(rng.integers(4**10))
            if code not in used:
                used.add(code);break
        else:
            raise RuntimeError('Bounded background sampling exhausted')
        codes.append(code);digits=[];value=code
        for _ in range(10):
            digits.append(value%4);value//=4
        a=np.empty(6,dtype=np.int8);b=np.empty(6,dtype=np.int8)
        rest=(0,1,2,3,5);a[list(rest)]=digits[:5];b[list(rest)]=digits[5:]
        for old in range(4):
            for delta in (1,3):
                a[4]=old;b[4]=(old+delta)%4
                rows.append(np.concatenate((a,b)));block_ids.append(block)
    return np.asarray(rows,dtype=np.int8),np.asarray(block_ids,dtype=np.int16),np.asarray(codes,dtype=np.int64)


def targets(x):
    x=np.asarray(x);a=x[:,:6];b=x[:,6:]
    return np.stack((b[:,0],b[:,5],4*(b[:,2]//2)+2*(b[:,3]//2)+b[:,4]//2,
        4*b[:,1]+b[:,3],4*a[:,0]+a[:,5],(((b[:,4]-a[:,4])%4)==1).astype(np.int8),
        np.where(b[:,2]//2==0,0,1+b[:,0]),b[:,4]),axis=1).astype(np.int8)


def roles(block,second,cfg):
    allowed=cfg['first_roles'];pos=(block+second)%len(allowed)
    first=allowed[pos]
    if first==second:
        first=allowed[(pos+1)%len(allowed)]
    return first,second,(second+cfg['third_role_offset'])%8


class Environment:
    def __init__(self,old,new):
        self._old=tuple(int(v) for v in old);self._new=tuple(int(v) for v in new)
        self._scene=0;self.calls=[]

    def switch(self):
        self._scene=1

    def observe(self,index,granularity):
        if index not in range(6) or granularity not in (1,2):
            raise ValueError('Invalid sensor request')
        value=(self._old if self._scene==0 else self._new)[index]
        returned=value//2 if granularity==1 else value
        self.calls.append((self._scene,index,granularity,returned))
        return returned


def oracle_bound(x,y,keep):
    groups={}
    for row,label in zip(x,y):
        key=tuple(keep(row))
        if key not in groups:
            groups[key]=[0,0]
        groups[key][int(label)]+=1
    return sum(max(v) for v in groups.values())/len(y)
