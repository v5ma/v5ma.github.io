"""Frozen three-query episodes, full compact traces and deterministic replay."""
from common import ROOT,SOURCES,CONDITIONS,CLASSES,config,sha,save,read,low_priority,np
from world import generate,targets,roles,Environment
from agent import Agent
import time
import sys
COUNTS=('sampling_bits','samples','retrievals','unavailable','policy_nodes','readout_nodes','assembly_variables','assembly_value_bits','reference_cache_fields','current_cache_fields')


def frozen():
    f=read(ROOT/'fit-01/FROZEN.json')
    if not f['complete'] or f['source_hashes']!={n:sha(ROOT/n) for n in SOURCES}:
        raise ValueError('Frozen source mismatch')
    if any(sha(ROOT/'fit-01'/m['name'])!=m['sha256'] for m in f['models']):
        raise ValueError('Frozen model mismatch')
    if sha(ROOT/'fit-01/training-data.npz')!=f['training_data_sha256']:
        raise ValueError('Training data changed')
    return f


def run(folder_name,split):
    low_priority();cfg=config();receipt=frozen();folder=ROOT/folder_name;folder.mkdir(exist_ok=False)
    save(folder/'BEFORE.json',{'frozen_sha256':sha(ROOT/'fit-01/FROZEN.json'),'source_hashes':receipt['source_hashes'],
        'split':split,'stage':'before constructing evaluation cases'})
    started=time.perf_counter();deadline=started+cfg['evaluation_deadline_seconds']
    total=len(cfg['seeds'])*cfg['blocks'][split]*8*8*len(CONDITIONS)*3
    meta=np.full((total,9),-1,dtype=np.int16);prob=np.zeros((total,16));cnt=np.zeros((total,len(COUNTS)),dtype=np.int16)
    act=np.full((total,32,3),-1,dtype=np.int8);asm=np.full((total,12,2),-1,dtype=np.int8)
    cache=np.full((total,12,2),-1,dtype=np.int8);cases={};rows=0;examples={}
    training=np.load(ROOT/'fit-01/training-data.npz',allow_pickle=False)
    try:
        for si,seed in enumerate(cfg['seeds']):
            excluded=training[f's{seed}_codes']
            if split=='heldout':
                _,_,devcodes=generate(seed,'development',cfg['blocks']['development'],excluded)
                excluded=np.concatenate((excluded,devcodes))
            x,blocks,bg=generate(seed,split,cfg['blocks'][split],excluded)
            cases[f's{seed}_x']=x;cases[f's{seed}_blocks']=blocks;cases[f's{seed}_codes']=bg
            y=targets(x);first_y=targets(np.concatenate((x[:,:6],x[:,:6]),axis=1))
            models={m['family']:read(ROOT/'fit-01'/m['name'])['trees'] for m in receipt['models'] if m['seed']==seed}
            for ci,condition in enumerate(CONDITIONS):
                family=condition if condition in ('single','fine','coarse') else 'paired'
                for ix,row in enumerate(x):
                    if time.perf_counter()>deadline:
                        raise TimeoutError('Evaluation deadline')
                    for second in range(8):
                        tasks=roles(int(blocks[ix]),second,cfg)
                        env=Environment(row[:6],row[6:]);agent=Agent(models[family],condition)
                        trace=[]
                        for stage,task in enumerate(tasks):
                            if stage==1:
                                env.switch();agent.switch()
                            p,detail=agent.query(task,env.observe)
                            target=int(first_y[ix,task] if stage==0 else y[ix,task])
                            meta[rows]=[si,ci,ix,blocks[ix],second,stage,task,target,int(p.argmax())]
                            prob[rows,:len(p)]=p;cnt[rows]=[detail['counts'][k] for k in COUNTS]
                            if len(detail['actions'])>32:
                                raise ValueError('Action trace capacity exceeded')
                            for j,a in enumerate(detail['actions']):act[rows,j]=a
                            for k,v in detail['assembly'].items():asm[rows,k]=v
                            for k,v in detail['reference'].items():cache[rows,k]=v
                            for k,v in detail['current'].items():cache[rows,k+6]=v
                            trace.append({'stage':stage,'task':task,'target':target,'prediction':int(p.argmax()),
                                'probability':p.tolist(),'actions':detail['actions'],'counts':detail['counts'],
                                'assembly':{str(k):list(v) for k,v in detail['assembly'].items()}})
                            rows+=1
                        label='success' if all(t['target']==t['prediction'] for t in trace) else 'failure'
                        key=condition+'_'+label
                        if key not in examples:
                            examples[key]={'seed':seed,'case':ix,'block':int(blocks[ix]),'tasks':tasks,'queries':trace}
                print(split,seed,condition,'rows',rows,'seconds',round(time.perf_counter()-started,2),flush=True)
    except TimeoutError as exc:
        np.savez_compressed(folder/'incomplete-predictions.npz',meta=meta[:rows],prob=prob[:rows],counts=cnt[:rows],actions=act[:rows],assembly=asm[:rows],cache=cache[:rows])
        save(folder/'INCOMPLETE.json',{'complete':False,'rows':rows,'error':str(exc),'seconds':time.perf_counter()-started})
        raise
    finally:
        training.close()
    if rows!=total:
        raise ValueError('Unexpected row count')
    np.savez_compressed(folder/'predictions.npz',meta=meta,prob=prob,counts=cnt,actions=act,assembly=asm,cache=cache)
    np.savez_compressed(folder/'cases.npz',**cases)
    cells=[]
    for si,seed in enumerate(cfg['seeds']):
        for ci,condition in enumerate(CONDITIONS):
            for stage in range(3):
                for task in range(8):
                    keep=(meta[:,0]==si)&(meta[:,1]==ci)&(meta[:,5]==stage)&(meta[:,6]==task)
                    if not keep.any():continue
                    selected=meta[keep];pp=prob[keep];target=selected[:,7]
                    cells.append({'seed':seed,'condition':condition,'stage':stage,'task':task,'n':int(keep.sum()),
                        'accuracy':float(np.mean(selected[:,8]==target)),
                        'nll':float(-np.log(pp[np.arange(len(target)),target]).mean()),
                        **{k:float(cnt[keep,j].mean()) for j,k in enumerate(COUNTS)}})
    save(folder/'EXAMPLES.json',examples)
    save(folder/'RESULT.json',{'complete':True,'split':split,'rows':rows,'source_hashes':receipt['source_hashes'],
        'frozen_sha256':sha(ROOT/'fit-01/FROZEN.json'),'seconds':time.perf_counter()-started,
        'conditions':list(CONDITIONS),'meta_columns':['seed_index','condition_index','case','block','second_task','stage','task','target','prediction'],
        'count_columns':list(COUNTS),'cells':cells,
        'files':{n:{'sha256':sha(folder/n),'bytes':(folder/n).stat().st_size} for n in ('predictions.npz','cases.npz','EXAMPLES.json')},
        'scope':'Authored symbolic-family evaluation; repeated cases are not independent observations; not neural or biological validation.'})
    print('Complete',split,rows,round(time.perf_counter()-started,3))


if __name__=='__main__':
    if len(sys.argv)!=3 or sys.argv[2] not in ('development','heldout'):
        raise SystemExit('Use new-folder-name development|heldout')
    if '/' in sys.argv[1] or '\\' in sys.argv[1] or ':' in sys.argv[1] or sys.argv[1] in ('.','..'):
        raise SystemExit('Folder must be one local name')
    run(sys.argv[1],sys.argv[2])
