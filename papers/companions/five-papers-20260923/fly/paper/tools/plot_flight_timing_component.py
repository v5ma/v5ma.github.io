"""Measured plots from frozen local replay outputs; no model rerun."""
import ctypes
import hashlib
import json
import os
from pathlib import Path
import time
ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "application/flight-timing-component-v0"
OUT = APP / "figures-01"
os.environ.setdefault("MPLCONFIGDIR", str(APP / "plot-cache"))
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def read(path):
    return json.loads(path.read_text("utf-8"))


def main():
    started = time.perf_counter()
    if os.name == "nt":
        kernel = ctypes.WinDLL("kernel32", use_last_error=True)
        kernel.GetCurrentProcess.restype = ctypes.c_void_p
        kernel.SetPriorityClass.argtypes = [ctypes.c_void_p, ctypes.c_uint]
        if not kernel.SetPriorityClass(kernel.GetCurrentProcess(), 0x4000):
            raise OSError("Priority selection failed")
    audit_path = APP / "network-run-01/SEPARATE-CHECKS.json"
    audit = read(audit_path)
    assert audit["status"] == "pass"
    OUT.mkdir(exist_ok=False)
    plt.rcParams.update({"font.size": 10, "axes.spines.top": False, "axes.spines.right": False})
    names = [row["name"] for row in audit["cases"]]
    labels = ["SNL · weak", "SNL · none", "SNL · strong", "SNIC · weak", "SNL · weak\nhalf step"]
    colors = ["#147D92", "#777777", "#B14A3B", "#7C59A4", "#266B3E"]
    fig = plt.figure(figsize=(10.6, 10.5), layout="constrained")
    grid = fig.add_gridspec(4, 2, height_ratios=[1, 1, .95, .2])
    for i, name in enumerate(names[:4]):
        ax = fig.add_subplot(grid[i // 2, i % 2])
        trains = read(APP / "network-run-01" / name / "SPIKES.json")["trains"]
        ax.eventplot([[x for x in s if 2000 <= x <= 2600] for s in trains],
                     lineoffsets=range(1, 6), linelengths=.65, linewidths=1.7, colors=colors[i])
        ax.set(xlim=(2000, 2600), ylim=(.4, 5.6), yticks=range(1, 6),
               xlabel="Model time (ms)", ylabel="Model cell", title=labels[i])
        ax.grid(axis="x", alpha=.15)
    ax = fig.add_subplot(grid[2, 0])
    values = [r["splayness"] for r in audit["cases"]]
    ax.bar(range(5), values, color=colors, width=.6)
    ax.set(xticks=range(5), xticklabels=labels, ylim=(0, 1.15), ylabel="Splayness", title="Even spacing, not simply low coherence")
    ax.tick_params(axis="x", labelsize=8)
    for i, value in enumerate(values):
        ax.text(i, value + .035, f"{value:.4f}", ha="center", fontsize=9)
    ax = fig.add_subplot(grid[2, 1])
    for i, row in enumerate(audit["cases"]):
        ax.scatter(np.full(5, i), row["medianLateFrequenciesHz"], color=colors[i], s=45)
    ax.set(xticks=range(5), xticklabels=labels, ylim=(0, 10), ylabel="Median late firing rate (Hz)", title="Same model cells; rate can also change")
    ax.tick_params(axis="x", labelsize=8)
    ax.grid(axis="y", alpha=.2)
    note = fig.add_subplot(grid[3, :])
    note.axis("off")
    note.text(0, .7, "Published-model replay, one chosen initialization per case; no animal recordings analyzed.\n"
              "Halving the step changes splayness by 0.000333, but does not certify pointwise voltage convergence.\n"
              "SNL vs SNIC changes both potassium conductance and injected current. No uncertainty bars are claimed.",
              va="center", fontsize=9)
    fig.suptitle("Five-cell motor timing: retained controls and measured outcomes", fontsize=14)
    fig.savefig(OUT / "FIVE-CELL-CONTROLS.png", dpi=170)
    plt.close(fig)

    fig, axes = plt.subplots(2, 2, figsize=(10.6, 6.6), layout="constrained")
    for i, regime in enumerate(("SNL", "SNIC")):
        with np.load(APP / "native-audit-01" / (regime + "-NATIVE-REPLAY.npz"), allow_pickle=False) as data:
            t, ref, replay = data["timeMs"], data["native"], data["replay"]
            axes[0, i].plot(t, ref[0], color="#303030", lw=1.4, label="Author-saved numeric output")
            axes[0, i].plot(t[::7], replay[0, ::7], linestyle="none", marker=".", ms=1.5, color="#C25C25", label="Local equation replay (markers)")
            axes[0, i].set(xlim=(0, 2000), xlabel="Model time (ms)", ylabel="Voltage (mV)", title=regime + " · native initial state")
            axes[0, i].legend(loc="upper right", fontsize=7)
            axes[1, i].plot(t, replay[0] - ref[0], color="#147D92", lw=.8)
            axes[1, i].set(xlim=(0, 2000), xlabel="Model time (ms)", ylabel="Voltage residual (mV)")
            axes[1, i].ticklabel_format(axis="y", style="sci", scilimits=(0, 0))
            axes[1, i].grid(alpha=.2)
    fig.suptitle("Native single-cell fidelity: 120,000 state values, no parameter fit", fontsize=14)
    fig.savefig(OUT / "NATIVE-SINGLE-CELL-FIDELITY.png", dpi=170)
    plt.close(fig)
    files = [{"file": name, "sha256": sha(OUT / name)} for name in ("FIVE-CELL-CONTROLS.png", "NATIVE-SINGLE-CELL-FIDELITY.png")]
    manifest = {"scriptSha256": sha(Path(__file__)), "networkAuditSha256": sha(audit_path),
                "nativeAuditSha256": sha(APP / "native-audit-01/EXECUTION.json"),
                "files": files, "modelRerun": False, "biologicalData": False,
                "visualInspection": "Pending separate readback", "seconds": time.perf_counter() - started}
    with (OUT / "MANIFEST.json").open("x", encoding="utf-8") as stream:
        json.dump(manifest, stream, indent=2)
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
