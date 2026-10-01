# Author-saved native memory curves: audit

19 September 2026. Complements, without replacing, the earlier [memory source audit](MEMORY-COMPONENT-SOURCE-AUDIT-20260919.md).

## Question and external reference

The earlier local replay agreed with a separate scalar implementation, but two implementations could share a mistranslation. The pinned public repository also contains author-generated MATLAB figures. Their embedded numerical data provide an external output reference that does not require installing or executing MATLAB.

The repository's `matlab_code/model_fitting/figures` tree was inspected through one exact Git tree. Four `.fig` and two `.mat` files were retrieved at commit `5d7c08a9a88f923169a0c3008aca68af421e9a7f`. The request manifests, access receipts and SHA-256 values remain under `sources/memory-component-intake-06` and `-07`. Large recording archives, TIFF copies and the parameter-comparison spreadsheet were not downloaded.

The saved comparison plan declared the fitting schedule and matching April-labelled parameter snapshot as primary, with the earlier March-labelled files and Figure 5c schedule as retained sensitivities. The tolerance was 10⁻⁸ Hz. Neither model parameters nor tolerances were fitted to the extracted output curves.

## Decoding and results

Only `hgS_070000`, `para_mu` and required parameter-bound arrays were decoded. Curve selection used neuron-title strings, source plotting conventions and MATLAB graphics object types. Callback properties and function workspaces were not executed. There are 40 model curves with six values each and 40 experimental-mean/SEM curves, retaining missing values.

The local fitting-schedule replay reproduces all 240 model values within 9.77 × 10⁻¹⁵ Hz. Each native mean and SEM matches the source workbook extraction. A separate checker verified source/output hashes, unique curve identities, the raw figure values, every saved point error and all aggregate statistics: 1,428/1,428 checks in 0.061 seconds. This is a same-agent software cross-check; no independent review is claimed.

The March- and April-labelled files contain exactly the same optimized parameters and expanded model cells. Different filenames are therefore not independent parameter estimates. The native output comparison also validates the parameters already used in v0, not just a newly selected better fit. Earlier fitting-versus-Figure-5c timing discrepancies persist: the figure schedule differs from the saved fitting curves by up to 4.285 Hz (two modules) and 4.142 Hz (three modules).

## What changed in the evidence classification

Before: local saved-parameter replay with two numerical implementations and workbook readback.

Now: those checks **plus agreement with externally generated, author-saved native point predictions**, under an exact source schedule. This strengthens the implementation-fidelity claim and identifies which saved output the schedule reproduces. It does not make the experimental fit a held-out test or turn model agreement into a SAN-specific result.

## What remains open

The paper's Figure 5c uncertainty display samples 10,000 parameter vectors. Saved optimized-vector curves do not generally equal Monte Carlo medians or quantiles. That sweep is not reproduced here. No native MATLAB process was run, no new optimization was performed, and no biological recordings were reanalyzed.

The attempted exact supplementary-discussion PDF request failed to resolve its host. The mathematical supplement is a separately identified file, not the downloaded article XML. Neither PDF is falsely counted as read. Existing source-code and article-method audits remain valid within their declared coverage.

The connected SAN sensory/receiver/body-world application, temporal phase mechanism, raw-data physiological test and independent scientific review remain separate dependencies. The successful reference comparison must not be used to imply that they are complete.

[Readable evidence index](../application/memory-native-reference-v1/README.md)
