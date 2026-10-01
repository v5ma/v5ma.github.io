"""Supervised categorical active classifier, with explicit restricted lookahead."""
from common import np,level,width
import time
from itertools import combinations


def entropy(counts):
    a=np.asarray(counts,dtype=float);s=a.sum(axis=-1,keepdims=True)
    p=np.divide(a,s,out=np.zeros_like(a),where=s>0)
    return -(p*np.log2(np.maximum(p,1e-300))).sum(axis=-1)


def codes(x,fids):
    c=x[:,fids[0]].astype(np.int16)
    for f in fids[1:]:
        c=c*width(f)+x[:,f]
    return c


def decode(code,fids):
    vals=[]
    for f in reversed(fids):
        vals.append(code%width(f));code//=width(f)
    return tuple(reversed(vals))


def train(x,y,nclass,family,cfg,deadline):
    if family=='fine':
        available=tuple(range(1,24,2))
    elif family=='coarse':
        available=tuple(range(0,24,2))
    else:
        available=tuple(range(24))
    work={'candidate_checks':0,'nodes':0,'maximum_depth':0}
    def fit(ix,fids,depth):
        if time.perf_counter()>deadline:
            raise TimeoutError('Tree fit deadline')
        counts=np.bincount(y[ix],minlength=nclass)
        prob=(counts+cfg['smoothing'])/(len(ix)+nclass*cfg['smoothing'])
        node={'n':len(ix),'counts':counts.tolist(),'prob':prob.tolist()}
        work['nodes']+=1;work['maximum_depth']=max(depth,work['maximum_depth'])
        base=float(entropy(counts))
        if base==0 or depth>=cfg['max_depth'] or len(ix)<2*cfg['min_leaf'] or not fids:
            return node
        candidates=[(f,) for f in fids]
        if family!='single':
            candidates.extend((a,b) for a,b in combinations(fids,2) if a//2!=b//2)
        best=None;local=x[ix];labels=y[ix]
        for fs in candidates:
            work['candidate_checks']+=1
            c=codes(local,fs);size=int(np.prod([width(f) for f in fs]))
            table=np.bincount(c*nclass+labels,minlength=size*nclass).reshape(size,nclass)
            totals=table.sum(axis=1);nonzero=totals[totals>0]
            if len(nonzero)<2 or nonzero.min()<cfg['min_leaf']:
                continue
            gain=base-float(np.sum(totals*entropy(table))/len(ix))
            if gain<cfg['min_gain_bits']:
                continue
            cost=sum(level(f)+cfg['operation_charge'] for f in fs)
            score=gain/cost
            if best is None or score>best[0]+1e-12 or (abs(score-best[0])<=1e-12 and (len(fs),fs)<(len(best[1]),best[1])):
                best=(score,fs,c,table,gain,cost)
        if best is None:
            return node
        _,fs,c,table,gain,cost=best
        node.update({'features':list(fs),'gain_bits':gain,'heuristic_cost':cost,'children':{}})
        remaining=tuple(f for f in fids if f not in fs)
        for value in np.flatnonzero(table.sum(axis=1)):
            node['children'][str(int(value))]=fit(ix[c==value],remaining,depth+1)
        return node
    model=fit(np.arange(len(x)),available,0)
    return model,work


def feature(fid,assembly):
    entry=assembly.get(fid//2)
    if entry is None or entry[0]<level(fid):
        return None
    return entry[1]//2 if entry[0]==2 and level(fid)==1 else entry[1]


def compatible(fid,value,assembly):
    entry=assembly.get(fid//2)
    if entry is None:
        return True
    if entry[0]==2:
        expected=entry[1]//2 if level(fid)==1 else entry[1]
        return value==expected
    return value==entry[1] if level(fid)==1 else value//2==entry[1]


def predict(node,assembly):
    if 'features' not in node:
        return np.asarray(node['prob']),1
    fs=node['features'];values=[feature(f,assembly) for f in fs]
    if all(v is not None for v in values):
        key=values[0]
        for f,v in zip(fs[1:],values[1:]):
            key=key*width(f)+v
        child=node['children'].get(str(key))
        if child is None:
            return np.asarray(node['prob']),1
        p,work=predict(child,assembly)
        return p,work+1
    mass=0;out=np.zeros(len(node['prob']));work=1
    for key,child in node['children'].items():
        vals=decode(int(key),fs)
        if all(compatible(f,v,assembly) for f,v in zip(fs,vals)):
            p,steps=predict(child,assembly);out+=child['n']*p;mass+=child['n'];work+=steps
    return (out/mass if mass else np.asarray(node['prob'])),work
