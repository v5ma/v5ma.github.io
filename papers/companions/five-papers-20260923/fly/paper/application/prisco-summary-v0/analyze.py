"""Bounded descriptive readback of four selected Prisco/Dryad files.

No per-fly inference, phase estimate, model fit, or SAN architecture test is
performed. The Figure 5C workbook reports summaries, not raw traces.
"""

from __future__ import annotations

import hashlib
import json
from pathlib import Path
from statistics import mean

from openpyxl import load_workbook


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "sources" / "apl-named-tables-intake-50"
OUT = Path(__file__).resolve().parent / "results"
IDS = (1282860, 1282863, 1282869, 1282879)


def audited_source(file_id: int) -> Path:
    metadata = json.loads((SOURCE / f"{file_id}.json").read_text(encoding="utf-8"))
    path = SOURCE / metadata["path"]
    payload = path.read_bytes()
    if len(payload) != metadata["size"]:
        raise AssertionError((file_id, "size", len(payload), metadata["size"]))
    if hashlib.sha256(payload).hexdigest() != metadata["digest"]:
        raise AssertionError((file_id, "sha256"))
    return path


def rows(path: Path) -> list[tuple]:
    book = load_workbook(path, read_only=True, data_only=True)
    if len(book.worksheets) != 1:
        raise AssertionError((path.name, "sheet count"))
    return list(book.worksheets[0].values)


def slope(y: list[float]) -> float:
    x = list(range(1, len(y) + 1))
    xbar, ybar = mean(x), mean(y)
    return sum((a - xbar) * (b - ybar) for a, b in zip(x, y)) / sum((a - xbar) ** 2 for a in x)


def main() -> None:
    files = {file_id: audited_source(file_id) for file_id in IDS}
    locality = rows(files[1282860])
    activity = rows(files[1282863])
    interodor = rows(files[1282869])
    if len(locality) != 7 or len(activity) != 23 or len(interodor) != 11:
        raise AssertionError("Unexpected source worksheet dimensions")
    if locality[1] != ("Z plane", "avg", "SEM", "n", "avg", "SEM", "n"):
        raise AssertionError("Unexpected locality header")
    planes = [int(row[0]) for row in locality[2:]]
    pa_mp = [float(row[1]) for row in locality[2:]]
    fa_mp = [float(row[4]) for row in locality[2:]]
    sem_pa = [float(row[2]) for row in locality[2:]]
    sem_fa = [float(row[5]) for row in locality[2:]]
    counts = [(int(row[3]), int(row[6])) for row in locality[2:]]
    if planes != [1, 2, 3, 4, 5] or any(pair != (8, 8) for pair in counts):
        raise AssertionError("Unexpected Figure 5C planes or displayed n")
    activity_data = [row for row in activity[3:] if any(cell is not None for cell in row)]
    if len(activity_data) != 10 or any(len(row) != 12 for row in activity_data):
        raise AssertionError("Unexpected Figure 4 row count")
    if activity[2] != ("Mean", "SD", "N") * 4:
        raise AssertionError("Unexpected Figure 4 condition schema")
    interodor_data = interodor[1:]
    if len(interodor_data) != 10:
        raise AssertionError("Unexpected inter-odour row count")
    interodor_columns = [list(column) for column in zip(*interodor_data)]
    condition_columns = (0, 3, 6, 9)
    condition_means = [mean(float(row[j]) for row in activity_data) for j in condition_columns]
    roi_n_ranges = [
        [min(int(row[j + 2]) for row in activity_data),
         max(int(row[j + 2]) for row in activity_data)]
        for j in condition_columns
    ]
    on_delta_errors = [
        abs((float(row[3]) - float(row[0])) - float(supplement[2]))
        for row, supplement in zip(activity_data, interodor_data)
    ]
    off_delta_errors = [
        abs((float(row[9]) - float(row[6])) - float(supplement[3]))
        for row, supplement in zip(activity_data, interodor_data)
    ]
    if max(on_delta_errors + off_delta_errors) > 1e-9:
        raise AssertionError("Supplement inter-odour deltas differ from Figure 4 source rows")
    report = {
        "status": "descriptive inspection of published summary workbooks only",
        "source_ids_sha256_verified": list(IDS),
        "figure_5c": {
            "planes": planes,
            "pa_mp_means": pa_mp,
            "fa_mp_means": fa_mp,
            "pa_mp_sem": sem_pa,
            "fa_mp_sem": sem_fa,
            "n_displayed_per_plane": counts,
            "five_summary_point_slopes_per_plane": {
                "pa_mp": slope(pa_mp),
                "fa_mp": slope(fa_mp),
                "difference_pa_minus_fa": slope(pa_mp) - slope(fa_mp),
            },
        },
        "figure_4b_4d": {
            "nonempty_numeric_rows": len(activity_data),
            "column_blocks": ["APL ON Mch", "APL ON Oct", "APL OFF Mch", "APL OFF Oct"],
            "each_block": "Mean, SD, N; source provides no explicit animal IDs",
            "unweighted_mean_of_ten_exported_rows_by_condition": condition_means,
            "displayed_N_range_by_condition": roi_n_ranges,
        },
        "figure_4_supplement_1": {
            "rows": len(interodor_data),
            "apl_on_off_header_text": [interodor[0][2], interodor[0][3]],
            "apl_on_off_numeric_direction": "Oct Mean minus Mch Mean, despite headers saying Mch-Oct",
            "nonmissing_by_column": [sum(value is not None for value in column) for column in interodor_columns],
            "mean_of_available_rows_by_column": [mean(value for value in column if value is not None) for column in interodor_columns],
            "apl_on_delta_matches_figure_4_oct_minus_mch_rows": len(on_delta_errors),
            "apl_off_delta_matches_figure_4_oct_minus_mch_rows": len(off_delta_errors),
            "maximum_delta_identity_error": max(on_delta_errors + off_delta_errors),
            "apl_on_off_columns_not_independent_new_observations": True,
            "columns_not_assumed_paired": True,
        },
        "unresolved": [
            "Dryad Figure 5C summary displays n=8 at every plane, while the eLife Version of Record Figure 5C caption states n=7.",
            "Animal IDs and the underlying per-fly Figure 5C responses are absent from this selected workbook.",
            "The selected workbooks do not measure native gamma phase, a SAN PWD, whole-system rendering, or experience.",
        ],
    }
    OUT.mkdir(exist_ok=True)
    (OUT / "RESULT.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    from matplotlib import pyplot as plt

    fig, ax = plt.subplots(figsize=(7.2, 4.5), dpi=160)
    ax.errorbar(planes, pa_mp, yerr=sem_pa, marker="o", capsize=3, color="#222222", label="PA/MP")
    ax.errorbar(planes, fa_mp, yerr=sem_fa, marker="s", capsize=3, color="#207caa", label="FA/MP")
    ax.set(xlabel="Calyx section (Z plane)", ylabel="APL calcium-transient response ratio", xticks=planes)
    ax.set_title("Prisco et al. Figure 5C: Dryad summary values")
    ax.legend(frameon=False)
    ax.grid(axis="y", alpha=0.2)
    fig.text(0.02, 0.01, "Mean +/- reported SEM; workbook n=8/plane, article caption n=7. Descriptive redraw only.", fontsize=7)
    fig.tight_layout(rect=(0, 0.05, 1, 1))
    fig.savefig(OUT / "figure-5c-descriptive.png")
    plt.close(fig)


if __name__ == "__main__":
    main()
