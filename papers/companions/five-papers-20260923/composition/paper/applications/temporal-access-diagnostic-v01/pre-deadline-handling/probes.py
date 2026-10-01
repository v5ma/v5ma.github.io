"""Tiny declared readout families; no modification of recurrent models."""
from pathlib import Path
import sys
sys.dont_write_bytecode=True
ROOT=Path(__file__).resolve().parent
DONOR=ROOT.parent/'context-episode-v03'
sys.path.insert(0,str(DONOR))
from net import np,adam_step
import time


def standardize(train,dev):
    mean=train.mean(axis=0)
    std=train.std(axis=0)
    std=np.where(std<1e-8,1.,std)
    return (train-mean)/std,(dev-mean)/std,mean,std


def initialize(seed,features,hidden):
    rng=np.random.default_rng(seed)
    return {'W1':rng.normal(0,1/np.sqrt(features),(features,hidden)),
            'b1':np.zeros(hidden),'W2':rng.normal(0,1/np.sqrt(hidden),(hidden,2)),
            'b2':np.zeros(2)}


def forward(p,x):
    h=np.tanh(x@p['W1']+p['b1'])
    logits=h@p['W2']+p['b2']
    e=np.exp(logits-logits.max(axis=1,keepdims=True))
    return e/e.sum(axis=1,keepdims=True),h


def loss_grad(p,x,y):
    prob,h=forward(p,x)
    loss=-np.log(np.maximum(prob[np.arange(len(y)),y],1e-300)).mean()
    d=prob.copy(); d[np.arange(len(y)),y]-=1; d/=len(y)
    dh=(d@p['W2'].T)*(1-h*h)
    return float(loss),{'W2':h.T@d,'b2':d.sum(axis=0),'W1':x.T@dh,'b1':dh.sum(axis=0)}


def binary_metrics(prob,y):
    return {'accuracy':float((prob.argmax(axis=1)==y).mean()),
            'nll':float(-np.log(np.maximum(prob[np.arange(len(y)),y],1e-300)).mean())}


def fit_mlp(x,y,dx,dy,seed,cfg):
    p=initialize(seed,x.shape[1],cfg['hidden'])
    m={k:np.zeros_like(v) for k,v in p.items()}; v={k:np.zeros_like(a) for k,a in p.items()}
    logs=[]; best=None; bestkey=(-1.,float('-inf')); selected=None
    began=time.perf_counter()
    for epoch in range(1,cfg['epochs']+1):
        if time.perf_counter()-began>cfg['maximum_seconds_per_fit']:
            raise TimeoutError('Small readout fit exceeded its fixed resource cap')
        loss,g=loss_grad(p,x,y)
        if not np.isfinite(loss) or not all(np.isfinite(a).all() for a in g.values()):
            raise ArithmeticError('Nonfinite readout fit')
        norm=adam_step(p,g,m,v,epoch,cfg['learning_rate'],cfg['gradient_clip'],cfg['weight_decay'])
        tr=binary_metrics(forward(p,x)[0],y); de=binary_metrics(forward(p,dx)[0],dy)
        key=(de['accuracy'],-de['nll'])
        if key>bestkey:
            bestkey=key; selected=epoch; best={k:a.copy() for k,a in p.items()}
        logs.append({'epoch':epoch,'train':tr,'development':de,'gradient_norm':norm})
    return best,p,{'seed':seed,'selected_epoch':selected,'epochs':len(logs),
                  'parameters':sum(a.size for a in p.values()),'logs':logs,
                  'selected_train':logs[selected-1]['train'],'selected_development':logs[selected-1]['development'],
                  'final_train':logs[-1]['train'],'final_development':logs[-1]['development']},time.perf_counter()-began


def ridge(x,target,dx,dev_target,penalties,classes):
    # Target columns are independent categorical variables sharing one affine map.
    x=np.column_stack((x,np.ones(len(x))))
    dx=np.column_stack((dx,np.ones(len(dx))))
    t=np.asarray(target).reshape(len(x),-1)
    dt=np.asarray(dev_target).reshape(len(dx),-1)
    onehot=np.eye(classes)[t].reshape(len(x),-1)
    penalty=np.eye(x.shape[1]); penalty[-1,-1]=0
    best=None; grid=[]
    for lam in penalties:
        w=np.linalg.solve(x.T@x+lam*penalty,x.T@onehot)
        pred=(dx@w).reshape(len(dx),t.shape[1],classes).argmax(axis=-1)
        score=float((pred==dt).mean())
        grid.append({'penalty':lam,'development_accuracy':score})
        if best is None or score>best[0]:
            best=score,w,lam
    return best[1],{'penalty':best[2],'development_accuracy':best[0],'grid':grid}


def ridge_predict(w,x,columns,classes):
    x=np.column_stack((x,np.ones(len(x))))
    return (x@w).reshape(len(x),columns,classes).argmax(axis=-1).astype(np.int16)


def relation(pair):
    delta=(pair[:,1]-pair[:,0])%4
    return np.where(delta==1,1,np.where(delta==3,0,2)).astype(np.int16)


def component_metrics(pred,pair):
    truth=relation(pair); answer=relation(pred)
    errors=pred!=pair
    return {'old_accuracy':float((~errors[:,0]).mean()),'current_accuracy':float((~errors[:,1]).mean()),
            'pair_accuracy':float((~errors.any(axis=1)).mean()),'relation_accuracy':float((answer==truth).mean()),
            'abstention_rate':float((answer==2).mean()),
            'relation_error':float((answer!=truth).mean()),
            'sum_component_errors':float(errors.mean(axis=0).sum()),
            'union_bound_holds':bool(np.all((answer!=truth).astype(int)<=errors.sum(axis=1)))}
