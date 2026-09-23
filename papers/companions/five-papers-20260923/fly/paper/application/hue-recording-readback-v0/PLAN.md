# Publisher recording-data readback: frozen first-pass plan

19 September 2026, Phoenix local date. Written before the newly selected publisher table was opened or its response values inspected. This is a source/measurement reproduction lane within the fly paper, not a new paper or a claim of SAN confirmation.

## Source and scope

The article labels `41593_2024_1640_MOESM5_ESM.zip` as Source Data Figure 3, data for modeling. A bounded ZIP-directory read identifies exactly one member, `Figure 3.parquet`, 124,714,328 uncompressed bytes, CRC32 `160074b1`. The archive is 113,509,506 bytes. The article's preserved XML records MD5 `1cafffdcbdbc86c1511376847661e781`. The acquisition is not accepted until actual lengths, member CRC and archive identity have been checked. The source is public article material; local analysis does not itself authorize a provider upload or settle all redistribution questions.

Only this named table and already recovered pinned processing sources enter this pass. No database connection, author module execution, new package installation, broad source search, sealed session, Book edit, or public mutation is permitted. Use one below-normal-priority process and single-threaded column reads. Inspect metadata first; do not eagerly load every trace into memory.

## Checks and dependency tree

1. **Custody:** verify archive MD5 against the article XML, the member size/CRC against the separately retrieved directory, and record SHA-256 identities. Failed/partial retrievals remain explicitly unaccepted.
2. **Table identity:** record row groups, schema, metadata, field meanings that are actually documented, and the presence or absence of recording, animal, cell, stimulus, time and condition identifiers. Column names alone do not establish their semantics. Do not call a model table raw recordings before inspecting it.
3. **Measurement interface:** compare available time arrays, traces and amplitudes against the pinned source settings. The source uses a 25 ms interpolation grid from -500 through 1975 ms, inclusive amplitude samples at 350–500 ms, and inclusive baseline samples at -350 through -100 ms. The source smoothing window is 0.5 s, followed by event-relative interpolation. Apply these only when the table's stage and dimensions match; do not filter an already filtered trace again.
4. **Response reconstruction:** if compatible per-cell/PSTH records are present, reconstruct the declared source endpoint and compare it to the supplied endpoint. Retain every mismatch and all affected row identities. If endpoint or normalization metadata are absent, report that limit instead of choosing a scaling that merely improves agreement.
5. **Export bridge:** determine whether the small `compiled_data.parquet` can be joined to this table by explicit stimulus/condition identities or a documented transformation. Preserve source grouping, counts, excluded cells and normalization. Do not identify a transform merely because it produces a good score. No second logarithm is applied to the small export's already signed coordinates.
6. **Unit of inference:** animal-level or recording-level validation is allowed only when the needed identities survive and their grouping is verified. ROI rows and pooled stimulus means are not automatically independent animals. Published pooling/selection is distinguished from training-only preprocessing.
7. **Acceptance:** a separate calculation checks any numerical endpoint reproduction without importing its implementation. Deliberate perturbations of identity, time-window selection, baseline handling and source hashes must be rejected where applicable. Source readback and synthetic software fixtures are reported separately from biological reanalysis.

## What this pass does not test

It does not fit or select a new SAN model, recover unprovided circuit parameters by assertion, tune a result on sealed sessions, infer fast phase from calcium amplitude, or demonstrate experience. It does not revise any accepted Draft 14 outcome. Any subsequent model comparison needs its own declared split, endpoints, controls, parameter/observation contract, and tolerance before scores are examined.

## Intended deliverable

A source-linked observation contract and, if the table permits it, an executable reproduction of a named published response summary with all mismatches retained. That is a bridge from data to a testable biological component; it is not a substitute for the paper's whole learned-receiver, tonic/PWD, NAPOT, multimodal reconstruction, action-return and continual-learning construction.
