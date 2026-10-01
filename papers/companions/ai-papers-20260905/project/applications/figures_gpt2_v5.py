"""Data-derived plots, not invented model measurements."""
import os
os.environ["OPENBLAS_NUM_THREADS"]="1"
from pathlib import Path
import csv
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/"reviews/gpt2-receiver-05/figures"
OUT.mkdir(exist_ok=False)
with (ROOT/"results/gpt2-receiver-05/metrics.csv").open(newline="") as stream:
    data={row["arm"]:row for row in csv.DictReader(stream) if row["split"]=="heldout"}
arms=["clean","corrupt","donor_r7","donor_r8","donor_a9","unrelated_norm","permuted_norm","wrong_address","inverse_norm","cache_restore"]
labels=["Clean context","Changed giver","Block 7 donor","Block 8 donor","Attention 9 donor","Unrelated direction*","Permuted direction*","Wrong position*","Inverse direction*","Restored cache"]
colors=["#687783","#a64944","#5680a2","#26755a","#5680a2","#8895a0","#8895a0","#8895a0","#8895a0","#687783"]
plt.rcParams.update({"font.family":"DejaVu Sans","font.size":10})
fig,(left,right)=plt.subplots(1,2,figsize=(12.7,5.5),gridspec_kw={"width_ratios":[1,1.05]})
y=list(range(len(arms)))
left.barh(y,[float(data[a]["mean_contrast"]) for a in arms],color=colors)
left.axvline(0,color="black",linewidth=.8)
left.set_yticks(y,labels);left.invert_yaxis()
left.set_xlabel("Mean target − other-name logit")
left.set_title("Pairwise preference changes")
success=[int(data[a]["target_top1"]) for a in arms]
wrong=[int(data[a]["alternative_top1"]) for a in arms]
invalid=[int(data[a]["invalid_top1"]) for a in arms]
right.barh(y,success,color="#26755a",label="Correct name")
right.barh(y,wrong,left=success,color="#a64944",label="Other name")
right.barh(y,invalid,left=[a+b for a,b in zip(success,wrong)],color="#c9cdd0",label="Other vocabulary token")
for i,n in enumerate(success):
    if n:right.text(n/2,i,str(n),ha="center",va="center",color="white",fontweight="bold")
right.set_yticks(y,[]);right.invert_yaxis();right.set_xlim(0,16)
right.set_xticks([0,4,8,12,16]);right.set_xlabel("Cases: unrestricted next token")
right.set_title("A favorable contrast is not task completion")
right.legend(loc="upper center",bbox_to_anchor=(.5,-.16),ncol=1,frameon=False,fontsize=9)
fig.suptitle("Quantized GPT-2 • 8 held-out families / 16 paired cases • one checkpoint",fontsize=13)
fig.text(.03,.015,"*Same perturbation norm as the block 8 donor; some controls are deliberately off-manifold. No feedback learning in this assay.",fontsize=9)
fig.subplots_adjust(left=.19,right=.98,top=.89,bottom=.25,wspace=.18)
for suffix in ("png","svg"):fig.savefig(OUT/("gpt2-receiver-results."+suffix),dpi=160)
plt.close(fig)

fig,ax=plt.subplots(figsize=(12.7,4.7));ax.set_xlim(0,13);ax.set_ylim(0,5);ax.axis("off")
boxes=[(1.4,3.5,"Public synthetic prompt\nFixed tokenizer + weights"),
       (4.6,3.5,"Prefix KV cache\n12 layers; saved or reset"),
       (8.0,3.5,"Last-token receiver\nblock 7 / block 8 / attention 9"),
       (11.3,3.5,"50,257 native logits\nUnrestricted top token"),
       (8.0,1.3,"Natural or controlled donor\nNamed tensor, norm, position"),
       (11.3,1.3,"Virtual action monitor\nSigned scope + revision")]
for x,y,label in boxes:
    ax.text(x,y,label,ha="center",va="center",fontsize=10,
            bbox=dict(boxstyle="round,pad=.65",facecolor="#f1f4f5",edgecolor="#394f5f"))
for a,b in [((2.55,3.5),(3.32,3.5)),((5.89,3.5),(6.51,3.5)),((9.57,3.5),(10.05,3.5)),
            ((8,1.86),(8,2.94)),((11.3,2.94),(11.3,1.86))]:
    ax.annotate("",xy=b,xytext=a,arrowprops=dict(arrowstyle="->",color="#394f5f",lw=1.4))
ax.text(3.8,1.25,"Causal readout: native logits and behavior\nAuthority readout: actual accepted/rejected virtual actions\nLearning, human oversight and DeepSeek transfer: not tested",ha="center",va="center",fontsize=10)
ax.set_title("Executed GPT-2 intervention and authority boundary",fontsize=14,pad=5)
fig.tight_layout()
for suffix in ("png","svg"):fig.savefig(OUT/("gpt2-system-context."+suffix),dpi=160)
plt.close(fig)
print("Four figure files generated from the frozen assay and named runtime routes.")
