# Temporal-access diagnostic v01

Completed exploratory diagnosis, September 8, 2026. This uses only training and development cases from the existing matched-context study. No held-out inference or recurrent refitting was performed. It does not rescue that study's failed temporal result.

Start with the [plain-language result and claim map](../../../access/d92cac735a6ff889.md). The [protocol](PROTOCOL.md) and [configuration](CONFIG.json) were fixed before these diagnostic fits, but after the original study's held-out results had been inspected. The [current pre-run receipt](TESTS-02.json) records 27 passing checks. The older test receipt and code snapshot remain preserved; the second version added deadline-state preservation before any fit.

## Recorded evidence

- [First result](run-01/RESULT.json) and [replay](run-replay-01/RESULT.json).
- [Numeric predictions and feature snapshots](run-01/predictions.npz).
- [Readout parameters, including selected and final epochs](run-01/readout-parameters.npz).
- [Aggregated results](SUMMARY-01.json) and [315-check internal audit](AUDIT-01.json).
- [Readout implementations](probes.py), [bounded runner](run_diagnostic.py), [pre-run tests](test_diagnostic.py) and [audit](audit.py).

Fifty small nonlinear fits used one CPU process and one numerical thread, taking about 4.7 seconds in total; the complete first diagnostic took about 5.5 seconds. The numeric predictions and readout parameters replay exactly. Original encoders remain unchanged. No data, model or library download was required.

## Interpretation

The raw eight-case relation can be learned by a small nonlinear readout, but this bypasses learned memory and uses the same eight focal cases in training and development. Final-state and two-snapshot readouts fit training data much better than development data. Development-selected random-label controls score similarly to the small real-label improvements. Fixed-final-epoch scores are close to chance. A second hidden snapshot also adds an access resource; it is not a better readout of the same final state.

The component readout applies a supplied relation rule. Its error bound is an elementary sufficient condition, not a new theorem or evidence that absolute components must be available whenever a relation is available. An exact relative-code counterexample preserves the relation while leaving either absolute component only one-quarter predictable.

These are implementing-assistant checks, not independent review or biological evidence. Do not promote development-selected scores into held-out claims. Select a future learning strategy using development evidence, then freeze a new evaluation boundary. Do not rerun these versioned result destinations: the runner deliberately refuses to overwrite them.
