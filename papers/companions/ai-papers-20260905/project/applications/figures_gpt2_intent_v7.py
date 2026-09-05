"""Plot exact audited counts, not an image-generated approximation."""
import csv
import hashlib
import json
import os
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
os.environ.setdefault('MPLCONFIGDIR',str(ROOT/'runtime-cache/matplotlib'))
os.environ.setdefault('OMP_NUM_THREADS','1')
os.environ.setdefault('OPENBLAS_NUM_THREADS','1')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

SOURCE=ROOT/'reviews/gpt2-intent-07'
OUT=ROOT/'figures/gpt2-intent-07'
OUT.mkdir(parents=True,exist_ok=False)
def read(name):
    with (SOURCE/name).open(newline='',encoding='utf-8') as stream:return list(csv.DictReader(stream))
def sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()
metrics=read('METRICS.csv'); summary=read('ARM-SUMMARY.csv')
labels=['No edit','Internal feedback*','Task feedback*','Yoked feedback*','Supervised ridge*',
        'Subspace reflection','Capped reflection','Intent-blind reflection','Wrong-intent reflection',
        'Current donor oracle†','Textual update†','Revoked reflection']
arms=[r['arm'] for r in summary]; y=np.arange(len(arms))
counts=lambda query:[int(next(r for r in metrics if r['arm']==a and r['intent']=='swap' and r['query']==query)['correct']) for a in arms]
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':10})
fig,axes=plt.subplots(1,3,figsize=(15,8.4),gridspec_kw={'width_ratios':[1.3,1.05,1.]})
fig.subplots_adjust(left=.185,right=.975,bottom=.22,top=.82,wspace=.32)
blue='#2365A4'; orange='#A65A00'; grey='#73808C'; green='#23704F'
series=[[(counts('recipient'),-.17,blue,'Recipient: swap'),(counts('color'),.17,orange,'Color: unchanged target')],
        [([int(r['both_roles_keep']) for r in summary],-.17,grey,'Keep cue'),([int(r['both_roles_swap']) for r in summary],.17,blue,'Swap cue')],
        [([int(r['full_contract']) for r in summary],0.,green,'All eight outcomes correct')]]
titles=['Individual native answers\n32 cases per query', 'Both opposite roles correct\n16 family–color pairs per cue',
        'Complete intent/selectivity test\n16 family–color groups']
for n,(ax,parts) in enumerate(zip(axes,series)):
    for values,offset,color,label in parts:
        ax.barh(y+offset,values,height=.28 if len(parts)>1 else .5,color=color,label=label)
        for yy,value in zip(y+offset,values):
            ax.text(value+.25,yy,str(value),ha='left',va='center',fontsize=9,color=color)
    ax.set_yticks(y,labels if n==0 else [])
    ax.set_ylim(-.6,len(arms)-.4);ax.invert_yaxis()
    ax.set_xlim(0,35 if n==0 else 17.6)
    ax.set_xticks([0,8,16,24,32] if n==0 else [0,4,8,12,16])
    ax.set_title(titles[n],fontsize=11,pad=15)
    ax.grid(axis='x',alpha=.2);ax.set_axisbelow(True)
    ax.spines[['top','right']].set_visible(False)
    ax.legend(loc='upper center',bbox_to_anchor=(.5,-.07),frameon=False,fontsize=9,ncol=1)
fig.suptitle('A reversible edit is not a reliable role swap',fontsize=17,x=.56,y=.956)
fig.text(.185,.90,'GPT-2: one frozen quantized checkpoint · eight new constructed families · no new fitting',fontsize=11)
fig.text(.055,.065,
    '* Frozen Draft 6 correction matrices. Keep is an engineered no-op except in the deliberately intent-blind/wrong-intent controls.\n'
    '† Richer-information controls, not equal-access competitors. Textual update reuses executed opposite-role prompts.\n'
    'Complete test requires both cues, both giver roles and both queries to be correct. Reused readouts are paired observations, not independent trials.',
    fontsize=9,linespacing=1.6)
png=OUT/'intent-role-color-results.png'
fig.savefig(png,dpi=150,facecolor='white');plt.close(fig)
receipt={'status':'GENERATED_NOT_YET_VISUALLY_REVIEWED','figure_sha256':sha(png),
    'source_sha256':{name:sha(SOURCE/name) for name in ('METRICS.csv','ARM-SUMMARY.csv')},
    'generator_sha256':sha(Path(__file__)),'dimensions_pixels':[2250,1260],
    'counts_from_audited_data':True,'independent_review':False,'visually_reviewed':False}
(OUT/'GENERATION-RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8')
print(json.dumps(receipt,indent=2))
