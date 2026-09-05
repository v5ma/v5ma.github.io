"""Small, data-bound figures with readable labels; never a PDF-format acceptance."""
import os
for key in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[key] = '1'
import hashlib
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'figures/qwen35-hybrid-09'
REVIEW = ROOT / 'reviews/qwen35-hybrid-09'

def sha(path):
    with path.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()

def main():
    assert not OUT.exists()
    OUT.mkdir()
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11,
        'axes.spines.top': False, 'axes.spines.right': False})
    metrics = json.loads((REVIEW / 'METRICS.json').read_text())
    joints = json.loads((REVIEW / 'JOINT-DETAIL.json').read_text())
    order = ['original', 'conv_donor', 'recurrent_donor', 'conv_recurrent_donor', 'kv_donor', 'full_donor']
    labels = ['Original state', 'Convolution donor', 'Recurrent donor', 'Conv. + recurrent donor', 'Attention KV donor', 'Complete donor']
    role = [sum(r['swapped_correct'] for r in metrics if r['arm'] == arm and r['query'] != 'color') for arm in order]
    joint = [sum(r['all_six_swapped'] for r in joints if r['arm'] == arm) for arm in order]
    assert role == [0, 0, 2, 1, 31, 32] and joint == [0, 0, 0, 0, 7, 8]
    fig, axes = plt.subplots(2, 1, figsize=(6.4, 7.2))
    for ax, values, maximum, title in [(axes[0], role, 32, 'A. Individual reversed-role answers'),
                                    (axes[1], joint, 8, 'B. Complete role-and-color groups')]:
        bars = ax.barh(labels, values, color=['#b6b6b6'] * 4 + ['#426c73', '#283d48'])
        ax.invert_yaxis(); ax.set_xlim(0, maximum * 1.16)
        ax.set_xticks([0, maximum / 2, maximum]); ax.set_xlabel('Correct / ' + str(maximum))
        ax.set_title(title, loc='left', fontsize=12, fontweight='bold', pad=12)
        ax.grid(axis='x', alpha=0.18); ax.set_axisbelow(True)
        for bar, value in zip(bars, values):
            ax.text(value + maximum * 0.02, bar.get_y() + bar.get_height()/2,
                f'{value}/{maximum}', va='center', fontsize=11)
    fig.suptitle('Native hybrid-state transfer in Qwen3.5-0.8B', fontsize=13, y=0.985)
    fig.text(0.04, 0.02, 'Unedited adequacy: 48/48. Color: 16/16 in every arm.\n'
        'New synthetic follow-up; four crossed strata. Privileged donors.\n'
        'Case-folded scoring fixed before execution; no population intervals.', fontsize=10.5)
    fig.tight_layout(rect=(0, 0.105, 1, 0.97), h_pad=1.8)
    fig.savefig(OUT / 'hybrid-transfer-results.png', dpi=200)
    plt.close(fig)

    fig, ax = plt.subplots(figsize=(6.4, 8.0))
    ax.set(xlim=(0, 6.4), ylim=(0, 8.0)); ax.axis('off')
    def box(x, y, w, h, text, color='#f4f4f1'):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.03',
            linewidth=1, edgecolor='#3c494d', facecolor=color))
        ax.text(x+w/2, y+h/2, text, ha='center', va='center', fontsize=11)
    def arrow(x1, y1, x2, y2):
        ax.annotate('', xy=(x2,y2), xytext=(x1,y1), arrowprops={'arrowstyle':'->','color':'#333','lw':1.3})
    ax.text(3.2, 7.8, 'One measured text-decoder pathway', ha='center', fontsize=13, fontweight='bold')
    box(0.3, 6.95, 2.7, 0.55, 'Original story prefix')
    box(3.4, 6.95, 2.7, 0.55, 'Reversed-role donor prefix')
    arrow(1.65,6.95,1.65,6.55); arrow(4.75,6.95,4.75,6.55)
    box(0.5,5.8,5.4,0.7,'Pinned native Qwen3.5 text graph\n24 layers: 18 recurrent + 6 attention')
    arrow(3.2,5.8,3.2,5.45)
    box(0.15,4.55,1.9,0.85,'Convolution\nbuffers\n18 tensors')
    box(2.25,4.55,1.9,0.85,'Recurrent\nmemory\n18 tensors')
    box(4.35,4.55,1.9,0.85,'Attention\nkey/value memory\n12 tensors')
    for x in (1.1,3.2,5.3):
        arrow(x,4.55,x,4.15)
    box(0.35,3.45,5.7,0.65,'Six declared tensor-group selections\nOriginal values or complete donor values', '#e3eceb')
    arrow(3.2,3.45,3.2,3.05)
    box(0.35,2.3,5.7,0.7,'Identical question tokens + selected state\nNative decoder → full-vocabulary greedy answer')
    arrow(3.2,2.3,3.2,1.95)
    box(0.35,1.2,5.7,0.7,'Separate trusted-command workflow\nSwap → stop → KV restore → complete restore')
    ax.plot([0.35,0.09,0.09],[1.55,1.55,3.775],color='#333',lw=1.1)
    arrow(0.09,3.775,0.35,3.775)
    ax.text(3.2,0.55,'All three questions fork from the same selected root.\n'
        'Fresh inference follows each accepted command.\n'
        'Forgery/replay rejection is supplied, not learned.',ha='center',va='center',fontsize=10.5)
    fig.subplots_adjust(left=0.01,right=0.99,top=0.99,bottom=0.01)
    fig.savefig(OUT / 'hybrid-state-architecture.png', dpi=200)
    plt.close(fig)
    receipt = {'status':'GENERATED_PENDING_VISUAL_INSPECTION', 'script_sha256':sha(Path(__file__)),
        'sources': {str(p.relative_to(ROOT)):sha(p) for p in [REVIEW/'METRICS.json', REVIEW/'JOINT-DETAIL.json']},
        'files':{p.name:{'bytes':p.stat().st_size,'sha256':sha(p)} for p in OUT.iterdir() if p.is_file()},
        'pdf_layout_validated':False}
    with (OUT/'GENERATION-RECEIPT.json').open('x',encoding='utf-8') as out:
        json.dump(receipt,out,indent=2);out.write('\n')
    print(json.dumps(receipt,indent=2))

if __name__ == '__main__':
    main()
