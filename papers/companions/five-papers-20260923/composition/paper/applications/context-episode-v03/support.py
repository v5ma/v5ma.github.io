"""Small experiment I/O, runtime limits and declared metrics."""
from net import np,forward
from pathlib import Path
from hashlib import sha256
import ctypes
import json
import os
ROOT = Path(__file__).resolve().parent
SOURCES = ('CONFIG.json','PROTOCOL.md','EVALUATION-PLAN.md','gru_core.py','net.py',
           'world.py','support.py','test_study.py','train.py','evaluate.py')


def lower_priority():
    if os.name == 'nt':
        lib = ctypes.WinDLL('kernel32',use_last_error=True)
        lib.GetCurrentProcess.restype = ctypes.c_void_p
        lib.SetPriorityClass.argtypes = [ctypes.c_void_p,ctypes.c_uint32]
        if not lib.SetPriorityClass(lib.GetCurrentProcess(),0x00004000):
            raise OSError(ctypes.get_last_error(),'Could not lower priority')
        lib.GetPriorityClass.argtypes = [ctypes.c_void_p]
        lib.GetPriorityClass.restype = ctypes.c_uint32
        if lib.GetPriorityClass(lib.GetCurrentProcess()) != 0x00004000:
            raise OSError('Below-normal priority was not applied')
        return 'BELOW_NORMAL_PRIORITY_CLASS'
    return 'non-Windows; priority not changed'


def sha(path):
    return sha256(Path(path).read_bytes()).hexdigest()


def save(path,obj):
    with Path(path).open('x',encoding='utf-8') as handle:
        json.dump(obj,handle,indent=2,allow_nan=False)
        handle.write('\n')


def predict(p,x,q,condition,reset=False):
    probabilities,states = [],[]
    for start in range(0,len(x),128):
        prob,_,state = forward(p,x[start:start+128],q[start:start+128],condition,reset)
        probabilities.append(prob)
        states.append(state)
    return np.concatenate(probabilities),np.concatenate(states)


def metrics(prob,y,tasks):
    correct = prob.argmax(axis=-1)==y
    nll = -np.log(np.maximum(prob[np.arange(len(y))[:,None],np.arange(2)[None,:],y],1e-300))
    cells=[]
    for stage in range(2):
        for task in range(6):
            mask = tasks[:,stage]==task
            if mask.any():
                cells.append({'stage':stage,'task':task,'n':int(mask.sum()),
                    'accuracy':float(correct[mask,stage].mean()),'nll':float(nll[mask,stage].mean())})
    return {'final_balanced_accuracy':float(np.mean([c['accuracy'] for c in cells if c['stage']==1])),
            'final_nll':float(nll[:,1].mean()),'first_accuracy':float(correct[:,0].mean()),
            'first_nll':float(nll[:,0].mean()),'cells':cells}
