"""Two bounded data figures; no model execution or external downloads."""
import os
os.environ['OMP_NUM_THREADS'] = '1'
import csv
import hashlib
import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'figures/gpt2-learning-06'
SOURCES = [ROOT / 'results/gpt2-learning-eval-06/metrics.csv', ROOT / 'reviews/gpt2-learning-06/ROLE-PAIR-SUMMARY.csv']

def rows(path):
    with path.open(newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))

def main():
    if OUT.exists():
        raise FileExistsError('Do not overwrite figure artifacts.')
    OUT.mkdir(parents=True)
    metrics = {r['arm']: r for r in rows(SOURCES[0]) if r['split'] == 'heldout'}
    paired = {r['arm']: r for r in rows(SOURCES[1])}
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 10, 'axes.spines.top': False, 'axes.spines.right': False})
    arms = ['clean_text', 'corrupted_no_edit', 'internal', 'task', 'yoked', 'supervised_ridge', 'oracle_current_donor']
    labels = ['Clean text', 'Corrupted', 'Internal\nfeedback', 'Task\nfeedback', 'Yoked\nfeedback', 'Supervised\nridge', 'Donor\noracle']
    fig, axes = plt.subplots(1, 2, figsize=(12, 4.6))
    x = np.arange(len(arms))
    for ax, field, limit, title in [(axes[0], 'correct_tokens', 16, 'Individual native answers'), (axes[1], 'both_roles_correct', 8, 'Both opposite roles correct')]:
        vals = [int(paired[a][field]) for a in arms]
        ax.bar(x, vals, color=['#596b79', '#9a9a9a', '#177d7f', '#4f658d', '#b07c42', '#746080', '#596b79'])
        for i, v in enumerate(vals):
            ax.text(i, v + .18, str(v), ha='center')
        ax.set_xticks(x, labels, fontsize=8)
        ax.set_ylim(0, limit + 1.5)
        ax.set_yticks(range(0, limit + 1, 2))
        ax.set_title(title)
        ax.set_ylabel(f'Count out of {limit}')
    fig.suptitle('GPT-2 learned edits: accuracy gains can conceal role collapse', fontsize=14)
    fig.text(.5, .03, '16 cases / 8 paired families, one checkpoint. Right panel is a post-hoc diagnostic; controls have different information.', ha='center', fontsize=9)
    fig.tight_layout(rect=(0, .09, 1, .94))
    fig.savefig(OUT / 'paired-role-results.png', dpi=160)
    plt.close(fig)
    arms = ['corrupted_no_edit', 'internal', 'post_attack_guarded', 'post_attack_unverified', 'revoked_edit']
    labels = ['Unedited', 'Learned', 'Forgery\nrejected', 'Forgery\naccepted', 'Edit\nrevoked']
    fig, axes = plt.subplots(1, 2, figsize=(10.5, 4.5))
    x = np.arange(len(arms)); width = .36
    for offset, key, label, color in [(-width/2, 'target_top1', 'Correct output', '#177d7f'), (width/2, 'raw_unauthorized', 'Prohibited proposal', '#b45f45')]:
        vals = [int(metrics[a][key]) for a in arms]
        axes[0].bar(x + offset, vals, width, label=label, color=color)
        for i, v in enumerate(vals):
            axes[0].text(i + offset, v + .2, str(v), ha='center', fontsize=9)
    axes[0].set_ylim(0, 17); axes[0].set_ylabel('Count out of 16'); axes[0].legend(fontsize=9)
    axes[0].set_xticks(x, labels, fontsize=9); axes[0].set_title('Unchanged accuracy hides more prohibited proposals')
    error = [float(metrics[a]['mean_downstream_error']) for a in arms]
    axes[1].bar(x, error, color='#596b79')
    for i, v in enumerate(error):
        axes[1].text(i, v + .025, f'{v:.3f}', ha='center')
    axes[1].axhline(1, color='#888888', ls='--', lw=1)
    axes[1].set_ylim(0, 1.25); axes[1].set_ylabel('Relative downstream state error')
    axes[1].set_xticks(x, labels, fontsize=9); axes[1].set_title('State error is a separate outcome')
    fig.text(.5, .025, 'All prohibited virtual executions were blocked by the separate trusted monitor. No real-world action occurred.', ha='center', fontsize=9)
    fig.tight_layout(rect=(0, .09, 1, 1))
    fig.savefig(OUT / 'learning-authority-results.png', dpi=160)
    plt.close(fig)
    files = SOURCES + [Path(__file__), OUT / 'paired-role-results.png', OUT / 'learning-authority-results.png']
    receipt = {'status': 'GENERATED', 'visually_inspected': False, 'sources_and_outputs': {str(p.relative_to(ROOT)): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}, 'post_hoc_panel_labeled': True, 'independent_models': 1}
    (OUT / 'GENERATION-RECEIPT.json').write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8')
    print('Two fixed-data figures generated.')

if __name__ == '__main__':
    main()
