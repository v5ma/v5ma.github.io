# Observation-layout and grouping recovery plan

19 September 2026. Follow-on to the preserved Draft 16 source/data bridge.
The prior turn made progress: all eight shared types' compiled input coordinates
were reconstructed, response/count differences were measured without fitting,
and all previous artifacts remained preserved. The complete paper program is
still active and incomplete.

## Source task

Read the exact pinned `pls.py` referenced by `analysis.py`; inspect at most five
commit-history records for the exact `chreyesees/transform.py` path. If an older
definition is identified, recover only its exact pinned object. Do not scan
other repositories, query private databases, infer credentials, contact authors
or send messages to other tasks. The currently reviewed code calls
`excitation_contrast` without defining/importing it; a guessed replacement must
not be labeled a recovered original.

## Metadata-only layout test

For each Figure 3 cell type, the already recorded total row count is divisible
by its number of distinct LED settings. Test both explicitly declared array
layouts using the anonymous integer index:

- stimulus-major: stimulus = index // column_count, column = index % column_count;
- column-major: stimulus = index % stimulus_count, column = index // stimulus_count.

Verify index uniqueness/coverage, every stimulus block's constant six-channel
LED value, and every proposed column's constant SNR value. Test all eight types
and retain failed layouts. Do not use response amplitudes or compiled matches
to choose the layout. A passing layout establishes an anonymous rectangular
data arrangement only. It does not recover subject, fly, session, recording,
ROI, anatomical or independent-sample identities. Repeated SNR alone is not an
identity key. If the structural tests do not resolve the arrangement, stop that
branch rather than assigning one.

Use one below-normal-priority process and one numerical thread. Query only the
six LED columns, type, SNR and index in this stage; DuckDB memory limit 64 MB.
No recursive file search, regex, background worker, package installation or
unbounded computation is allowed. Any later amplitude-matrix/grouping test
requires a separate frozen extension before its outcomes are inspected.

## Intended consequence

The useful deliverable is a source-faithful observation-selection interface
that either reproduces a named compiled observable or identifies precisely why
it cannot. A generic selector, a subset chosen to fit the exported answers or
an invented biological label is not success. Preserve every earlier result and
all current discrepancies. Do not modify Book, wiki, providers, catalogs,
Git, deployments, sealed sessions or the excluded BICA paper.
