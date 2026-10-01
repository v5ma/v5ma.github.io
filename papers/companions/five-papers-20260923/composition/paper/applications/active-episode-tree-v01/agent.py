"""Observed-only episodic agent. No environment generator or target imports."""
from common import np,level,width
from tree import feature,predict


def permute(assembly):
    mapping={0:1,1:0,6:7,7:6}
    return {mapping.get(k,k):v for k,v in assembly.items()}


class Agent:
    def __init__(self,models,condition):
        self.models=models;self.condition=condition;self.scene=0
        self.reference={};self.current={}

    def switch(self):
        self.reference=dict(self.current);self.current={};self.scene=1
        if self.condition=='reset_reference':
            self.reference={}

    def query(self,task,observe):
        node=self.models[task];assembly={};actions=[]
        counts={'sampling_bits':0,'samples':0,'retrievals':0,'unavailable':0,'policy_nodes':0}
        def request(fid):
            idx=fid//2;lev=level(fid)
            if feature(fid,assembly) is not None:
                return True
            old=idx<6 and self.scene==1
            cache=self.reference if old else self.current
            physical=idx%6;entry=cache.get(physical)
            if entry is not None and entry[0]>=lev:
                value=entry[1]//2 if entry[0]==2 and lev==1 else entry[1]
                source=1;counts['retrievals']+=1
            elif old or (self.scene==1 and self.condition=='no_new_samples'):
                actions.append((fid,2,-1));counts['unavailable']+=1
                return False
            else:
                value=int(observe(physical,lev));source=0
                if not 0<=value<2**lev:
                    raise ValueError('Sensor returned invalid category')
                counts['samples']+=1;counts['sampling_bits']+=lev
                cache[physical]=(lev,value)
            entry=(lev,value)
            if idx not in assembly or assembly[idx][0]<lev:
                assembly[idx]=entry
            actions.append((fid,source,value))
            return True
        if self.condition=='full_record':
            for idx in range(12):
                request(2*idx+1)
        while 'features' in node:
            counts['policy_nodes']+=1
            fs=node['features'];ok=True
            for f in fs:
                if not request(f):
                    ok=False;break
            if not ok:
                break
            vals=[feature(f,assembly) for f in fs];key=vals[0]
            for f,v in zip(fs[1:],vals[1:]):
                key=key*width(f)+v
            if str(key) not in node['children']:
                break
            node=node['children'][str(key)]
        original=dict(assembly)
        if self.condition=='coarsen_assembly':
            assembly={k:(1,v//2 if lev==2 else v) for k,(lev,v) in assembly.items()}
        elif self.condition=='permute_binding':
            assembly=permute(assembly)
        elif self.condition=='restore_binding':
            assembly=permute(permute(assembly))
        probability,work=predict(self.models[task],assembly)
        counts.update({'readout_nodes':work,'assembly_variables':len(assembly),
            'assembly_value_bits':sum(v[0] for v in assembly.values()),
            'reference_cache_fields':len(self.reference),'current_cache_fields':len(self.current)})
        return probability,{'actions':actions,'counts':counts,'assembly':assembly,'before_intervention':original,
                            'reference':dict(self.reference),'current':dict(self.current)}
