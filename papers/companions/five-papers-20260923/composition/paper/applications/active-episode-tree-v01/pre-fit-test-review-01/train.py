"""One bounded sequential training run, frozen before evaluation generation."""
from common import ROOT,SOURCES,FAMILIES,CLASSES,config,sha,save,read,low_priority,np,views
from world import generate,targets
from tree import train
import time


def main():
    low_priority();cfg=config();tests=read(ROOT/'TESTS-01.json')
    hashes={n:sha(ROOT/n) for n in SOURCES}
    if tests['passed']!=tests['total'] or tests['source_hashes']!=hashes:
        raise ValueError('Source/test mismatch')
    folder=ROOT/'fit-01';folder.mkdir(exist_ok=False)
    save(folder/'BEFORE.json',{'source_hashes':hashes,'tests_sha256':sha(ROOT/'TESTS-01.json'),
        'evaluation_generated':False,'stage':'before fitting'})
    started=time.perf_counter();all_models=[];data={}
    for seed in cfg['seeds']:
        x,blocks,codes=generate(seed,'training',cfg['blocks']['training']);y=targets(x)
        for t,nclass in enumerate(CLASSES):
            if set(y[:,t])!=set(range(nclass)):
                raise ValueError('Training class missing: '+str((seed,t)))
        data[f's{seed}_x']=x;data[f's{seed}_blocks']=blocks;data[f's{seed}_codes']=codes;data[f's{seed}_y']=y
        feature=views(x)
        for family in FAMILIES:
            fit_start=time.perf_counter();deadline=min(fit_start+cfg['fit_deadline_seconds'],started+cfg['training_deadline_seconds'])
            trees=[];work=[]
            try:
                for task,nclass in enumerate(CLASSES):
                    tree,stats=train(feature,y[:,task],nclass,family,cfg,deadline);trees.append(tree);work.append(stats)
            except TimeoutError as exc:
                save(folder/f'INCOMPLETE-s{seed}-{family}.json',{'complete':False,'error':str(exc),'completed_trees':trees,'work':work,'source_hashes':hashes})
                save(folder/'STATUS.json',{'complete':False,'completed_model_files':all_models,'seconds':time.perf_counter()-started})
                raise
            path=folder/f's{seed}-{family}.json'
            save(path,{'seed':seed,'family':family,'trees':trees,'work':work,'seconds':time.perf_counter()-fit_start,'supervision':'complete training episode and label; partial evidence at deployment'})
            all_models.append({'seed':seed,'family':family,'name':path.name,'sha256':sha(path)})
            print('Frozen',seed,family,'seconds',round(time.perf_counter()-fit_start,3),flush=True)
    np.savez_compressed(folder/'training-data.npz',**data)
    save(folder/'FROZEN.json',{'complete':True,'source_hashes':hashes,'models':all_models,
        'training_data_sha256':sha(folder/'training-data.npz'),'seconds':time.perf_counter()-started,
        'evaluation_generated':False,'scope':'Twelve model families, each with eight supervised query trees; not neural or biological fits.'})


if __name__=='__main__':
    main()
