# Archived transformation and observation-selection audit

19 September 2026. Follow-on to the immutable
[Draft 16 audit](HUE-INPUT-RECONSTRUCTION-AND-SCORE-CONTRACT-20260919.md).
Source recovery and measured comparison are distinct outputs.

## Exact source route

The already pinned repository is GitLab project 51649890 at commit
`91cf92581d2abaea72b96a994d69ed6d83ae05f9`. This audit adds the fully read
[pls.py](../../access/c8fe172224a3ba4f.md), its
[bounded intake receipt](../../access/aea9c6b9fd4cd9af.md), and
at most five history records for the exact transform path. The request returns
one root commit and no next page. It supplies no earlier plain-source definition.

The known package tree lists a tracked `__pycache__` directory. The
[one-directory metadata request](../../access/be4022710704fb5f.md)
returns 26 entries, including exactly named `transform.cpython-38.pyc`. Its
[pinned acquisition](../../access/4f14c3b62354c368.md)
contains 5,633 bytes, Git blob `e5c57d12b08d79248a27c8e72869e5c27212b230`,
SHA-256 `e87d974b7be5a4201d3aed70888828f875bd35f34c038cf0beb5947d609b954f`.

The [static reader](../tools/read_hue_transform_cache.py) decodes inert data
structures only. It never constructs executable Python code objects, imports
the cache or interprets its instructions. Format field order and instruction
names were checked against the official
[CPython marshal reader](https://github.com/python/cpython/blob/v3.8.18/Python/marshal.c)
and [opcode table](https://github.com/python/cpython/blob/v3.8.18/Lib/opcode.py),
preserved in [intake 41](../../access/51c33809af174c0c.md).
The entire marshal payload is consumed; 26 function/module code-data objects
are recorded. The two targeted transformation bodies and their default-argument
construction were inspected, with identity/contrast checked against functions
also present in plain source. This is not a claim to have reviewed or executed
every archived function. Four malformed/truncated inputs are rejected.

## Recovered operation and provenance boundary

At cached source lines 17 and 26, respectively, the instruction operands give:

```
excitation(X,n) = X**n / (X**n + 1)
excitation_contrast(X,n) = excitation(X,n) - 0.5
default n = 1
```

The default tuple is stored by module instructions at offsets 90–98. The
reviewed AllRegression source multiplies excitation_contrast by two. Its
numerical transcription is consequently `2*(q/(q+1)-0.5)`, not a formula chosen
from compiled-response residuals. The function name's presence alone was not
treated as sufficient evidence; constants, operands and instructions were read.

The cache header records source time `2023-10-02T12:51:45Z` and 3,896 source
bytes. The current plain source differs. The header date is embedded metadata,
not independently authenticated public custody or proof of the article's
runtime. Static recovery closes the missing-definition question only to that
declared archived-artifact scope. The original run's exact dataset key,
normalization, dependency versions and export call remain unverified.

## From layout to executable selection

The [metadata-only layout check](../application/hue-observation-selection-v0/layout-01/LAYOUT-CHECKS.json)
tests both orientations, not a response-selected reshape. The same anonymous
index admits a stimulus-major arrangement with constant LED values by row and
constant SNR by column in every type. Both orientations have rectangular
counts; only stimulus-major passes the field-consistency checks. Its eight
shapes are 601×289, 716×257, 755×354, 504×528, 387×249, 377×182, 243×195 and
554×396, for Tm20, Tm5a, Tm5b, Tm5c, pR7, pR8, yR7 and yR8 respectively.
Columns are anonymous combinations, not certified biological individuals.

The [grouping plan](../application/hue-observation-selection-v0/GROUPING-RECONSTRUCTION-PLAN.md)
is fixed before the response-group result. It uses a five-opsin source-shaped
capture matrix and the archived transform. The local two-component NIPALS
procedure preserves no-centering/no-scaling and regression deflation. Its
orthogonal factorization uses NumPy instead of the uninstalled/unpinned SciPy
environment. The source's PLS file credits Edouard Duchesnay and BSD 3 clause;
that derivative provenance cannot be replaced with an assumed blanket license.
Publication rights review remains open.

The grouping source calculates a mode using 24 angular bins, then uses four
half-open bins with BINSIZE=pi/2. The inline phrase “45 degree” is inconsistent
with that numeric parameter. This audit follows 90°, records the discrepancy,
and does not silently repair the historical file. Modal-centered group zero is
the predeclared primary group. The exact native export selector remains unknown.

The producer records and hashes all arrays before compiled responses are opened
by the separate comparison. All 18 required samples are either present or
absent together. Missing entries become zeros only in the PLS fitting copy;
group response means and counts omit absent observations. It is an in-sample
grouping reconstruction, not a predictive test set.

## Mixed outcome, not a recovered native selector

The [complete comparison](../application/hue-observation-selection-v0/comparison-01/GROUPING-COMPARISON.json)
records 2,508 joint amplitude/count matches, versus 2,167 for all columns.
There are 607 newly matching rows and 266 lost prior matches. The complete
transition table is 1,901 preserved agreements, 607 new agreements, 266 losses,
and 1,187 persistent disagreements. Thirty-four of the 1,453 unmatched rows
have an empty selected pool. The largest finite absolute response difference
is 1.415857448371419. Count-only agreement occurs for 61 additional rows, so
matching counts cannot identify matching selected observations.

No sensitivity set, exponent or post-hoc group is searched to eliminate these
differences. Both original and new adverse results remain intact. This test
supports the relevance of selection to the export discrepancy but does not
establish that the tested selector is the one originally used. It does not
identify an error in the biological experiment or prove a SAN effect.

## Verification and next precise dependency

[Separate checks](../application/hue-observation-selection-v0/checks-01/CHECKS.json)
recalculate all complete source windows, both PLS components for all types
against the isolated reviewed helper, every angle, all group means/counts and
all comparison rows. Numerical bounds and corruption tests are recorded there.
They do not constitute independent human/agent review. The accepted
[measured figure](../application/hue-observation-selection-v0/VISUAL-READBACK.md)
shows losses as well as gains.

The next useful recovery target is the actual dataset/group key or exact
export-generation statement, not a further unconstrained parameter sweep.
Named repository plotting/export routes may be inspected only through a new
bounded plan and exact manifest. If those do not recover the contract, retain
that limitation and develop other already specified components without calling
the original hue model fully reproduced. Final effective weights, fitted
parameters, temporal physiology and original biological identities remain
separate dependencies. The full SAN loop remains the constructive paper's
object. Book, wiki, providers, catalogs, sealed sessions and Git were untouched.
