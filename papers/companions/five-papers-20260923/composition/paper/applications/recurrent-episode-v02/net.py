"""Auditable NumPy GRU + learned nonlinear readout; no oracle answer rules."""
import os
for _key in ('OPENBLAS_NUM_THREADS','MKL_NUM_THREADS','OMP_NUM_THREADS','VECLIB_MAXIMUM_THREADS','NUMEXPR_NUM_THREADS'):
    os.environ[_key] = '1'
import numpy as np


def sigmoid(x):
    return 1.0/(1.0+np.exp(-np.clip(x,-60,60)))


def initialize(seed, inputs=17, hidden=48, readout=64, tasks=6, classes=16):
    rng=np.random.default_rng(seed)
    p={}
    for gate in ('z','r','n'):
        p['W'+gate]=rng.normal(0,1/np.sqrt(inputs),(inputs,hidden))
        p['U'+gate]=np.linalg.qr(rng.normal(size=(hidden,hidden)))[0]
        p['b'+gate]=np.zeros(hidden)
    p['bz'][:]=1.0
    p['Wd']=rng.normal(0,1/np.sqrt(hidden+tasks),(hidden+tasks,readout))
    p['bd']=np.zeros(readout)
    p['Wo']=rng.normal(0,1/np.sqrt(readout),(readout,classes))
    p['bo']=np.zeros(classes)
    return p


def forward(p,x,q,reset_at_switch=False):
    """q is used only by the branching answer head; x controls encoder cue access."""
    b,t,_=x.shape
    hidden=p['Uz'].shape[0]
    h=np.zeros((b,hidden))
    caches=[]
    snapshots=[]
    for step in range(t):
        if reset_at_switch and step==t//2:
            h=np.zeros_like(h)
        before=h
        xt=x[:,step]
        z=sigmoid(xt@p['Wz']+before@p['Uz']+p['bz'])
        r=sigmoid(xt@p['Wr']+before@p['Ur']+p['br'])
        n=np.tanh(xt@p['Wn']+(r*before)@p['Un']+p['bn'])
        h=z*before+(1-z)*n
        caches.append((xt,before,z,r,n))
        if step in (t//2-1,t-1):
            snapshots.append(h.copy())
    heads=[]
    probabilities=[]
    for stage in range(2):
        joined=np.concatenate((snapshots[stage],q[:,stage]),axis=1)
        middle=np.tanh(joined@p['Wd']+p['bd'])
        logits=middle@p['Wo']+p['bo']
        exp=np.exp(logits-logits.max(axis=1,keepdims=True))
        prob=exp/exp.sum(axis=1,keepdims=True)
        heads.append((joined,middle,prob))
        probabilities.append(prob)
    return np.stack(probabilities,axis=1),(caches,heads),np.stack(snapshots,axis=1)


def loss_grad(p,x,q,y):
    probabilities,(caches,heads),states=forward(p,x,q)
    b,t,_=x.shape
    hidden=p['Uz'].shape[0]
    loss=-np.log(np.maximum(probabilities[np.arange(b)[:,None],np.arange(2)[None,:],y],1e-300)).mean()
    grad={key:np.zeros_like(value) for key,value in p.items()}
    injections={}
    for stage in range(2):
        joined,middle,prob=heads[stage]
        dlogits=prob.copy()
        dlogits[np.arange(b),y[:,stage]]-=1
        dlogits/=2*b
        grad['Wo']+=middle.T@dlogits
        grad['bo']+=dlogits.sum(axis=0)
        dmiddle=(dlogits@p['Wo'].T)*(1-middle*middle)
        grad['Wd']+=joined.T@dmiddle
        grad['bd']+=dmiddle.sum(axis=0)
        injections[(stage+1)*(t//2)-1]=(dmiddle@p['Wd'].T)[:,:hidden]
    dh=np.zeros((b,hidden))
    for step in range(t-1,-1,-1):
        if step in injections:
            dh+=injections[step]
        xt,before,z,r,n=caches[step]
        dan=dh*(1-z)*(1-n*n)
        dz=dh*(before-n)
        dprev=dh*z
        grad['Wn']+=xt.T@dan
        grad['Un']+=(r*before).T@dan
        grad['bn']+=dan.sum(axis=0)
        drh=dan@p['Un'].T
        dr=drh*before
        dprev+=drh*r
        dar=dr*r*(1-r)
        daz=dz*z*(1-z)
        for gate,da in (('r',dar),('z',daz)):
            grad['W'+gate]+=xt.T@da
            grad['U'+gate]+=before.T@da
            grad['b'+gate]+=da.sum(axis=0)
            dprev+=da@p['U'+gate].T
        dh=dprev
    return float(loss),grad


def adam_step(p,grad,m,v,step,lr,clip,decay):
    norm=float(np.sqrt(sum(np.square(g).sum() for g in grad.values())))
    scale=min(1.0,clip/(norm+1e-12))
    for key in p:
        g=grad[key]*scale
        m[key]*=.9
        m[key]+=.1*g
        v[key]*=.999
        v[key]+=.001*g*g
        p[key]-=lr*(m[key]/(1-.9**step))/(np.sqrt(v[key]/(1-.999**step))+1e-8)
        if key.startswith(('W','U')):
            p[key]*=1-lr*decay
    return norm
