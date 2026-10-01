"""Plot saved numbers; no fitting, uncertainty simulation or model execution."""
import os
for k in ("OMP_NUM_THREADS","OPENBLAS_NUM_THREADS","MKL_NUM_THREADS"):
    os.environ[k]="1"
import ctypes
import hashlib
import json
import math
from pathlib import Path
import sys
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D
import numpy as np

if os.name=="nt":
    ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(),0x4000)
ROOT=Path(__file__).resolve().parents[1]
APP=ROOT/"application/memory-component-v0"
result=APP/sys.argv[1]
out=APP/sys.argv[2]
assert out.parent==APP and out.name.startswith("figures-")
out.mkdir(exist_ok=False)
runs=json.loads((result/"RUNS.json").read_text())
data=json.loads((APP/"inputs/observations.json").read_text())
metrics=json.loads((result/"METRICS.json").read_text())
colors=["#126b82","#ae4c17"]
labels=["Pre","3 bouts","6 bouts","1 h","3 h","24 h"]
titles=["DAN γ1pedc","DAN α′2α2","DAN α3","MBON γ1pedc→α/β","MBON α2sc","MBON α3"]
plt.rcParams.update({"font.family":"DejaVu Sans","font.size":11,"axes.spines.top":False,"axes.spines.right":False})
files=[]
for context,name in enumerate(("attractive-odours","repulsive-odours")):
    fig,axes=plt.subplots(2,3,figsize=(14,8))
    for cell,ax in enumerate(axes.flat):
        for odor in range(2):
            rows=sorted((r for r in data["records"] if r["context"]==context and r["cell"]==cell and r["odor"]==odor),key=lambda r:r["time"])
            measured=np.array([r["mean"] if r["mean"] is not None else np.nan for r in rows])
            errors=np.array([r["sem"] if r["sem"] is not None else np.nan for r in rows])
            ax.errorbar(range(6),measured,yerr=errors,fmt="o",markersize=4,capsize=3,color=colors[odor],zorder=4)
            for protocol,style in (("fitting_script",":"),("figure_5c_script","--")):
                run=next(r for r in runs if r["modules"]==3 and r["context"]==context and r["protocol"]==protocol and r["intervention"]=="none")
                ax.plot(range(6),np.array(run["responses"])[cell,odor],style,color=colors[odor],linewidth=1.7)
        ax.axhline(0,color="#a6a6a6",linewidth=.7,zorder=0)
        ax.set_title(titles[cell])
        ax.set_xticks(range(6),labels,rotation=20)
        ax.set_ylabel("Evoked rate change (Hz)")
        ax.grid(axis="y",alpha=.15)
    caption="ACV / ethyl acetate" if context==0 else "octanol / benzaldehyde"
    fig.suptitle("Published fly-memory component: "+caption,fontsize=17,y=.98)
    legend=[Line2D([0],[0],color=colors[0],marker="o",linestyle="",label="CS+ measured mean ± SEM"),
            Line2D([0],[0],color=colors[1],marker="o",linestyle="",label="CS− measured mean ± SEM"),
            Line2D([0],[0],color="#303030",linestyle=":",label="Saved parameters / fitting schedule"),
            Line2D([0],[0],color="#303030",linestyle="--",label="Saved parameters / figure schedule")]
    fig.legend(handles=legend,ncol=2,loc="lower center",bbox_to_anchor=(.5,.04),frameon=False)
    fig.text(.5,.015,"Training-summary replay, not new experiments. Missing observations are omitted. Stages are not equally spaced time.",ha="center",fontsize=10)
    fig.subplots_adjust(top=.90,bottom=.20,hspace=.45,wspace=.31)
    for suffix in ("png","svg"):
        path=out/(name+"."+suffix)
        fig.savefig(path,dpi=145,facecolor="white",metadata={"Creator":"SAN paper local component audit"} if suffix=="svg" else None)
        files.append(path)
    plt.close(fig)
items=[("fitting_script","none","Fitting\nschedule"),("figure_5c_script","none","Figure\nschedule"),
       ("figure_5c_script","plasticity_zero","Plasticity\nremoved"),
       ("figure_5c_script","gamma_to_DAN_removed","γ1-to-DAN\nremoved"),
       ("figure_5c_script","rescue","Feedback\nrestored")]
values=[]
for protocol,control,_ in items:
    entries=[m for m in metrics if m["modules"]==3 and m["protocol"]==protocol and m["intervention"]==control]
    values.append(math.sqrt(sum(m["weightedSquaredError"] for m in entries)/sum(m["count"] for m in entries)))
fig,ax=plt.subplots(figsize=(10,5.4))
bars=ax.bar(range(5),values,color=["#627e89","#126b82","#a4553a","#a4553a","#126b82"],width=.63)
for bar,v in zip(bars,values):
    ax.text(bar.get_x()+bar.get_width()/2,v+.06,f"{v:.3f}",ha="center")
ax.set_ylim(0,max(values)*1.23)
ax.set_xticks(range(5),[item[2] for item in items])
ax.set_ylabel("SEM-standardized residual RMS")
ax.set_title("No-refit checks on 86 published response summaries",pad=15)
ax.grid(axis="y",alpha=.15)
ax.set_axisbelow(True)
fig.text(.5,.04,"Smaller means closer to the training summaries. Local interventions, not new biological evidence.\nNo significance test or simulation confidence interval is implied.",ha="center",fontsize=10)
fig.subplots_adjust(bottom=.25,top=.88,left=.1,right=.97)
for suffix in ("png","svg"):
    path=out/("training-replay-controls."+suffix)
    fig.savefig(path,dpi=145,facecolor="white",metadata={"Creator":"SAN paper local component audit"} if suffix=="svg" else None)
    files.append(path)
plt.close(fig)
manifest={"sourceExecution":str(result/"EXECUTION.json"),"sourceExecutionSha256":hashlib.sha256((result/"EXECUTION.json").read_bytes()).hexdigest(),
          "scriptSha256":hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          "files":[{"name":p.name,"sha256":hashlib.sha256(p.read_bytes()).hexdigest(),"bytes":p.stat().st_size} for p in files],"visualReview":"pending"}
with (out/"FIGURE-MANIFEST.json").open("x",encoding="utf-8") as stream:
    json.dump(manifest,stream,indent=2)
print(json.dumps({"figures":len(files),"source":"saved replay only"}))
