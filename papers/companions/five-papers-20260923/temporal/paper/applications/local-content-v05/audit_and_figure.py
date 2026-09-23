"""Independent saved-state arithmetic plus a labeled synthetic dynamics figure."""
import os
for name in ('OPENBLAS_NUM_THREADS','OMP_NUM_THREADS','MKL_NUM_THREADS'):
    os.environ[name]='1'
import hashlib
import json
from pathlib import Path
import sys
sys.dont_write_bytecode=True
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import model

root=Path(__file__).resolve().parent
a,b=root/'run/RESULT.json',root/'replay/RESULT.json'
result=json.loads(a.read_text(encoding='utf-8'))
checks=[a.read_bytes()==b.read_bytes(),result['code_sha256']==hashlib.sha256((root/'model.py').read_bytes()).hexdigest()]
for case in result['cases']:
    h=np.array(case['local_state'])
    ids=[0,3] if case['binding']==1 else [1,2]
    if case['order']==-1:
        ids.reverse()
    direct=np.zeros((2,4))
    for k,tau in enumerate((.4,1.6)):
        direct[k,ids[0]]+=np.exp(-(case['gap']+case['delay'])/tau)
        direct[k,ids[1]]+=np.exp(-case['delay']/tau)
    checks.extend([np.allclose(h.sum(axis=0),direct,rtol=0,atol=1e-12),np.all(h>=0),case['rescued_action']==case['action'],case['erased_action']==0])
    # Removing only one compartment subtracts exactly its retained content.
    erased=h.copy()
    erased[0]=0
    checks.append(np.allclose(erased.sum(axis=0),direct-h[0],rtol=0,atol=1e-12))
audit={'checks_passed':sum(bool(x) for x in checks),'checks_total':len(checks),'byte_identical_replay':a.read_bytes()==b.read_bytes(),'result_sha256':hashlib.sha256(a.read_bytes()).hexdigest(),'scope':'Independent direct-kernel reconstruction and finite local-state interventions, not biological validation'}
(root/'AUDIT.json').write_text(json.dumps(audit,indent=2)+'\n',encoding='utf-8')
fig,axes=plt.subplots(3,1,figsize=(9,6),sharex=True,constrained_layout=True)
for ax,n in zip(axes,(2,3,4)):
    values,_=model.dynamics(n,'baseline')
    t=np.arange(3001)*model.DT
    for j in range(n):
        ax.plot(t,values[6000:,j],label='Component '+str(j+1),linewidth=1.2)
    ax.set_ylabel(str(n)+' parts\nactivation')
    ax.set_ylim(-.02,.82)
    ax.legend(ncol=n,fontsize=8,loc='upper right')
axes[-1].set_xlabel('Dimensionless model time after settling')
fig.suptitle('Local fatigue and mutual inhibition produce shifting participation\nSynthetic rate model: not spikes, fitted physiology, or evidence of experience',fontsize=12)
folder=root/'figures'
folder.mkdir(exist_ok=True)
for suffix in ('png','pdf'):
    fig.savefig(folder/('local-content-dynamics.'+suffix),dpi=170)
plt.close(fig)
print(json.dumps(audit))
