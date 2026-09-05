"""Compact, data-bound persistence and baseline-adequacy figure."""
import csv
import hashlib
import json
import os
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
os.environ['OMP_NUM_THREADS']='1';os.environ['OPENBLAS_NUM_THREADS']='1'
os.environ['MPLCONFIGDIR']=str(ROOT/'runtime-cache/matplotlib')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
SOURCE=ROOT/'reviews/gpt2-continuation-08';OUT=ROOT/'figures/gpt2-continuation-08'
OUT.mkdir(parents=True,exist_ok=False)
with (SOURCE/'METRICS.csv').open(newline='',encoding='utf-8') as stream:rows=list(csv.DictReader(stream))
def metric(arm,query,key):return float(next(r for r in rows if r['arm']==arm and r['query']==query)[key])
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':11})
fig,axes=plt.subplots(2,1,figsize=(8.3,8.9));fig.subplots_adjust(left=.14,right=.96,bottom=.18,top=.87,hspace=.56)
x=np.arange(3);arms=['internal','internal_restore_upper','internal_restore_lower']
for shift,query,color,label in [(-.18,'later_giver','#286CA6','Giver follow-up'),(.18,'later_color','#A65A00','Color follow-up')]:
    values=[metric(arm,query,'mean_max_logit_change_vs_unedited') for arm in arms]
    axes[0].bar(x+shift,values,width=.33,color=color,label=label)
    for xx,value in zip(x+shift,values):axes[0].text(xx,value+.018,f'{value:.3f}',ha='center',fontsize=10)
axes[0].set_xticks(x,['Carry edited cache','Restore layers 9–11','Restore layers 0–8'])
axes[0].set_ylabel('Mean maximum logit change')
axes[0].set_ylim(0,.77);axes[0].set_title('A. Cache-carried effects and selective restoration',fontsize=12)
axes[0].legend(loc='upper right',frameon=False,fontsize=10)
values=[metric('no_edit',q,'original_correct') for q in ('initial_recipient','later_giver','later_color')]
axes[1].bar(x,values,width=.57,color=['#738493','#A84538','#738493'])
axes[1].set_xticks(x,['Initial recipient','Later giver','Later color']);axes[1].set_ylim(0,36)
axes[1].set_ylabel('Correct original fact / 32')
axes[1].set_title('B. Baseline competence limits semantic interpretation',fontsize=12)
for xx,value in zip(x,values):axes[1].text(xx,value+.8,str(int(value)),ha='center')
axes[1].text(1,9,'No correct natural-giver answer:\nnot an intervention-specific\nfailure test',ha='center',va='center',fontsize=10,color='#A84538')
for ax in axes:ax.spines[['top','right']].set_visible(False);ax.grid(axis='y',alpha=.18);ax.set_axisbelow(True)
fig.suptitle('Persistent influence is not demonstrated semantic control',fontsize=14,y=.97)
fig.text(.08,.085,'One frozen quantized GPT-2 checkpoint; 32 previously exposed root prompts in eight families.\n'
    'Both fixed-text continuations fork from the retained root cache; no generated name is fed back.\n'
    'Panel A measures numerical influence, not correctness. No new training or independent review.',fontsize=10,linespacing=1.5)
png=OUT/'cache-persistence-and-baseline.png';fig.savefig(png,dpi=180,facecolor='white');plt.close(fig)
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
receipt={'status':'GENERATED_PENDING_SCREEN_REVIEW','figure_sha256':sha(png),'source_sha256':sha(SOURCE/'METRICS.csv'),
    'generator_sha256':sha(Path(__file__)),'pixels':[1494,1602],'screen_reviewed':False,'pdf_accepted':False}
(OUT/'GENERATION-RECEIPT.json').write_text(json.dumps(receipt,indent=2)+'\n',encoding='utf-8');print(json.dumps(receipt,indent=2))
