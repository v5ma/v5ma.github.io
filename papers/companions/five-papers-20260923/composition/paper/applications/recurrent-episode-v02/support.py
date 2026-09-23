"""Bounded experiment I/O and descriptive metrics; no filesystem discovery."""
from net import np,forward
from pathlib import Path
import ctypes
import hashlib
import json
import os

ROOT=Path(__file__).resolve().parent


def lower_priority():
    if os.name=='nt':
        kernel=ctypes.WinDLL('kernel32',use_last_error=True)
        kernel.GetCurrentProcess.restype=ctypes.c_void_p
        kernel.SetPriorityClass.argtypes=[ctypes.c_void_p,ctypes.c_uint32]
        if not kernel.SetPriorityClass(kernel.GetCurrentProcess(),0x00004000):
            raise OSError(ctypes.get_last_error(),'Could not set below-normal priority')
        return 'BELOW_NORMAL_PRIORITY_CLASS'
    return 'single-thread; non-Windows priority unchanged'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save_json(path,value):
    with Path(path).open('x',encoding='utf-8') as handle:
        json.dump(value,handle,indent=2,allow_nan=False)


def predict(p,x,q,reset=False,batch=128):
    probabilities=[]
    hidden=[]
    for start in range(0,len(x),batch):
        prob,_,h=forward(p,x[start:start+batch],q[start:start+batch],reset)
        probabilities.append(prob)
        hidden.append(h)
    return np.concatenate(probabilities),np.concatenate(hidden)


def metrics(prob,y,tasks):
    pred=prob.argmax(axis=-1)
    losses=-np.log(np.maximum(prob[np.arange(len(y))[:,None],np.arange(2)[None,:],y],1e-300))
    cells=[]
    for stage in range(2):
        for task in range(6):
            selected=tasks[:,stage]==task
            n=int(selected.sum())
            if n:
                cells.append({'stage':stage,'task':task,'n':n,
                    'correct':int((pred[selected,stage]==y[selected,stage]).sum()),
                    'accuracy':float((pred[selected,stage]==y[selected,stage]).mean()),
                    'nll':float(losses[selected,stage].mean())})
    return {'accuracy':float((pred==y).mean()),'nll':float(losses.mean()),
        'balanced_accuracy':float(np.mean([c['accuracy'] for c in cells])),
        'balanced_nll':float(np.mean([c['nll'] for c in cells])), 'cells':cells}
