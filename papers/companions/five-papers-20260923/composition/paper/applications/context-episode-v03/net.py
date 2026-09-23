"""Matched learned context adapters over a preserved ordinary GRU core."""
from gru_core import np, initialize as core_initialize, forward as core_forward, adam_step

CONDITIONS = ('additive','multiplicative')


def initialize(seed, hidden=48, readout=64):
    p = core_initialize(seed,hidden=hidden,readout=readout)
    p['Wadapter'] = np.zeros((6,11))
    p['badapter'] = np.zeros(11)
    return p


def prepare(p,x,condition):
    if condition not in CONDITIONS:
        raise ValueError(condition)
    a = np.tanh(x[:,:,11:]@p['Wadapter']+p['badapter'])
    physical = x[:,:,:11]+.5*a if condition=='additive' else x[:,:,:11]*(1+.5*a)
    return np.concatenate((physical,x[:,:,11:]),axis=2),a


def forward(p,x,q,condition,reset=False):
    prepared,a = prepare(p,x,condition)
    prob,cache,states = core_forward(p,prepared,q,reset)
    return prob,(cache,a),states


def loss_grad(p,x,q,y,condition):
    probabilities,((caches,heads),adapter),_ = forward(p,x,q,condition)
    b,t,_ = x.shape
    hidden = p['Uz'].shape[0]
    loss = -np.log(np.maximum(probabilities[np.arange(b)[:,None],np.arange(2)[None,:],y],1e-300)).mean()
    grad = {k:np.zeros_like(v) for k,v in p.items()}
    injections = {}
    for stage in range(2):
        joined,middle,prob = heads[stage]
        dlogits = prob.copy()
        dlogits[np.arange(b),y[:,stage]] -= 1
        dlogits /= 2*b
        grad['Wo'] += middle.T@dlogits
        grad['bo'] += dlogits.sum(axis=0)
        dmiddle = (dlogits@p['Wo'].T)*(1-middle*middle)
        grad['Wd'] += joined.T@dmiddle
        grad['bd'] += dmiddle.sum(axis=0)
        injections[(stage+1)*(t//2)-1] = (dmiddle@p['Wd'].T)[:,:hidden]
    dh = np.zeros((b,hidden))
    dx = np.zeros_like(x)
    for step in range(t-1,-1,-1):
        if step in injections:
            dh += injections[step]
        xt,before,z,r,n = caches[step]
        dan = dh*(1-z)*(1-n*n)
        dz = dh*(before-n)
        dprev = dh*z
        grad['Wn'] += xt.T@dan
        grad['Un'] += (r*before).T@dan
        grad['bn'] += dan.sum(axis=0)
        drh = dan@p['Un'].T
        dar = (drh*before)*r*(1-r)
        daz = dz*z*(1-z)
        dprev += drh*r
        dx[:,step] += dan@p['Wn'].T
        for gate,da in (('r',dar),('z',daz)):
            grad['W'+gate] += xt.T@da
            grad['U'+gate] += before.T@da
            grad['b'+gate] += da.sum(axis=0)
            dprev += da@p['U'+gate].T
            dx[:,step] += da@p['W'+gate].T
        dh = dprev
    da = .5*dx[:,:,:11]*(1-adapter*adapter)
    if condition == 'multiplicative':
        da *= x[:,:,:11]
    grad['Wadapter'] = x[:,:,11:].reshape(-1,6).T@da.reshape(-1,11)
    grad['badapter'] = da.sum(axis=(0,1))
    return float(loss),grad
