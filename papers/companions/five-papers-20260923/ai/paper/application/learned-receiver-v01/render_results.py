"""Plot all eight methods and seed-level results, without refitting."""
from pathlib import Path
import json
import os

os.environ['OMP_NUM_THREADS'] = '1'
os.environ['OPENBLAS_NUM_THREADS'] = '1'
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parent
ARMS = ('trajectory', 'history', 'permuted', 'scalar', 'always', 'replay', 'agem', 'frozen')
LABELS = ('Ordered trajectory', 'Complete-history gate', 'Permuted trajectory', 'Scalar gate',
          'Always + protection', 'Replay + protection', 'A-GEM-style + protection', 'Frozen parameters')


def main():
    out = ROOT/'figures-v2'
    if out.exists():
        raise FileExistsError(out)
    out.mkdir()
    result = json.loads((ROOT/'evaluation/RESULT.json').read_text(encoding='utf-8'))
    plt.rcParams.update({'font.family': 'DejaVu Serif', 'font.size': 13})
    fig, axes = plt.subplots(1, 2, figsize=(10, 7.3), sharey=True, constrained_layout=True)
    for family, ax in enumerate(axes):
        for i, arm in enumerate(ARMS):
            group = result['aggregate'][str(family)][arm]
            color = '#1c5578' if arm == 'trajectory' else '#666666'
            ax.scatter(group['seed_mse'], [i-.15, i-.05, i+.05, i+.15], color=color, s=20, alpha=.7)
            ax.plot(group['mean_mse'], i, marker='|', ms=17, color=color, mew=2.3)
        ax.set_xlim(0, .7)
        ax.set_yticks(range(8), LABELS)
        ax.grid(axis='x', alpha=.2)
        ax.set_xlabel('Pre-feedback MSE')
        ax.set_title(('Polynomial holdouts', 'Sinusoidal holdouts')[family])
        ax.spines[['top', 'right']].set_visible(False)
    axes[0].invert_yaxis()
    fig.suptitle('Learned receiver: eight frozen methods', fontsize=16)
    fig.savefig(out/'LEARNED-RECEIVER-HELDOUT.png', dpi=170)
    fig.savefig(out/'LEARNED-RECEIVER-HELDOUT.pdf')
    plt.close(fig)
    print('Two-panel figure saved; dots = four seeds; vertical mark = mean.')


if __name__ == '__main__':
    main()
