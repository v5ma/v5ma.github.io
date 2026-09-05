"""Render an audited result figure; does not edit any prior image or manuscript."""
from qwen35_adapter_v9 import ROOT, sha, write
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

review=ROOT/'reviews/qwen35-learning-10'
out=ROOT/'figures/qwen35-learning-10'
out.mkdir()
metrics=json.loads((review/'METRICS.json').read_text())
groups=json.loads((review/'GROUPS.json').read_text())
arms=['original','linear_ridge','rbf_ridge','yoked_ridge','slot_swap','oracle_kv','full_donor','text_instruction']
labels=['Original','Learned linear','Learned RBF','Scrambled training','Role-row swap','KV donor (oracle)','Full donor (oracle)','Text correction']
colors=['#7b8794','#225ea8','#41b6c4','#b35806','#7b8794','#624b91','#624b91','#4d7358']
fig,axes=plt.subplots(3,1,figsize=(8.5,11),dpi=160)
fig.subplots_adjust(left=0.27,right=0.93,top=0.86,bottom=0.10,hspace=0.50)
fig.text(0.06,0.965,'Learning a state change is not yet learning a role change',fontsize=16,weight='bold',va='top')
fig.text(0.06,0.923,'Qwen3.5-0.8B q4 native hybrid text model | 24 training and 16 held-out stories\nSame paired training information for linear, RBF and scrambled-label fits',fontsize=10.5,va='top')
values=[
    [sum(m['swapped_correct'] for m in metrics if m['arm']==a and m['query'] in ('giver','recipient')) for a in arms],
    [next(m['swapped_correct'] for m in metrics if m['arm']==a and m['query']=='color') for a in arms],
    [sum(g['all_six_swapped'] for g in groups if g['arm']==a) for a in arms]]
titles=['Requested role answers correct','Unrelated color preserved','Complete bidirectional role-and-color groups']
totals=[32,16,8]
for ax,counts,title,total in zip(axes,values,titles,totals):
    positions=list(range(len(arms)))
    ax.barh(positions,counts,color=colors,height=0.7)
    ax.set_yticks(positions,labels,fontsize=10)
    ax.invert_yaxis(); ax.set_xlim(0,total*1.12)
    ax.set_xticks([0,total//2,total]); ax.set_title(title,loc='left',fontsize=12,pad=9)
    for position,value in enumerate(counts):
        ax.text(value+total*0.015,position,f'{value}/{total}',va='center',fontsize=10)
    ax.spines[['top','right']].set_visible(False)
    ax.set_axisbelow(True); ax.grid(axis='x',color='#dddddd',linewidth=0.5)
fig.text(0.06,0.053,'All fixed cases retained; case-folded complete-answer scoring was declared before testing.\nOracle controls receive corrected test states; other methods do not. Eight crossed synthetic groups\nare not independent population replications. Separate-code author audit, not independent review.',fontsize=9.5,va='top')
path=out/'learned-repair-results.png'
fig.savefig(path,dpi=160,facecolor='white'); plt.close(fig)
write(out/'GENERATION-RECEIPT.json',{'status':'RENDERED_AWAITING_SCREEN_REVIEW',
    'generator_sha256':sha(__file__),'source_metrics_sha256':sha(review/'METRICS.json'),
    'source_groups_sha256':sha(review/'GROUPS.json'),'image_sha256':sha(path),
    'pixels':[1360,1760],'new_pdf':False,'all_page_review':False})
print(str(path))
