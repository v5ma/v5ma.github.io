# Reproduction and limits

Use Python 3.11 or newer. NumPy is required for the fly, AI and temporal checks. No GPU, network download, or installation is performed by this launcher; provision dependencies separately.

Run from the extracted companion:

```text
python portable_check.py --output /an/unused/output/folder
```

On Windows use a new folder on D:, for example `D:/research-checks/paper-113-run1`. The launcher refuses to write within the frozen companion or overwrite an existing run. It caps numerical libraries to one CPU thread and uses below-normal priority on Windows.

The printed scope specifies exactly what was recomputed. The composition and temporal checks rerun their final finite diagnostic. The AI check reruns all eight final streams and compares the result plus all 64 event ledgers byte for byte, using the supplied fitted receiver/gates; this is not retraining. The fly check reconstructs observer/actuator arithmetic from the supplied synthetic cases, not the unbundled anatomical matrix. The plasticity check recomputes the exact rational causal construction, not the two unbundled raw biological recordings.

The original application source, protocols and results remain under `paper/`. Many older scripts preserve historical absolute provenance paths. The launcher supplies portable paths without altering the frozen algorithms. Data-dependent full reanalyses require the external inputs identified in DATA-ACCESS.md. Do not replace absent inputs with invented files.

For Lean supplements, use the Lean/mathlib versions in their compiler receipts. Compiler/axiom receipts are archived evidence, not a claim of a new compiler run during release preparation. Their theorems prove only their declared formal assumptions, not a biological theory.
