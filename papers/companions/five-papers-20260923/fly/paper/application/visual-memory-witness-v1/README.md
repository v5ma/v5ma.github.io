# Exact receiving witnesses and historical contrast identity

23 September 2026. Astra correction of findings F01/F02. All earlier files
remain byte-identical. This packet does not replace their source dataset,
results, Figure 20, or physiological interpretation.

## What is corrected

The historical `ordinary_observer` is an algebraically equivalent version of
the same active nearest-prototype learner: its squared distance comparisons
match the original norm comparisons. The 24 matched pairs are implementation
checks, not an independent empirical contest. This does not apply by
association to the differently specified earlier output-history observer.

The notebook projection's kernel has multiple directions. An SVD sign rule
does not select a unique direction across different valid bases. The historical
contrast is now supplied explicitly as 79 hexadecimal binary64 values and a
hash, so another implementation can reconstruct the *same* experiment.

| Historical contrast | SHA-256 of little-endian binary64 vector bytes |
|---|---|
| count_export | `fb1ed30a6d8d24d4e15466d15759d523e7c78bfc9f4e0a351829c45e15e3515a` |
| binary_ge5 | `27035def84e7ec8b3d1edab0238e32560d04a9d3264dc6fe72f2c88b59fd5345` |
| notebook_slice_gt5 | `83ba9ec48936a29858ce4c6ef8ccd3b684fb735eb0b6f21cfca70573555f3e62` |

Full vectors, source IDs, source hashes, stimuli convention and all results are
in [RESULTS.json](results-v1/RESULTS.json). The historical 96 episode decisions
and all 24 equivalent-observer pairs were replayed/checked. The old 16/24
delivered-query result remains a result for those frozen original contrasts.

## Basis-independent witness result

The [protocol](PROTOCOL.md) was fixed before this run. Ordinals refer only to
the pinned 79-input source CSV. Each witness uses two signs and four noise
bounds, eight constructed trials, not eight animals.

| Projection | Exact contrast | Maximum separation | Resolved |
|---|---|---:|---:|
| Count export | e22 − e23 | 0.0194163205141471 | 4/8 |
| All-column binary >=5 | e22 − e23 | 0.0399874791626853 | 6/8 |
| Notebook slice >5 | e28 − e32 | 0.0666108913199599 | 6/8 |
| Notebook slice >5 | e22 | 0 | 0/8 |
| Notebook slice >5 | e23 | 0 | 0/8 |
| Notebook slice >5 | e37 | 0 | 0/8 |

All six contrasts are exactly null before modulation. The first three expose
a difference with selective modulation. The last three remain invisible under
*every* permitted single-column gain because their entire routes are absent.
No fixed-baseline or undelivered-query trial resolves. The notebook's exact
recoverable witness has a different separation from the old SVD mixture's
0.024180950901087295; this is a new declared input, not a revised old result.

## Preprocessing and missing-contact sensitivity

The fixed 20-row sensitivity grid crosses five preprocessing rules with four
exact contrasts. It shows that the strict >5 threshold removes all routes for
ports 22,23,37 whether or not the first target is removed. The new equal-route
contrast e28−e32 becomes exactly null only when both the first target removal
and strict threshold are applied; neither isolated change has that same
effect. The other projections see it already at baseline.

The fixed 12-row hypothetical weak-contact grid adds a declared positive
weight to one original five-contact location per lost port. Any positive
weight removes exact all-state invisibility for that port, although a tiny
gap need not overcome a nonzero disturbance bound. These perturbations are
not inferred missing synapses or native conductances. Exact rank/kernel
claims belong to a specified source representation, not automatically to a
living fly's capacity.

## Verification and execution

[run.py](../../../access/a2332ce2e9cf1193.md) is a one-thread foreground diagnostic; the successful run took
0.875 seconds at below-normal Windows priority. The source CSV/NPY were checked
entry-for-entry. Historical vector round trips, all original decisions, six
exact integer kernel relations, no-wrong-choice conditions, delivered versus
undelivered evidence, and norm matching pass. Separate scalar sums for
baseline/chosen-state responses differ from matrix calculations by at most
2.22e-16; Frobenius mismatch is at most 1.78e-15. These are same-agent checks,
not independent physiological review.

The initial launch stopped at the source-hash gate because the new program
contained a mistyped expected producer hash. No output directory was created
and no source changed. The expected hash was corrected to the directly
rechecked file identity before the single completed run.

[check.py](../../../access/5d813b167a966d1e.md) separately reconstructs the column-gain formula with
Python scalar arithmetic, without NumPy, SVD, stored lessons or producer
imports. Its [checks](../../../access/be32ed5fc37e0db4.md) pass for all three hex vectors,
six witnesses and 48 episode predictions, 20 threshold rows and 12 weak-contact
rows. Maximum separation discrepancy is 2.78e-16. It rechecks eight original
input/artifact hashes. A separately written same-agent checker is not an
independent scientific reviewer.

The program refuses to overwrite `results-v1`. Read the existing results for
review. A later rerun must deliberately use a new versioned destination after
review; do not delete accepted evidence to make a run succeed. The results
hash is `c2a81e4328181601a4ab0869264afc0c81eb07b848bec74d9102961ee6e0ca3b`.

The full joined goal remains: biologically specified receiving state and
timing, PWD throughout NAPOT, multimodal relations, learning, actual return,
and discriminating interventions. These witnesses clarify one operation and
its failure cases; they do not replace that larger construction.
