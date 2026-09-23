"""Small source-bound charts and a software-context diagram, not a PDF renderer."""
import os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'application/observable-receiver-v0'
os.environ['MPLCONFIGDIR'] = str(APP / 'figure-cache')
for key in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ[key] = '1'
import hashlib
import json
import time
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
from run_phase_receiver_case import low_priority


def sha(p):
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main():
    start = time.perf_counter(); priority = low_priority()
    out = APP / 'figures-02'; out.mkdir(exist_ok=False)
    src = APP / 'checks-01/RESULTS.json'
    rows = json.loads(src.read_text('utf-8'))['summary']
    labels = ['Prior-state reference', 'Direct learned reference', 'Current output only',
              'Output-history observer', 'Unknown initial state', 'Assumed time constant ×1.5']
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11, 'axes.spines.top': False, 'axes.spines.right': False})
    fig, axes = plt.subplots(1, 3, figsize=(15.8, 6.8), gridspec_kw={'width_ratios': [1.7, 1., 1.2]})
    fig.subplots_adjust(left=.19, right=.985, top=.79, bottom=.30, wspace=.29)
    y = list(range(6)); ax = axes[0]
    left = [0] * 6
    for field, color, name in [('observed', '#467fa4', 'Current + history supported'), ('inferred', '#d4a04c', 'Inferred only'), ('unresolved', '#dfe3e8', 'Unresolved')]:
        vals = [r[field] for r in rows]
        ax.barh(y, vals, left=left, height=.62, color=color, label=name)
        left = [a + b for a, b in zip(left, vals)]
    ax.set_yticks(y, labels); ax.invert_yaxis(); ax.set_xlim(0, 600)
    ax.set_xlabel('Decision steps (576 per condition)'); ax.set_title('Reported relation status')
    handles, names = ax.get_legend_handles_labels()
    fig.legend(handles, names, loc='lower left', bbox_to_anchor=(.025, .155), fontsize=10, ncol=3, frameon=False)
    ax = axes[1]
    values = [r['bindingErrors'] for r in rows]
    ax.barh(y, values, color=['#cf604c' if n > 8 else '#aa8560' for n in values], height=.62)
    for i, v in enumerate(values): ax.text(v + 3, i, str(v), va='center', fontsize=10)
    ax.set_yticks(y, []); ax.invert_yaxis(); ax.set_xlim(0, 245)
    ax.set_xlabel('Wrong-target steps'); ax.set_title('Binding errors')
    ax = axes[2]
    values = [r['meanFinalStandoffError'] for r in rows]
    ax.barh(y, values, color='#6e7279', height=.62)
    for i, v in enumerate(values): ax.text(v + .045, i, f'{v:.3f}', va='center', fontsize=10)
    ax.set_yticks(y, []); ax.invert_yaxis(); ax.set_xlim(0, 3.8)
    ax.set_xlabel('Engineered position units'); ax.set_title('Mean final standoff error')
    fig.suptitle('Observable receiving: all six planned conditions', fontsize=18, y=.96)
    fig.text(.19, .865, '144 development episodes • 3,456 saved steps • No animal data or held-out evaluation', fontsize=11)
    fig.text(.03, .035, '“Supported” is the controller’s status, not ground-truth correctness. Current-output-only has 194 supported + 12 inferred errors.\nMatched history reproduces every reference action. Unknown initialization has a lower final error here; that is not a general benefit.\nThe time-constant mismatch changes decoded inputs but no action. These are deterministic engineering results, not biological error bars.', fontsize=10, linespacing=1.45)
    fig.savefig(out / 'OUTPUT-ACCESS-RESULTS.png', dpi=145, facecolor='white'); plt.close(fig)
    fig, ax = plt.subplots(figsize=(15.8, 8.1))
    ax.set_xlim(0, 16); ax.set_ylim(0, 9); ax.axis('off')

    def box(x, y, w, h, title, body, color):
        ax.add_patch(FancyBboxPatch((x, y), w, h, boxstyle='round,pad=0.08,rounding_size=.13', linewidth=1.2, edgecolor='#414850', facecolor=color))
        ax.text(x + w / 2, y + h - .34, title, ha='center', va='center', fontsize=12, weight='bold')
        ax.text(x + w / 2, y + h / 2 - .25, body, ha='center', va='center', fontsize=10.5, linespacing=1.35)

    def arrow(a, b, color='#384654'):
        ax.add_patch(FancyArrowPatch(a, b, arrowstyle='-|>', mutation_scale=18, linewidth=1.8, color=color))

    ax.text(.4, 8.55, 'Separate physical receiving from the decision interface', fontsize=19, weight='bold')
    ax.text(.4, 8.05, 'Synthetic software architecture • Known coefficients and continuous, noiseless terminal outputs are assumptions', fontsize=11)
    box(.4, 5.4, 3.1, 1.65, 'Virtual environment', 'Surface / view / body state\nSupplies engineered drives', '#f0f1f2')
    box(4.65, 5.4, 3.1, 1.65, 'Physical frontend', 'Persistent four-output +\none pooled-state banks', '#e9edf2')
    box(9.25, 5.4, 6.2, 1.65, 'Output-only controller', 'Current outputs + instrument fields\nOwn history estimate OR current-only readout', '#dcecf4')
    arrow((3.55, 6.22), (4.55, 6.22)); ax.text(4.05, 6.53, 'drive q', ha='center', fontsize=10)
    arrow((7.85, 6.22), (9.15, 6.22)); ax.text(8.5, 6.53, 'outputs p', ha='center', fontsize=10)
    ax.text(8.55, 4.77, 'No physical latent state or raw drive crosses this boundary', ha='center', fontsize=11, color='#9a342b')
    box(9.25, 2.75, 6.2, 1.25, 'Learned relation → query and movement', 'Cross-view prototypes remain frozen; new evidence updates tracks', '#e8f0e8')
    arrow((12.4, 5.28), (12.4, 4.12))
    box(.4, 2.75, 3.1, 1.25, 'Actual action / return', 'Apply view request and move', '#f3ecde')
    arrow((9.12, 3.37), (3.62, 3.37)); ax.text(6.35, 3.67, 'Selected view and movement', ha='center', fontsize=11)
    arrow((1.95, 4.12), (1.95, 5.28)); ax.text(.48, 4.68, 'Changes next input', fontsize=10)
    ax.plot([1.95, 1.95, 12.4], [2.62, 1.65, 1.65], color='#906d29', linewidth=1.8)
    arrow((12.4, 1.65), (12.4, 2.63), '#906d29')
    ax.text(7.8, 1.97, 'Measured movement updates relation and gain calibration', ha='center', fontsize=11, color='#70551f')
    ax.text(.4, .85, 'Evaluator-only trace: true drives and pooled state are saved for error checks, never fed back into decisions.\nPrior-state and direct references retain their separate privileged interfaces. This diagram describes only the four output-only cases.', fontsize=10.5, linespacing=1.45)
    fig.subplots_adjust(left=.02, right=.98, top=.99, bottom=.01)
    fig.savefig(out / 'OUTPUT-BOUNDARY.png', dpi=145, facecolor='white'); plt.close(fig)
    receipt = dict(sourceSha256=sha(src), builderSha256=sha(Path(__file__)),
                   files={n: sha(out / n) for n in ('OUTPUT-ACCESS-RESULTS.png', 'OUTPUT-BOUNDARY.png')},
                   seconds=time.perf_counter() - start, priority=priority,
                   visualInspection='Pending separate human-visible image readback; generation is not inspection')
    with (out / 'BUILD.json').open('x', encoding='utf-8') as f:
        json.dump(receipt, f, indent=2); f.write('\n')
    print(json.dumps(receipt))


if __name__ == '__main__':
    main()
