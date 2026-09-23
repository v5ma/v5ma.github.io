"""Bounded local runtime, serialization and categorical sensor definitions."""
from pathlib import Path
import os
import ctypes
import json
import hashlib
import sys
sys.dont_write_bytecode=True
for key in ('OPENBLAS_NUM_THREADS','OMP_NUM_THREADS','MKL_NUM_THREADS','NUMEXPR_NUM_THREADS'):
    os.environ[key]='1'
import numpy as np
ROOT=Path(__file__).resolve().parent
SOURCES=('PROTOCOL.md','CONFIG.json','common.py','world.py','tree.py','agent.py','test_application.py','train.py','evaluate.py')
CLASSES=(4,4,8,16,16,2,5,4)
FAMILIES=('paired','single','fine','coarse')
CONDITIONS=('paired','attention_equivalent','single','fine','coarse','full_record','reset_reference','no_new_samples','coarsen_assembly','permute_binding','restore_binding')


def low_priority():
    if os.name=='nt':
        lib=ctypes.WinDLL('kernel32',use_last_error=True)
        lib.GetCurrentProcess.restype=ctypes.c_void_p
        lib.SetPriorityClass.argtypes=[ctypes.c_void_p,ctypes.c_uint32]
        lib.GetPriorityClass.argtypes=[ctypes.c_void_p]
        lib.GetPriorityClass.restype=ctypes.c_uint32
        h=lib.GetCurrentProcess()
        if not lib.SetPriorityClass(h,0x4000) or lib.GetPriorityClass(h)!=0x4000:
            raise OSError('Below-normal priority unavailable')
    return 'single numeric thread; below-normal Windows priority'


def config():
    return json.loads((ROOT/'CONFIG.json').read_text(encoding='utf-8'))


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def save(path,obj):
    with Path(path).open('x',encoding='utf-8') as h:
        json.dump(obj,h,indent=2,allow_nan=False)
        h.write('\n')


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8'))


def views(x):
    a=np.asarray(x,dtype=np.int8)
    out=np.empty((len(a),24),dtype=np.int8)
    out[:,::2]=a//2;out[:,1::2]=a
    return out


def level(fid):
    return 1+fid%2


def coordinate(fid):
    return fid//2


def width(fid):
    return 2**level(fid)
